"""Base parser interface and common data models."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional


class ParserErrorType(Enum):
    """Types of parsing errors."""

    FILE_NOT_FOUND = "file_not_found"
    FILE_CORRUPTED = "file_corrupted"
    PASSWORD_PROTECTED = "password_protected"
    UNSUPPORTED_FORMAT = "unsupported_format"
    OCR_FAILED = "ocr_failed"
    LOW_QUALITY_SCAN = "low_quality_scan"
    ENCODING_ERROR = "encoding_error"
    UNKNOWN = "unknown"


@dataclass
class ParserError:
    """Represents a parsing error with context."""

    error_type: ParserErrorType
    message: str
    file_path: Optional[Path] = None
    page_number: Optional[int] = None
    recoverable: bool = False
    details: Optional[dict[str, Any]] = None

    def __str__(self) -> str:
        location = ""
        if self.file_path:
            location = f" in {self.file_path.name}"
        if self.page_number is not None:
            location += f" (page {self.page_number})"
        return f"[{self.error_type.value}]{location}: {self.message}"


@dataclass
class ParsedTable:
    """Represents a table extracted from a document."""

    headers: list[str]
    rows: list[list[str]]
    page_number: Optional[int] = None
    confidence: float = 1.0  # OCR confidence if applicable

    @property
    def row_count(self) -> int:
        return len(self.rows)

    @property
    def column_count(self) -> int:
        return len(self.headers) if self.headers else (len(self.rows[0]) if self.rows else 0)

    def to_dict_list(self) -> list[dict[str, str]]:
        """Convert table to list of dictionaries."""
        if not self.headers:
            return []
        return [dict(zip(self.headers, row)) for row in self.rows]


@dataclass
class DocumentContent:
    """Represents extracted content from a document section."""

    text: str
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    confidence: float = 1.0  # OCR confidence if applicable
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class ParserResult:
    """Complete result of parsing a document."""

    file_path: Path
    file_type: str
    success: bool
    content_sections: list[DocumentContent] = field(default_factory=list)
    tables: list[ParsedTable] = field(default_factory=list)
    errors: list[ParserError] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    ocr_used: bool = False
    total_pages: Optional[int] = None

    @property
    def full_text(self) -> str:
        """Concatenate all content sections."""
        return "\n\n".join(section.text for section in self.content_sections)

    @property
    def has_errors(self) -> bool:
        return len(self.errors) > 0

    @property
    def has_warnings(self) -> bool:
        return len(self.warnings) > 0

    def add_error(
        self,
        error_type: ParserErrorType,
        message: str,
        page_number: Optional[int] = None,
        recoverable: bool = False,
    ) -> None:
        """Add an error to the result."""
        self.errors.append(
            ParserError(
                error_type=error_type,
                message=message,
                file_path=self.file_path,
                page_number=page_number,
                recoverable=recoverable,
            )
        )


class BaseParser(ABC):
    """Abstract base class for document parsers."""

    SUPPORTED_EXTENSIONS: list[str] = []

    @classmethod
    def can_parse(cls, file_path: Path) -> bool:
        """Check if this parser can handle the given file."""
        return file_path.suffix.lower() in cls.SUPPORTED_EXTENSIONS

    @abstractmethod
    def parse(self, file_path: Path) -> ParserResult:
        """Parse the document and extract content.

        Args:
            file_path: Path to the document file.

        Returns:
            ParserResult containing extracted content, tables, and any errors.
        """
        pass

    def _create_error_result(
        self,
        file_path: Path,
        error_type: ParserErrorType,
        message: str,
    ) -> ParserResult:
        """Create a failed result with an error."""
        result = ParserResult(
            file_path=file_path,
            file_type=file_path.suffix.lower(),
            success=False,
        )
        result.add_error(error_type, message)
        return result
