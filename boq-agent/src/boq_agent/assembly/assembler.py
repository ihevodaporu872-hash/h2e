"""BOQ assembler for organizing and deduplicating extracted items."""

import re
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Optional

from ..extraction.extractor import ExtractedItem


@dataclass
class BOQSection:
    """A section of the Bill of Quantities."""

    id: str
    name: str
    prefix: str
    items: list[ExtractedItem] = field(default_factory=list)
    subtotal: float = 0.0

    @property
    def item_count(self) -> int:
        return len(self.items)

    def calculate_subtotal(self) -> float:
        """Calculate section subtotal from item amounts."""
        total = 0.0
        for item in self.items:
            if item.amount:
                total += item.amount
            elif item.quantity and item.rate:
                total += item.quantity * item.rate
        self.subtotal = total
        return total


@dataclass
class AssembledBOQ:
    """Complete assembled Bill of Quantities."""

    project_name: str
    sections: list[BOQSection] = field(default_factory=list)
    unclassified_items: list[ExtractedItem] = field(default_factory=list)
    duplicate_items_removed: int = 0
    total_items: int = 0
    subtotal: float = 0.0
    contingency: float = 0.0
    grand_total: float = 0.0

    def calculate_totals(self, contingency_percent: float = 5.0) -> None:
        """Calculate all totals."""
        self.subtotal = sum(s.calculate_subtotal() for s in self.sections)

        # Add unclassified items
        for item in self.unclassified_items:
            if item.amount:
                self.subtotal += item.amount
            elif item.quantity and item.rate:
                self.subtotal += item.quantity * item.rate

        self.contingency = self.subtotal * (contingency_percent / 100.0)
        self.grand_total = self.subtotal + self.contingency
        self.total_items = sum(s.item_count for s in self.sections) + len(
            self.unclassified_items
        )

    def get_all_items(self) -> list[ExtractedItem]:
        """Get all items in order."""
        items = []
        for section in self.sections:
            items.extend(section.items)
        items.extend(self.unclassified_items)
        return items


