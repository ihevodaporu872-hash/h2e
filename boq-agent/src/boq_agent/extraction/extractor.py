"""LLM-based BOQ extractor using OpenAI API."""

import json
import logging
from dataclasses import dataclass, field
from typing import Any, Optional

from openai import OpenAI

from ..config import settings
from ..parsers.base import DocumentContent, ParsedTable
from .chunker import TextChunk, TextChunker
from .prompts import ExtractionContext, PromptTemplates

logger = logging.getLogger(__name__)


@dataclass
class ExtractedItem:
    """A single extracted BOQ item."""

    item_number: str
    description: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    rate: Optional[float] = None
    amount: Optional[float] = None
    section: Optional[str] = None
    specifications: Optional[str] = None
    notes: Optional[str] = None
    confidence: float = 1.0
    source_page: Optional[int] = None
    source_chunk: Optional[int] = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "item_number": self.item_number,
            "description": self.description,
            "quantity": self.quantity,
            "unit": self.unit,
            "rate": self.rate,
            "amount": self.amount,
            "section": self.section,
            "specifications": self.specifications,
            "notes": self.notes,
            "confidence": self.confidence,
        }


@dataclass
class ExtractionResult:
    """Result of BOQ extraction from documents."""

    items: list[ExtractedItem] = field(default_factory=list)
    total_chunks_processed: int = 0
    successful_chunks: int = 0
    failed_chunks: int = 0
    average_confidence: float = 0.0
    errors: list[str] = field(default_factory=list)
    raw_responses: list[dict] = field(default_factory=list)


