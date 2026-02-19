"""Document content classifier for categorizing extracted text."""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from ..parsers.base import DocumentContent, ParsedTable


class DocumentCategory(Enum):
    """Categories for document content classification."""

    TECHNICAL_SPECIFICATIONS = "technical_specifications"
    DRAWINGS_SCHEDULES = "drawings_schedules"
    SCOPE_OF_WORK = "scope_of_work"
    GENERAL_CONDITIONS = "general_conditions"
    BILL_OF_QUANTITIES = "bill_of_quantities"
    PRICING_SCHEDULE = "pricing_schedule"
    CONTRACT_TERMS = "contract_terms"
    COVER_LETTER = "cover_letter"
    UNKNOWN = "unknown"


@dataclass
class ClassifiedContent:
    """Content with its classification."""

    content: DocumentContent | ParsedTable
    category: DocumentCategory
    confidence: float
    keywords_matched: list[str] = field(default_factory=list)
    is_table: bool = False


class ContentClassifier:
    """Classifies document content into predefined categories."""

    # Keywords and patterns for each category
    CATEGORY_PATTERNS: dict[DocumentCategory, dict] = {
        DocumentCategory.TECHNICAL_SPECIFICATIONS: {
            "keywords": [
                "specification", "technical requirement", "material",
                "performance", "standard", "astm", "iso", "bs en",
                "tolerance", "dimension", "grade", "quality",
                "compliance", "certification", "test", "inspection",
                "submittal", "shop drawing", "manufacturer",
            ],
            "patterns": [
                r"spec(?:ification)?s?\s*(?:section|no\.?|#)",
                r"technical\s+(?:data|specification|requirement)",
                r"material\s+(?:specification|requirement|standard)",
                r"(?:astm|iso|bs\s*en|din|ansi)\s*[\w\-]+",
            ],
            "weight": 1.0,
        },
        DocumentCategory.DRAWINGS_SCHEDULES: {
            "keywords": [
                "drawing", "schedule", "layout", "plan", "elevation",
                "section", "detail", "legend", "scale", "revision",
                "sheet", "reference", "architectural", "structural",
                "mechanical", "electrical", "plumbing", "hvac",
                "door schedule", "window schedule", "finish schedule",
            ],
            "patterns": [
                r"drawing\s*(?:no\.?|number|#|list)",
                r"(?:floor|site|roof)\s*plan",
                r"(?:sheet|dwg)\s*[\w\-]+",
                r"rev(?:ision)?\.?\s*\d+",
                r"scale\s*[:\d]+",
            ],
            "weight": 1.0,
        },
        DocumentCategory.SCOPE_OF_WORK: {
            "keywords": [
                "scope", "work", "task", "activity", "deliverable",
                "milestone", "phase", "include", "exclude", "requirement",
                "responsibility", "obligation", "perform", "provide",
                "install", "supply", "construct", "demolish", "remove",
                "contractor shall", "owner shall", "scope of work",
            ],
            "patterns": [
                r"scope\s+of\s+work",
                r"work\s+(?:scope|description|package)",
                r"contractor\s+(?:shall|will|must)",
                r"(?:include|exclude)[sd]?\s+in\s+(?:scope|work)",
                r"deliverable[s]?",
            ],
            "weight": 1.2,  # Slightly higher weight for scope
        },
        DocumentCategory.GENERAL_CONDITIONS: {
            "keywords": [
                "condition", "term", "clause", "article", "provision",
                "general", "special", "supplementary", "amendment",
                "contract", "agreement", "warranty", "liability",
                "insurance", "bond", "indemnity", "termination",
                "dispute", "arbitration", "force majeure", "notice",
            ],
            "patterns": [
                r"general\s+condition[s]?",
                r"(?:special|supplementary)\s+condition[s]?",
                r"article\s+\d+",
                r"clause\s+\d+",
                r"section\s+\d+\.\d+",
            ],
            "weight": 0.9,
        },
        DocumentCategory.BILL_OF_QUANTITIES: {
            "keywords": [
                "bill of quantities", "boq", "quantity", "item",
                "description", "unit", "rate", "amount", "total",
                "subtotal", "measurement", "preamble", "preliminaries",
                "provisional sum", "prime cost", "pc sum", "daywork",
            ],
            "patterns": [
                r"bill\s+of\s+quantit(?:y|ies)",
                r"b\.?o\.?q\.?",
                r"(?:item|ref)\s*(?:no\.?|#)",
                r"(?:unit|qty|quantity)\s*[:=]",
                r"(?:rate|amount|total)\s*\(?[\$£€]",
            ],
            "weight": 1.3,  # High weight for BOQ
        },
        DocumentCategory.PRICING_SCHEDULE: {
            "keywords": [
                "price", "pricing", "cost", "budget", "estimate",
                "schedule of rates", "unit price", "lump sum",
                "allowance", "contingency", "overhead", "profit",
                "preliminaries", "general requirements",
            ],
            "patterns": [
                r"price\s+schedule",
                r"schedule\s+of\s+(?:rate|price)s",
                r"unit\s+(?:price|rate|cost)",
                r"(?:lump\s+sum|ls)",
                r"[\$£€]\s*[\d,]+\.?\d*",
            ],
            "weight": 1.1,
        },
        DocumentCategory.CONTRACT_TERMS: {
            "keywords": [
                "contract", "agreement", "party", "parties", "execute",
                "effective date", "completion date", "duration",
                "payment", "invoice", "retention", "variation",
                "change order", "extension", "delay", "liquidated damages",
            ],
            "patterns": [
                r"contract\s+(?:document|agreement|term)",
                r"(?:effective|completion|commencement)\s+date",
                r"liquidated\s+damages",
                r"payment\s+(?:term|schedule|condition)",
            ],
            "weight": 0.8,
        },
        DocumentCategory.COVER_LETTER: {
            "keywords": [
                "dear", "sincerely", "regards", "submit", "proposal",
                "tender", "bid", "quotation", "attention", "reference",
                "enclosed", "attached", "hereby", "pursuant",
            ],
            "patterns": [
                r"dear\s+(?:sir|madam|mr|ms)",
                r"(?:yours\s+)?(?:sincerely|faithfully)",
                r"re:\s*",
                r"reference\s*(?:no\.?|#|:)",
            ],
            "weight": 0.7,
        },
    }

    def __init__(self, min_confidence: float = 0.3):
        """Initialize classifier.

        Args:
            min_confidence: Minimum confidence threshold for classification.
        """
        self.min_confidence = min_confidence
        self._compile_patterns()

    def _compile_patterns(self) -> None:
        """Pre-compile regex patterns for performance."""
        self._compiled_patterns: dict[DocumentCategory, list[re.Pattern]] = {}

        for category, config in self.CATEGORY_PATTERNS.items():
            self._compiled_patterns[category] = [
                re.compile(pattern, re.IGNORECASE)
                for pattern in config["patterns"]
            ]

    def classify_content(
        self,
        content: DocumentContent,
    ) -> ClassifiedContent:
        """Classify a single content section.

        Args:
            content: Document content to classify.

        Returns:
            ClassifiedContent with category and confidence.
        """
        text = content.text.lower()
        scores: dict[DocumentCategory, tuple[float, list[str]]] = {}

        for category, config in self.CATEGORY_PATTERNS.items():
            score, matched = self._calculate_score(text, category, config)
            if score > 0:
                scores[category] = (score, matched)

        if not scores:
            return ClassifiedContent(
                content=content,
                category=DocumentCategory.UNKNOWN,
                confidence=0.0,
            )

        # Find best category
        best_category = max(scores, key=lambda k: scores[k][0])
        best_score, matched_keywords = scores[best_category]

        # Normalize confidence to 0-1 range
        max_possible = len(self.CATEGORY_PATTERNS[best_category]["keywords"]) + \
                       len(self.CATEGORY_PATTERNS[best_category]["patterns"]) * 2
        confidence = min(best_score / max_possible * 2, 1.0)

        return ClassifiedContent(
            content=content,
            category=best_category if confidence >= self.min_confidence else DocumentCategory.UNKNOWN,
            confidence=confidence,
            keywords_matched=matched_keywords,
        )

    def classify_table(
        self,
        table: ParsedTable,
    ) -> ClassifiedContent:
        """Classify a table based on headers and content.

        Args:
            table: Parsed table to classify.

        Returns:
            ClassifiedContent with category and confidence.
        """
        # Combine headers and first few rows for classification
        text_parts = table.headers + [
            cell for row in table.rows[:5] for cell in row
        ]
        combined_text = " ".join(text_parts).lower()

        scores: dict[DocumentCategory, tuple[float, list[str]]] = {}

        for category, config in self.CATEGORY_PATTERNS.items():
            score, matched = self._calculate_score(combined_text, category, config)
            if score > 0:
                scores[category] = (score, matched)

        # Tables are more likely to be BOQ or pricing
        if DocumentCategory.BILL_OF_QUANTITIES in scores:
            scores[DocumentCategory.BILL_OF_QUANTITIES] = (
                scores[DocumentCategory.BILL_OF_QUANTITIES][0] * 1.5,
                scores[DocumentCategory.BILL_OF_QUANTITIES][1],
            )

        if not scores:
            return ClassifiedContent(
                content=table,
                category=DocumentCategory.UNKNOWN,
                confidence=0.0,
                is_table=True,
            )

        best_category = max(scores, key=lambda k: scores[k][0])
        best_score, matched_keywords = scores[best_category]

        max_possible = len(self.CATEGORY_PATTERNS[best_category]["keywords"]) + \
                       len(self.CATEGORY_PATTERNS[best_category]["patterns"]) * 2
        confidence = min(best_score / max_possible * 2, 1.0)

        return ClassifiedContent(
            content=table,
            category=best_category if confidence >= self.min_confidence else DocumentCategory.UNKNOWN,
            confidence=confidence,
            keywords_matched=matched_keywords,
            is_table=True,
        )

    def _calculate_score(
        self,
        text: str,
        category: DocumentCategory,
        config: dict,
    ) -> tuple[float, list[str]]:
        """Calculate classification score for a category.

        Returns:
            Tuple of (score, matched_keywords).
        """
        score = 0.0
        matched = []

        # Check keywords
        for keyword in config["keywords"]:
            if keyword.lower() in text:
                score += 1.0
                matched.append(keyword)

        # Check patterns (worth more than keywords)
        for pattern in self._compiled_patterns[category]:
            if pattern.search(text):
                score += 2.0
                matched.append(f"pattern:{pattern.pattern[:30]}")

        # Apply category weight
        score *= config["weight"]

        return score, matched

    def classify_all(
        self,
        contents: list[DocumentContent],
        tables: list[ParsedTable],
    ) -> dict[DocumentCategory, list[ClassifiedContent]]:
        """Classify all content and organize by category.

        Args:
            contents: List of document content sections.
            tables: List of parsed tables.

        Returns:
            Dictionary mapping categories to classified content.
        """
        result: dict[DocumentCategory, list[ClassifiedContent]] = {
            category: [] for category in DocumentCategory
        }

        for content in contents:
            classified = self.classify_content(content)
            result[classified.category].append(classified)

        for table in tables:
            classified = self.classify_table(table)
            result[classified.category].append(classified)

        return result
