"""PDF parser with OCR fallback for scanned documents."""

import io
import tempfile
from pathlib import Path
from typing import Optional

import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from ..config import get_tesseract_cmd, settings
from .base import (
    BaseParser,
    DocumentContent,
    ParsedTable,
    ParserErrorType,
    ParserResult,
)


class PdfParser(BaseParser):
    """Parser for PDF documents with OCR fallback."""

    SUPPORTED_EXTENSIONS = [".pdf"]

    # Minimum characters per page to consider text extraction successful
    MIN_TEXT_THRESHOLD = 50

    def __init__(self):
        """Initialize PDF parser with Tesseract configuration."""
        pytesseract.pytesseract.tesseract_cmd = get_tesseract_cmd()

    def parse(self, file_path: Path) -> ParserResult:
        """Parse PDF document, using OCR for scanned pages."""
        if not file_path.exists():
            return self._create_error_result(
                file_path,
                ParserErrorType.FILE_NOT_FOUND,
                f"File not found: {file_path}",
            )

        result = ParserResult(
            file_path=file_path,
            file_type=".pdf",
            success=True,
        )

        # Check for password protection
        if self._is_password_protected(file_path):
            return self._create_error_result(
                file_path,
                ParserErrorType.PASSWORD_PROTECTED,
                "PDF is password protected. Please provide an unlocked version.",
            )

        try:
            with pdfplumber.open(file_path) as pdf:
                result.total_pages = len(pdf.pages)
                result.metadata = self._extract_metadata(pdf)

                for page_num, page in enumerate(pdf.pages, start=1):
                    self._process_page(result, page, page_num, file_path)

        except Exception as e:
            error_msg = str(e)
            if "password" in error_msg.lower() or "encrypted" in error_msg.lower():
                return self._create_error_result(
                    file_path,
                    ParserErrorType.PASSWORD_PROTECTED,
                    "PDF is password protected or encrypted.",
                )

            return self._create_error_result(
                file_path,
                ParserErrorType.FILE_CORRUPTED,
                f"Failed to parse PDF: {error_msg}",
            )

        return result

    def _is_password_protected(self, file_path: Path) -> bool:
        """Check if PDF is password protected using pypdf."""
        try:
            reader = PdfReader(file_path)
            return reader.is_encrypted
        except PdfReadError:
            return False
        except Exception:
            return False

    def _extract_metadata(self, pdf: pdfplumber.PDF) -> dict:
        """Extract PDF metadata."""
        metadata = {}
        if pdf.metadata:
            for key, value in pdf.metadata.items():
                if value and isinstance(value, str):
                    clean_key = key.lstrip("/")
                    metadata[clean_key] = value
        return metadata

    def _process_page(
        self,
        result: ParserResult,
        page: pdfplumber.page.Page,
        page_num: int,
        file_path: Path,
    ) -> None:
        """Process a single PDF page, using OCR if needed."""
        # Try text extraction first
        text = page.extract_text() or ""
        tables = page.extract_tables() or []

        # Check if OCR is needed
        needs_ocr = len(text.strip()) < self.MIN_TEXT_THRESHOLD and not tables

        if needs_ocr:
            ocr_result = self._ocr_page(file_path, page_num)
            if ocr_result:
                text = ocr_result["text"]
                confidence = ocr_result["confidence"]
                result.ocr_used = True

                if confidence < settings.min_ocr_confidence:
                    result.warnings.append(
                        f"Page {page_num}: Low OCR confidence ({confidence:.1f}%). "
                        "Text extraction may be inaccurate."
                    )
                    result.add_error(
                        ParserErrorType.LOW_QUALITY_SCAN,
                        f"Low OCR confidence: {confidence:.1f}%",
                        page_number=page_num,
                        recoverable=True,
                    )

                result.content_sections.append(
                    DocumentContent(
                        text=text,
                        page_number=page_num,
                        confidence=confidence / 100.0,
                        metadata={"ocr": True},
                    )
                )
            else:
                result.add_error(
                    ParserErrorType.OCR_FAILED,
                    "OCR extraction failed",
                    page_number=page_num,
                    recoverable=True,
                )
        else:
            # Use extracted text
            if text.strip():
                result.content_sections.append(
                    DocumentContent(
                        text=text,
                        page_number=page_num,
                        confidence=1.0,
                    )
                )

        # Process tables
        for table_data in tables:
            if table_data and len(table_data) > 1:
                parsed_table = self._parse_table(table_data, page_num)
                if parsed_table:
                    result.tables.append(parsed_table)

    def _ocr_page(self, file_path: Path, page_num: int) -> Optional[dict]:
        """Perform OCR on a specific PDF page."""
        try:
            # Convert specific page to image
            images = convert_from_path(
                file_path,
                first_page=page_num,
                last_page=page_num,
                dpi=settings.ocr_dpi,
            )

            if not images:
                return None

            image = images[0]

            # Perform OCR with confidence data
            ocr_data = pytesseract.image_to_data(
                image,
                lang=settings.ocr_language,
                output_type=pytesseract.Output.DICT,
            )

            # Calculate average confidence
            confidences = [
                int(conf)
                for conf, text in zip(ocr_data["conf"], ocr_data["text"])
                if conf != -1 and text.strip()
            ]

            avg_confidence = sum(confidences) / len(confidences) if confidences else 0

            # Extract text
            text = pytesseract.image_to_string(
                image,
                lang=settings.ocr_language,
            )

            return {
                "text": text,
                "confidence": avg_confidence,
            }

        except Exception as e:
            return None

    def _parse_table(
        self,
        table_data: list[list],
        page_num: int,
    ) -> Optional[ParsedTable]:
        """Convert raw table data to ParsedTable."""
        if not table_data or len(table_data) < 2:
            return None

        # Clean table data
        cleaned_rows = []
        for row in table_data:
            cleaned_row = [
                str(cell).strip() if cell is not None else ""
                for cell in row
            ]
            # Skip completely empty rows
            if any(cleaned_row):
                cleaned_rows.append(cleaned_row)

        if len(cleaned_rows) < 2:
            return None

        # First row as headers, rest as data
        headers = cleaned_rows[0]
        rows = cleaned_rows[1:]

        return ParsedTable(
            headers=headers,
            rows=rows,
            page_number=page_num,
        )