class BOQExtractor:
    """Extracts BOQ items from document content using OpenAI LLM.

    Example:
        >>> extractor = BOQExtractor()
        >>> result = extractor.extract_from_text("Supply and install 100m² of tiles...")
        >>> for item in result.items:
        ...     print(f"{item.description}: {item.quantity} {item.unit}")
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o",
        max_tokens_per_chunk: int = 4000,
        temperature: float = 0.1,
    ):
        """Initialize extractor.

        Args:
            api_key: OpenAI API key. Defaults to settings.openai_api_key.
            model: Model to use for extraction.
            max_tokens_per_chunk: Maximum tokens per chunk.
            temperature: LLM temperature (lower = more deterministic).
        """
        self.api_key = api_key or settings.openai_api_key
        self.model = model
        self.temperature = temperature

        if not self.api_key:
            raise ValueError(
                "OpenAI API key is required. "
                "Set OPENAI_API_KEY environment variable or pass api_key parameter."
            )

        self.client = OpenAI(api_key=self.api_key)
        self.chunker = TextChunker(max_tokens=max_tokens_per_chunk, model=model)

    def extract_from_text(
        self,
        text: str,
        context: Optional[ExtractionContext] = None,
    ) -> ExtractionResult:
        """Extract BOQ items from raw text.

        Args:
            text: Document text to process.
            context: Optional extraction context.

        Returns:
            ExtractionResult with extracted items.
        """
        result = ExtractionResult()

        # Chunk the text
        chunks = self.chunker.chunk_text(text)
        result.total_chunks_processed = len(chunks)

        if not chunks:
            return result

        # Process each chunk
        all_confidences = []

        for chunk in chunks:
            try:
                chunk_context = context or ExtractionContext()
                chunk_context.chunk_index = chunk.index
                chunk_context.total_chunks = chunk.total_chunks

                items, confidence = self._extract_from_chunk(chunk, chunk_context)

                for item in items:
                    item.source_chunk = chunk.index
                    item.source_page = chunk.source_page

                result.items.extend(items)
                result.successful_chunks += 1
                all_confidences.append(confidence)

            except Exception as e:
                logger.error(f"Failed to process chunk {chunk.index}: {e}")
                result.failed_chunks += 1
                result.errors.append(f"Chunk {chunk.index}: {str(e)}")

        # Calculate average confidence
        if all_confidences:
            result.average_confidence = sum(all_confidences) / len(all_confidences)

        return result

    def extract_from_content(
        self,
        contents: list[DocumentContent],
        context: Optional[ExtractionContext] = None,
    ) -> ExtractionResult:
        """Extract BOQ items from DocumentContent objects.

        Args:
            contents: List of document content sections.
            context: Optional extraction context.

        Returns:
            ExtractionResult with extracted items.
        """
        # Prepare documents for chunking
        documents = [
            {
                "text": content.text,
                "page": content.page_number,
                "section": content.section_title,
            }
            for content in contents
        ]

        # Chunk all documents
        chunks = self.chunker.chunk_documents(documents)

        result = ExtractionResult()
        result.total_chunks_processed = len(chunks)

        all_confidences = []

        for chunk in chunks:
            try:
                chunk_context = context or ExtractionContext()
                chunk_context.chunk_index = chunk.index
                chunk_context.total_chunks = chunk.total_chunks

                items, confidence = self._extract_from_chunk(chunk, chunk_context)

                for item in items:
                    item.source_chunk = chunk.index
                    item.source_page = chunk.source_page

                result.items.extend(items)
                result.successful_chunks += 1
                all_confidences.append(confidence)

            except Exception as e:
                logger.error(f"Failed to process chunk {chunk.index}: {e}")
                result.failed_chunks += 1
                result.errors.append(f"Chunk {chunk.index}: {str(e)}")

        if all_confidences:
            result.average_confidence = sum(all_confidences) / len(all_confidences)

        return result

    def extract_from_table(
        self,
        table: ParsedTable,
        context: Optional[ExtractionContext] = None,
    ) -> ExtractionResult:
        """Extract BOQ items from a parsed table.

        Args:
            table: Parsed table to process.
            context: Optional extraction context.

        Returns:
            ExtractionResult with extracted items.
        """
        result = ExtractionResult()
        result.total_chunks_processed = 1

        try:
            system_prompt, user_prompt = PromptTemplates.get_table_prompt(
                headers=table.headers,
                rows=table.rows,
                context=context,
            )

            response = self._call_llm(system_prompt, user_prompt)
            result.raw_responses.append(response)

            items = self._parse_response(response)
            for item in items:
                item.source_page = table.page_number

            result.items = items
            result.successful_chunks = 1

            # Get confidence from response
            if "metadata" in response:
                result.average_confidence = response["metadata"].get("confidence", 0.8)

        except Exception as e:
            logger.error(f"Failed to extract from table: {e}")
            result.failed_chunks = 1
            result.errors.append(str(e))

        return result

    def _extract_from_chunk(
        self,
        chunk: TextChunk,
        context: ExtractionContext,
    ) -> tuple[list[ExtractedItem], float]:
        """Extract items from a single chunk.

        Returns:
            Tuple of (items, confidence).
        """
        system_prompt, user_prompt = PromptTemplates.get_boq_prompt(
            text=chunk.text,
            context=context,
        )

        response = self._call_llm(system_prompt, user_prompt)
        items = self._parse_response(response)

        confidence = 0.8
        if "metadata" in response:
            confidence = response["metadata"].get("confidence", 0.8)

        return items, confidence

    def _call_llm(self, system_prompt: str, user_prompt: str) -> dict:
        """Call OpenAI API and parse JSON response."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            return json.loads(content)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            raise ValueError(f"Invalid JSON response from LLM: {e}")

    def _parse_response(self, response: dict) -> list[ExtractedItem]:
        """Parse LLM response into ExtractedItem objects."""
        items = []

        raw_items = response.get("items", [])

        for raw in raw_items:
            try:
                item = ExtractedItem(
                    item_number=str(raw.get("item_number", "")),
                    description=str(raw.get("description", "")),
                    quantity=self._parse_float(raw.get("quantity")),
                    unit=raw.get("unit"),
                    rate=self._parse_float(raw.get("rate")),
                    amount=self._parse_float(raw.get("amount")),
                    section=raw.get("section"),
                    specifications=raw.get("specifications"),
                    notes=raw.get("notes"),
                    confidence=float(raw.get("confidence", 0.8)),
                )

                # Skip items without description
                if item.description.strip():
                    items.append(item)

            except Exception as e:
                logger.warning(f"Failed to parse item: {e}")
                continue

        return items

    def _parse_float(self, value: Any) -> Optional[float]:
        """Safely parse a value to float."""
        if value is None:
            return None

        try:
            return float(value)
        except (ValueError, TypeError):
            return None
