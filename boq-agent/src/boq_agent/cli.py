"""Command-line interface for BOQ Agent."""

from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from . import __version__
from .classification import DocumentCategory
from .processor import DocumentProcessor

app = typer.Typer(
    name="boq-agent",
    help="AI-powered BOQ extraction from tender documents.",
    add_completion=False,
)

console = Console()


def version_callback(value: bool) -> None:
    """Print version and exit."""
    if value:
        console.print(f"[bold cyan]boq-agent[/] version {__version__}")
        raise typer.Exit()


@app.callback()
def main(
    version: Optional[bool] = typer.Option(
        None,
        "--version",
        "-v",
        callback=version_callback,
        is_eager=True,
        help="Show version and exit.",
    ),
) -> None:
    """BOQ Agent - Extract Bill of Quantities from tender documents."""
    pass


@app.command()
def extract(
    input_path: Path = typer.Argument(
        ...,
        help="Input file or directory to process.",
        exists=True,
    ),
    output: Optional[Path] = typer.Option(
        None,
        "--output",
        "-o",
        help="Output Excel file path. Defaults to <input>_boq.xlsx",
    ),
    template: Optional[Path] = typer.Option(
        None,
        "--template",
        "-t",
        help="BOQ template YAML file.",
        exists=True,
    ),
    recursive: bool = typer.Option(
        True,
        "--recursive/--no-recursive",
        "-r/-R",
        help="Recursively process subdirectories.",
    ),
    workers: int = typer.Option(
        4,
        "--workers",
        "-w",
        help="Number of parallel workers.",
        min=1,
        max=16,
    ),
) -> None:
    """Extract BOQ from tender documents.

    Supports PDF, DOCX, XLSX, XLS, and image files.
    Scanned documents are automatically processed with OCR.
    """
    console.print(Panel.fit(
        "[bold cyan]BOQ Agent[/] - Document Extraction",
        border_style="cyan",
    ))

    # Initialize processor
    processor = DocumentProcessor(max_workers=workers)

    # Process input
    console.print(f"\n[bold]Processing:[/] {input_path}")

    if input_path.is_file():
        result = processor.process_files([input_path])
    else:
        result = processor.process_directory(
            input_path,
            recursive=recursive,
        )

    # Display results
    _display_results(result)

    # TODO: Generate Excel output (will be added in next phase)
    if output:
        console.print(f"\n[yellow]Excel generation not yet implemented.[/]")
        console.print(f"[dim]Would write to: {output}[/]")


@app.command()
def analyze(
    input_path: Path = typer.Argument(
        ...,
        help="Input file or directory to analyze.",
        exists=True,
    ),
    category: Optional[str] = typer.Option(
        None,
        "--category",
        "-c",
        help="Filter by category (e.g., 'scope_of_work', 'technical_specifications').",
    ),
    recursive: bool = typer.Option(
        True,
        "--recursive/--no-recursive",
        "-r/-R",
        help="Recursively process subdirectories.",
    ),
) -> None:
    """Analyze documents and show classified content.

    Useful for reviewing what content was extracted and how it was categorized.
    """
    processor = DocumentProcessor()

    if input_path.is_file():
        result = processor.process_files([input_path])
    else:
        result = processor.process_directory(input_path, recursive=recursive)

    # Filter by category if specified
    categories_to_show = list(DocumentCategory)
    if category:
        try:
            cat = DocumentCategory(category.lower())
            categories_to_show = [cat]
        except ValueError:
            console.print(f"[red]Unknown category: {category}[/]")
            console.print(f"Valid categories: {[c.value for c in DocumentCategory]}")
            raise typer.Exit(1)

    # Display content by category
    for cat in categories_to_show:
        contents = result.all_content_by_category.get(cat, [])
        if not contents:
            continue

        console.print(f"\n[bold cyan]== {cat.value.upper()} ==[/]")
        console.print(f"[dim]({len(contents)} items)[/]\n")

        for i, classified in enumerate(contents[:5], 1):  # Show first 5
            if classified.is_table:
                table = classified.content
                console.print(f"[bold]{i}. Table[/] (confidence: {classified.confidence:.0%})")
                console.print(f"   Headers: {table.headers[:5]}")
                console.print(f"   Rows: {table.row_count}")
            else:
                text = classified.content.text[:200]
                console.print(f"[bold]{i}.[/] (confidence: {classified.confidence:.0%})")
                console.print(f"   {text}...")

        if len(contents) > 5:
            console.print(f"   [dim]... and {len(contents) - 5} more items[/]")


@app.command()
def supported() -> None:
    """Show supported file formats."""
    table = Table(title="Supported File Formats")
    table.add_column("Extension", style="cyan")
    table.add_column("Description")
    table.add_column("OCR Support")

    formats = [
        (".pdf", "PDF documents", "Yes (for scanned)"),
        (".docx", "Microsoft Word", "No"),
        (".xlsx", "Microsoft Excel", "No"),
        (".xls", "Excel (legacy)", "No"),
        (".png", "PNG images", "Yes"),
        (".jpg/.jpeg", "JPEG images", "Yes"),
        (".tiff/.tif", "TIFF images", "Yes"),
        (".bmp", "Bitmap images", "Yes"),
        (".webp", "WebP images", "Yes"),
    ]

    for ext, desc, ocr in formats:
        table.add_row(ext, desc, ocr)

    console.print(table)


def _display_results(result) -> None:
    """Display processing results in a formatted table."""
    stats = result.stats

    # Stats table
    table = Table(title="Processing Results")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", justify="right")

    table.add_row("Total files", str(stats.total_files))
    table.add_row("Successful", f"[green]{stats.successful}[/]")
    table.add_row("Failed", f"[red]{stats.failed}[/]" if stats.failed else "0")
    table.add_row("OCR used", str(stats.ocr_used))
    table.add_row("Total pages", str(stats.total_pages))
    table.add_row("Tables found", str(stats.total_tables))
    table.add_row("Content sections", str(stats.total_content_sections))

    console.print(table)

    # Category breakdown
    cat_table = Table(title="Content by Category")
    cat_table.add_column("Category", style="cyan")
    cat_table.add_column("Items", justify="right")

    for cat in DocumentCategory:
        count = len(result.all_content_by_category.get(cat, []))
        if count > 0:
            cat_table.add_row(cat.value, str(count))

    console.print(cat_table)

    # Show warnings
    if stats.warnings:
        console.print(f"\n[yellow]Warnings ({len(stats.warnings)}):[/]")
        for warning in stats.warnings[:5]:
            console.print(f"  [dim]• {warning}[/]")

    # Show errors
    if stats.errors:
        console.print(f"\n[red]Errors ({len(stats.errors)}):[/]")
        for error in stats.errors[:5]:
            console.print(f"  [dim]• {error}[/]")


if __name__ == "__main__":
    app()
