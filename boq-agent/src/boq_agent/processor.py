"""Main document processor orchestrating parsing and classification."""

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

from rich.console import Console
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
    TimeElapsedColumn,
)

from .classification import ContentClassifier, DocumentCategory
from .classification.classifier import ClassifiedContent
from .config import settings
from .parsers import (
    BaseParser,
    DocxParser,
    ExcelParser,
    ImageParser,
    ParserError,
    ParserResult,
    PdfParser,
)

logger = logging.getLogger(__name__)
console = Console()


@dataclass
class ProcessingStats:
    """Statistics for document processing."""

    total_files: int = 0
    successful: int = 0
    failed: int = 0
    ocr_used: int = 0
    total_pages: int = 0
    total_tables: int = 0
    total_content_sections: int = 0
    errors: list[ParserError] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


@dataclass
class ProcessedDocument:
    """Result of processing a single document."""

    file_path: Path
    parser_result: ParserResult
    classified_content: dict[DocumentCategory, list[ClassifiedContent]]


@dataclass
class ProcessingResult:
    """Complete result of processing all documents."""

    documents: list[ProcessedDocument]
    stats: ProcessingStats
    all_content_by_category: dict[DocumentCategory, list[ClassifiedContent]]

    def get_category_text(self, category: DocumentCategory) -> str:
        """Get all text content for a category."""
        texts = []
        for classified in self.all_content_by_category.get(category, []):
            if not classified.is_table:
                texts.append(classified.content.text)
        return "\n\n".join(texts)