class BOQAssembler:
    """Assembles extracted items into organized BOQ structure.

    Features:
    - Deduplication of similar items
    - Section classification
    - Item numbering
    - Totals calculation

    Example:
        >>> assembler = BOQAssembler()
        >>> boq = assembler.assemble(extracted_items, project_name="My Project")
        >>> for section in boq.sections:
        ...     print(f"{section.name}: {section.item_count} items")
    """

    # Default section definitions
    DEFAULT_SECTIONS = [
        {
            "id": "preliminaries",
            "name": "PRELIMINARIES & GENERAL",
            "prefix": "1.",
            "keywords": [
                "preliminary", "general", "mobilization", "site establishment",
                "temporary", "facilities", "insurance", "bond", "permit",
            ],
        },
        {
            "id": "demolition",
            "name": "DEMOLITION & SITE CLEARANCE",
            "prefix": "2.",
            "keywords": [
                "demolition", "demolish", "removal", "clearing", "strip",
                "dispose", "disposal", "break up",
            ],
        },
        {
            "id": "earthworks",
            "name": "EARTHWORKS",
            "prefix": "3.",
            "keywords": [
                "excavation", "excavate", "backfill", "fill", "grading",
                "earthwork", "trench", "foundation dig", "soil", "compaction",
            ],
        },
        {
            "id": "concrete",
            "name": "CONCRETE WORKS",
            "prefix": "4.",
            "keywords": [
                "concrete", "reinforcement", "rebar", "formwork", "slab",
                "beam", "column", "foundation", "footing", "pour",
            ],
        },
        {
            "id": "masonry",
            "name": "MASONRY",
            "prefix": "5.",
            "keywords": [
                "masonry", "brick", "block", "wall", "mortar", "pointing",
                "blockwork", "brickwork",
            ],
        },
        {
            "id": "structural_steel",
            "name": "STRUCTURAL STEEL",
            "prefix": "6.",
            "keywords": [
                "steel", "structural steel", "fabrication", "erection",
                "welding", "bolting", "beam", "column", "truss",
            ],
        },
        {
            "id": "roofing",
            "name": "ROOFING & WATERPROOFING",
            "prefix": "7.",
            "keywords": [
                "roof", "roofing", "waterproof", "membrane", "insulation",
                "flashing", "gutter", "downpipe", "cladding",
            ],
        },
        {
            "id": "finishes",
            "name": "FINISHES",
            "prefix": "8.",
            "keywords": [
                "finish", "plaster", "render", "paint", "tile", "floor",
                "ceiling", "wall finish", "screed", "vinyl", "carpet",
            ],
        },
        {
            "id": "doors_windows",
            "name": "DOORS, WINDOWS & GLAZING",
            "prefix": "9.",
            "keywords": [
                "door", "window", "glazing", "glass", "frame", "hardware",
                "ironmongery", "shutter",
            ],
        },
        {
            "id": "mep",
            "name": "MEP SERVICES",
            "prefix": "10.",
            "keywords": [
                "mechanical", "electrical", "plumbing", "hvac", "air conditioning",
                "ventilation", "wiring", "conduit", "pipe", "duct", "drainage",
                "sanitary", "water supply", "fire", "sprinkler",
            ],
        },
        {
            "id": "external",
            "name": "EXTERNAL WORKS",
            "prefix": "11.",
            "keywords": [
                "external", "landscape", "paving", "kerb", "fence", "gate",
                "car park", "road", "pathway", "retaining",
            ],
        },
        {
            "id": "provisional",
            "name": "PROVISIONAL SUMS",
            "prefix": "12.",
            "keywords": [
                "provisional", "prime cost", "pc sum", "allowance",
                "contingency", "daywork",
            ],
        },
    ]

    def __init__(
        self,
        sections: Optional[list[dict]] = None,
        similarity_threshold: float = 0.85,
    ):
        """Initialize assembler.

        Args:
            sections: Custom section definitions. Uses defaults if not provided.
            similarity_threshold: Threshold for duplicate detection (0.0-1.0).
        """
        self.sections = sections or self.DEFAULT_SECTIONS
        self.similarity_threshold = similarity_threshold

    def assemble(
        self,
        items: list[ExtractedItem],
        project_name: str = "Untitled Project",
        contingency_percent: float = 5.0,
    ) -> AssembledBOQ:
        """Assemble items into organized BOQ.

        Args:
            items: List of extracted items to organize.
            project_name: Name of the project.
            contingency_percent: Contingency percentage to add.

        Returns:
            AssembledBOQ with organized sections.
        """
        # Deduplicate items
        unique_items, duplicates_removed = self._deduplicate(items)

        # Create section objects
        boq_sections = [
            BOQSection(
                id=s["id"],
                name=s["name"],
                prefix=s["prefix"],
            )
            for s in self.sections
        ]

        unclassified = []

        # Classify items into sections
        for item in unique_items:
            section = self._classify_item(item)
            if section:
                # Find matching section
                for boq_section in boq_sections:
                    if boq_section.id == section:
                        boq_section.items.append(item)
                        break
            else:
                unclassified.append(item)

        # Renumber items within sections
        for section in boq_sections:
            self._renumber_items(section)

        # Remove empty sections
        boq_sections = [s for s in boq_sections if s.items]

        # Create assembled BOQ
        boq = AssembledBOQ(
            project_name=project_name,
            sections=boq_sections,
            unclassified_items=unclassified,
            duplicate_items_removed=duplicates_removed,
        )

        boq.calculate_totals(contingency_percent)

        return boq

    def _deduplicate(
        self,
        items: list[ExtractedItem],
    ) -> tuple[list[ExtractedItem], int]:
        """Remove duplicate items based on description similarity.

        Returns:
            Tuple of (unique_items, count_removed).
        """
        if not items:
            return [], 0

        unique = [items[0]]
        duplicates = 0

        for item in items[1:]:
            is_duplicate = False

            for existing in unique:
                similarity = self._calculate_similarity(
                    item.description,
                    existing.description,
                )

                if similarity >= self.similarity_threshold:
                    # Merge information (keep higher confidence)
                    if item.confidence > existing.confidence:
                        # Update existing with new item's data
                        if item.quantity and not existing.quantity:
                            existing.quantity = item.quantity
                        if item.unit and not existing.unit:
                            existing.unit = item.unit
                        if item.rate and not existing.rate:
                            existing.rate = item.rate

                    is_duplicate = True
                    duplicates += 1
                    break

            if not is_duplicate:
                unique.append(item)

        return unique, duplicates

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two strings."""
        # Normalize texts
        text1 = self._normalize_text(text1)
        text2 = self._normalize_text(text2)

        return SequenceMatcher(None, text1, text2).ratio()

    def _normalize_text(self, text: str) -> str:
        """Normalize text for comparison."""
        # Lowercase
        text = text.lower()
        # Remove extra whitespace
        text = " ".join(text.split())
        # Remove common filler words
        text = re.sub(r"\b(the|and|or|to|for|of|in|a|an)\b", "", text)
        # Remove punctuation
        text = re.sub(r"[^\w\s]", "", text)
        return text.strip()

    def _classify_item(self, item: ExtractedItem) -> Optional[str]:
        """Classify item into a section based on keywords.

        Returns:
            Section ID or None if unclassified.
        """
        # First check if item already has a section
        if item.section:
            section_lower = item.section.lower()
            for section_def in self.sections:
                if section_def["id"] in section_lower or section_def["name"].lower() in section_lower:
                    return section_def["id"]
                for keyword in section_def["keywords"]:
                    if keyword in section_lower:
                        return section_def["id"]

        # Check description for keywords
        description = item.description.lower()
        specs = (item.specifications or "").lower()
        combined = f"{description} {specs}"

        best_match = None
        best_score = 0

        for section_def in self.sections:
            score = 0
            for keyword in section_def["keywords"]:
                if keyword in combined:
                    # Longer keywords are more specific, worth more
                    score += len(keyword.split())

            if score > best_score:
                best_score = score
                best_match = section_def["id"]

        return best_match

    def _renumber_items(self, section: BOQSection) -> None:
        """Renumber items within a section."""
        for i, item in enumerate(section.items, 1):
            item.item_number = f"{section.prefix}{i}"
