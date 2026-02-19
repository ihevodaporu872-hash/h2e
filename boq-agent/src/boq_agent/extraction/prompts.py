"""Prompt templates for LLM-based BOQ extraction."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class ExtractionContext:
    """Context for BOQ extraction prompts."""

    project_name: Optional[str] = None
    document_type: Optional[str] = None
    chunk_index: int = 0
    total_chunks: int = 1


class PromptTemplates:
    """Prompt templates for different extraction tasks."""

    SYSTEM_PROMPT = """You are an expert construction estimator and quantity surveyor.
Your task is to extract Bill of Quantities (BOQ) items from tender documents.

You must identify:
1. Work items and their descriptions
2. Quantities with units of measurement
3. Specifications and requirements
4. Any pricing information if available

Output your findings in the exact JSON format specified.
Be precise with quantities and units. If information is unclear, indicate uncertainty.
Do not invent or assume quantities - only extract what is explicitly stated."""

    BOQ_EXTRACTION_PROMPT = """Extract BOQ (Bill of Quantities) items from the following tender document text.

{context_info}

For each work item found, extract:
- item_number: The item reference number if given (or generate a sequential one)
- description: Full description of the work item
- quantity: Numerical quantity (null if not specified)
- unit: Unit of measurement (e.g., m², m³, nr, kg, lm, etc.)
- specifications: Any technical specifications or requirements
- section: The work section this belongs to (e.g., "Earthworks", "Concrete", etc.)
- notes: Any additional notes or conditions

Document text:
---
{text}
---

Respond with a JSON object in this exact format:
{{
    "items": [
        {{
            "item_number": "1.1",
            "description": "Excavation for foundations",
            "quantity": 150.0,
            "unit": "m³",
            "specifications": "Maximum depth 2m, dispose of spoil off-site",
            "section": "Earthworks",
            "notes": "Provisional quantity subject to site conditions"
        }}
    ],
    "metadata": {{
        "confidence": 0.85,
        "items_found": 1,
        "incomplete_items": 0,
        "notes": "Any general observations about the extraction"
    }}
}}

Important:
- Extract ALL work items found in the text
- Use standard construction units (m, m², m³, nr, kg, lm, set, lot)
- If quantity is "provisional" or "TBD", set quantity to null and note it
- Include specifications verbatim when provided
- Set confidence based on clarity of the source text (0.0 to 1.0)"""

    SCOPE_EXTRACTION_PROMPT = """Extract scope of work items from the following text.

{context_info}

Identify:
- Work activities and tasks
- Deliverables
- Inclusions and exclusions
- Contractor responsibilities

Document text:
---
{text}
---

Respond with JSON:
{{
    "scope_items": [
        {{
            "activity": "Description of work activity",
            "deliverables": ["List of deliverables"],
            "inclusions": ["What is included"],
            "exclusions": ["What is excluded"],
            "responsibility": "contractor|owner|shared"
        }}
    ],
    "metadata": {{
        "confidence": 0.85,
        "notes": "Observations"
    }}
}}"""

    SPECIFICATION_EXTRACTION_PROMPT = """Extract technical specifications from the following text.

{context_info}

Identify:
- Material specifications
- Performance requirements
- Standards compliance (ASTM, ISO, BS, etc.)
- Quality requirements
- Testing requirements

Document text:
---
{text}
---

Respond with JSON:
{{
    "specifications": [
        {{
            "item": "What this specification applies to",
            "requirements": ["List of requirements"],
            "standards": ["Referenced standards"],
            "testing": "Testing requirements if any",
            "quality_grade": "Grade or quality level"
        }}
    ],
    "metadata": {{
        "confidence": 0.85,
        "notes": "Observations"
    }}
}}"""

    TABLE_EXTRACTION_PROMPT = """The following is a table extracted from a tender document.
Parse this table to extract BOQ items.

Table headers: {headers}
Table data:
{table_data}

{context_info}

Extract each row as a BOQ item. Map columns to:
- item_number: Item/Ref column
- description: Description/Item column
- quantity: Qty/Quantity column
- unit: Unit/UOM column
- rate: Rate/Price column (if present)
- amount: Amount/Total column (if present)

Respond with JSON:
{{
    "items": [
        {{
            "item_number": "1.1",
            "description": "Work item description",
            "quantity": 100.0,
            "unit": "m²",
            "rate": 25.00,
            "amount": 2500.00,
            "section": "Inferred section name"
        }}
    ],
    "metadata": {{
        "confidence": 0.9,
        "items_found": 1,
        "column_mapping": {{
            "item_number": "Ref",
            "description": "Description",
            "quantity": "Qty",
            "unit": "Unit"
        }}
    }}
}}"""

    @classmethod
    def get_boq_prompt(
        cls,
        text: str,
        context: Optional[ExtractionContext] = None,
    ) -> tuple[str, str]:
        """Get system and user prompts for BOQ extraction.

        Returns:
            Tuple of (system_prompt, user_prompt).
        """
        context_info = cls._format_context(context)

        user_prompt = cls.BOQ_EXTRACTION_PROMPT.format(
            context_info=context_info,
            text=text,
        )

        return cls.SYSTEM_PROMPT, user_prompt

    @classmethod
    def get_scope_prompt(
        cls,
        text: str,
        context: Optional[ExtractionContext] = None,
    ) -> tuple[str, str]:
        """Get prompts for scope extraction."""
        context_info = cls._format_context(context)

        user_prompt = cls.SCOPE_EXTRACTION_PROMPT.format(
            context_info=context_info,
            text=text,
        )

        return cls.SYSTEM_PROMPT, user_prompt

    @classmethod
    def get_specification_prompt(
        cls,
        text: str,
        context: Optional[ExtractionContext] = None,
    ) -> tuple[str, str]:
        """Get prompts for specification extraction."""
        context_info = cls._format_context(context)

        user_prompt = cls.SPECIFICATION_EXTRACTION_PROMPT.format(
            context_info=context_info,
            text=text,
        )

        return cls.SYSTEM_PROMPT, user_prompt

    @classmethod
    def get_table_prompt(
        cls,
        headers: list[str],
        rows: list[list[str]],
        context: Optional[ExtractionContext] = None,
    ) -> tuple[str, str]:
        """Get prompts for table extraction."""
        context_info = cls._format_context(context)

        # Format table data
        table_data = "\n".join(
            " | ".join(str(cell) for cell in row)
            for row in rows[:20]  # Limit rows
        )

        user_prompt = cls.TABLE_EXTRACTION_PROMPT.format(
            headers=" | ".join(headers),
            table_data=table_data,
            context_info=context_info,
        )

        return cls.SYSTEM_PROMPT, user_prompt

    @classmethod
    def _format_context(cls, context: Optional[ExtractionContext]) -> str:
        """Format context information for prompts."""
        if not context:
            return ""

        parts = []

        if context.project_name:
            parts.append(f"Project: {context.project_name}")

        if context.document_type:
            parts.append(f"Document type: {context.document_type}")

        if context.total_chunks > 1:
            parts.append(
                f"This is chunk {context.chunk_index + 1} of {context.total_chunks}"
            )

        if parts:
            return "Context:\n" + "\n".join(f"- {p}" for p in parts) + "\n"

        return ""