class DocumentProcessor:
    """Main processor for extracting and classifying document content.

    Handles multiple file formats (PDF, DOCX, XLSX, images) and organizes
    extracted content by document type.

    Example:
        >>> processor = DocumentProcessor()
        >>> result = processor.process_files([Path("tender.pdf"), Path("specs.docx")])
        >>> scope_text = result.get_category_text(DocumentCategory.SCOPE_OF_WORK)
    """

    # Supported file extensions
    SUPPORTED_EXTENSIONS = {
        ".pdf": PdfParser,
        ".docx": DocxParser,
        ".xlsx": ExcelParser,
        ".xls": ExcelParser,
        ".png": ImageParser,
        ".jpg": ImageParser,
        ".jpeg": ImageParser,
        ".tiff": ImageParser,
        ".tif": ImageParser,
        ".bmp": ImageParser,
        ".webp": ImageParser,
    }

    def __init__(
        self,
        max_workers: Optional[int] = None,
        classifier_confidence: float = 0.3,
        progress_callback: Optional[Callable[[str, float], None]] = None,
    ):
        """Initialize document processor.

        Args:
            max_workers: Maximum parallel workers for processing.
                Defaults to settings.max_workers.
            classifier_confidence: Minimum confidence for classification.
            progress_callback: Optional callback for progress updates.
                Called with (message, progress_fraction).
        """
        self.max_workers = max_workers or settings.max_workers
        self.classifier = ContentClassifier(min_confidence=classifier_confidence)
        self.progress_callback = progress_callback

        # Initialize parsers
        self._parsers: dict[str, BaseParser] = {
            ".pdf": PdfParser(),
            ".docx": DocxParser(),
            ".xlsx": ExcelParser(),
            ".xls": ExcelParser(),
            ".png": ImageParser(),
            ".jpg": ImageParser(),
            ".jpeg": ImageParser(),
            ".tiff": ImageParser(),
            ".tif": ImageParser(),
            ".bmp": ImageParser(),
            ".webp": ImageParser(),
        }

    def process_files(
        self,
        file_paths: list[Path],
        show_progress: bool = True,
    ) -> ProcessingResult:
        """Process multiple files and return organized content.

        Args:
            file_paths: List of file paths to process.
            show_progress: Whether to show progress bar in console.

        Returns:
            ProcessingResult containing all extracted and classified content.
        """
        # Filter to supported files
        valid_files = [
            fp for fp in file_paths
            if fp.suffix.lower() in self.SUPPORTED_EXTENSIONS
        ]

        if not valid_files:
            logger.warning("No supported files found in input")
            return ProcessingResult(
                documents=[],
                stats=ProcessingStats(total_files=len(file_paths)),
                all_content_by_category={cat: [] for cat in DocumentCategory},
            )

        stats = ProcessingStats(total_files=len(valid_files))
        documents: list[ProcessedDocument] = []

        if show_progress:
            documents = self._process_with_progress(valid_files, stats)
        else:
            documents = self._process_parallel(valid_files, stats)

        # Merge all classified content
        all_content: dict[DocumentCategory, list[ClassifiedContent]] = {
            cat: [] for cat in DocumentCategory
        }

        for doc in documents:
            for category, contents in doc.classified_content.items():
                all_content[category].extend(contents)

        return ProcessingResult(
            documents=documents,
            stats=stats,
            all_content_by_category=all_content,
        )

    def process_directory(
        self,
        directory: Path,
        recursive: bool = True,
        show_progress: bool = True,
    ) -> ProcessingResult:
        """Process all supported files in a directory.

        Args:
            directory: Directory path to scan.
            recursive: Whether to scan subdirectories.
            show_progress: Whether to show progress bar.

        Returns:
            ProcessingResult containing all extracted content.
        """
        if not directory.is_dir():
            raise ValueError(f"Not a directory: {directory}")

        pattern = "**/*" if recursive else "*"
        file_paths = [
            fp for fp in directory.glob(pattern)
            if fp.is_file() and fp.suffix.lower() in self.SUPPORTED_EXTENSIONS
        ]

        logger.info(f"Found {len(file_paths)} supported files in {directory}")

        return self.process_files(file_paths, show_progress=show_progress)

    def process_single(self, file_path: Path) -> ProcessedDocument:
        """Process a single file.

        Args:
            file_path: Path to the file.

        Returns:
            ProcessedDocument with extracted and classified content.

        Raises:
            ValueError: If file type is not supported.
        """
        ext = file_path.suffix.lower()

        if ext not in self._parsers:
            raise ValueError(
                f"Unsupported file type: {ext}. "
                f"Supported: {list(self.SUPPORTED_EXTENSIONS.keys())}"
            )

        parser = self._parsers[ext]
        result = parser.parse(file_path)

        # Classify content
        classified = self.classifier.classify_all(
            result.content_sections,
            result.tables,
        )

        return ProcessedDocument(
            file_path=file_path,
            parser_result=result,
            classified_content=classified,
        )

    def _process_with_progress(
        self,
        file_paths: list[Path],
        stats: ProcessingStats,
    ) -> list[ProcessedDocument]:
        """Process files with a rich progress bar."""
        documents: list[ProcessedDocument] = []

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            task = progress.add_task(
                "[cyan]Processing documents...",
                total=len(file_paths),
            )

            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                future_to_file = {
                    executor.submit(self.process_single, fp): fp
                    for fp in file_paths
                }

                for future in as_completed(future_to_file):
                    file_path = future_to_file[future]

                    try:
                        doc = future.result()
                        documents.append(doc)
                        self._update_stats(stats, doc.parser_result)

                        if doc.parser_result.success:
                            stats.successful += 1
                        else:
                            stats.failed += 1

                    except Exception as e:
                        logger.error(f"Failed to process {file_path}: {e}")
                        stats.failed += 1
                        stats.errors.append(
                            ParserError(
                                error_type=ParserError.UNKNOWN,
                                message=str(e),
                                file_path=file_path,
                            )
                        )

                    progress.update(task, advance=1)
                    progress.update(
                        task,
                        description=f"[cyan]Processing: {file_path.name}",
                    )

        return documents

    def _process_parallel(
        self,
        file_paths: list[Path],
        stats: ProcessingStats,
    ) -> list[ProcessedDocument]:
        """Process files in parallel without progress bar."""
        documents: list[ProcessedDocument] = []

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_file = {
                executor.submit(self.process_single, fp): fp
                for fp in file_paths
            }

            for i, future in enumerate(as_completed(future_to_file)):
                file_path = future_to_file[future]

                try:
                    doc = future.result()
                    documents.append(doc)
                    self._update_stats(stats, doc.parser_result)

                    if doc.parser_result.success:
                        stats.successful += 1
                    else:
                        stats.failed += 1

                    # Call progress callback if provided
                    if self.progress_callback:
                        progress = (i + 1) / len(file_paths)
                        self.progress_callback(f"Processed: {file_path.name}", progress)

                except Exception as e:
                    logger.error(f"Failed to process {file_path}: {e}")
                    stats.failed += 1

        return documents

    def _update_stats(self, stats: ProcessingStats, result: ParserResult) -> None:
        """Update processing statistics from a parser result."""
        if result.ocr_used:
            stats.ocr_used += 1

        if result.total_pages:
            stats.total_pages += result.total_pages

        stats.total_tables += len(result.tables)
        stats.total_content_sections += len(result.content_sections)
        stats.errors.extend(result.errors)
        stats.warnings.extend(result.warnings)

    @classmethod
    def get_supported_extensions(cls) -> list[str]:
        """Get list of supported file extensions."""
        return list(cls.SUPPORTED_EXTENSIONS.keys())

    @classmethod
    def is_supported(cls, file_path: Path) -> bool:
        """Check if a file is supported."""
        return file_path.suffix.lower() in cls.SUPPORTED_EXTENSIONS
