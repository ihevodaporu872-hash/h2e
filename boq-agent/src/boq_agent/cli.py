"""Command-line interface for BOQ Agent."""

import logging
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

from . import __version__
from .assembly import BOQAssembler
from .classification import DocumentCategory
from .config import settings
from .extraction import BOQExtractor
from .extraction.prompts import ExtractionContext
from .output import BOQTemplate, ExcelGenerator
from .processor import DocumentProcessor

app = typer.Typer(
    name="boq-agent",
    help="AI-powered BOQ extraction from tender documents.",
    add_completion=False,
)

console = Console()
logger = logging.getLogger(__name__)


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
    verbose: bool = typer.Option(
        False,
        "--verbose",
        help="Enable verbose logging.",
    ),
) -> None:
    """BOQ Agent - Extract Bill of Quantities from tender documents."""
    if verbose:
        logging.basicConfig(level=logging.DEBUG)


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
    project_name: str = typer.Option(
        "Untitled Project",
        "--project",
        "-p",
        help="Project name for the BOQ.",
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
    contingency: float = typer.Option(
        5.0,
        "--contingency",
        help="Contingency percentage to add.",
        min=0.0,
        max=50.0,
    ),
    skip_llm: bool = typer.Option(
        False,
        "--skip-llm",
        help="Skip LLM extraction (only parse and classify).",
    ),
) -> None:
    """Extract BOQ from tender documents.

    Supports PDF, DOCX, XLSX, XLS, and image files.
    Scanned documents are automatically processed with OCR.
    Uses OpenAI GPT-4o for intelligent BOQ extraction.
    """
    console.print(Panel.fit(
        "[bold cyan]BOQ Agent[/] - AI-Powered BOQ Extraction",
        border_style="cyan",
    ))

    # Check API key if not skipping LLM
    if not skip_llm and not settings.openai_api_key:
        console.print("[red]Error:[/] OPENAI_API_KEY not set.")
        console.print("Set it in .env file or as environment variable.")
        console.print("Use --skip-llm to run without LLM extraction.")
        raise typer.Exit(1)

    # Set default output path
    if output is None:
        if input_path.is_file():
            output = input_path.with_suffix(".boq.xlsx")
        else:
            output = input_path / "output_boq.xlsx"

    # Load template
    boq_template = None
    if template:
        try:
            boq_template = BOQTemplate.from_yaml(template)
            console.print(f"[dim]Using template: {boq_template.name}[/]")
        except Exception as e:
            console.print(f"[yellow]Warning: Failed to load template: {e}[/]")
            console.print("[dim]Using default template[/]")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:

        # Step 1: Parse documents
        task = progress.add_task("[cyan]Parsing documents...", total=None)

        processor = DocumentProcessor(max_workers=workers)

        if input_path.is_file():
            parse_result = processor.process_files([input_path], show_progress=False)
        else:
            parse_result = processor.process_directory(
                input_path,
                recursive=recursive,
                show_progress=False,
            )

        progress.update(task, description="[green]Documents parsed")

        # Display parsing stats
        _display_parse_stats(parse_result.stats)

        if not parse_result.documents:
            console.print("[red]No documents processed successfully.[/]")
            raise typer.Exit(1)

        # Step 2: Extract BOQ items using LLM
        all_items = []

        if skip_llm:
            console.print("\n[yellow]Skipping LLM extraction (--skip-llm)[/]")
            # Use classified content directly
            for doc in parse_result.documents:
                boq_content = doc.classified_content.get(DocumentCategory.BILL_OF_QUANTITIES, [])
                # Tables from BOQ category could be extracted directly
                console.print(f"[dim]Found {len(boq_content)} BOQ-classified items[/]")
        else:
            progress.update(task, description="[cyan]Extracting BOQ items with AI...")

            try:
                extractor = BOQExtractor()
                context = ExtractionContext(project_name=project_name)

                # Process all content
                for doc in parse_result.documents:
                    # Extract from text content
                    if doc.parser_result.content_sections:
                        result = extractor.extract_from_content(
                            doc.parser_result.content_sections,
                            context=context,
                        )
                        all_items.extend(result.items)

                    # Extract from tables
                    for table in doc.parser_result.tables:
                        result = extractor.extract_from_table(table, context=context)
                        all_items.extend(result.items)

                progress.update(task, description="[green]AI extraction complete")
                console.print(f"\n[bold]Extracted:[/] {len(all_items)} BOQ items")

            except ValueError as e:
                console.print(f"[red]Error:[/] {e}")
                raise typer.Exit(1)
            except Exception as e:
                console.print(f"[red]LLM extraction failed:[/] {e}")
                logger.exception("LLM extraction error")
                raise typer.Exit(1)

        # Step 3: Assemble BOQ
        if all_items:
            progress.update(task, description="[cyan]Assembling BOQ...")

            assembler = BOQAssembler()
            assembled_boq = assembler.assemble(
                items=all_items,
                project_name=project_name,
                contingency_percent=contingency,
            )

            progress.update(task, description="[green]BOQ assembled")

            # Display assembly stats
            _display_assembly_stats(assembled_boq)

            # Step 4: Generate Excel
            progress.update(task, description="[cyan]Generating Excel...")

            generator = ExcelGenerator(template=boq_template)
            output_path = generator.generate(assembled_boq, output)

            progress.update(task, description="[green]Excel generated")

            console.print(f"\n[bold green]✓ BOQ saved to:[/] {output_path}")
        else:
            console.print("\n[yellow]No BOQ items extracted. No output generated.[/]")


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

    console.print("\n[bold]Requirements:[/]")
    console.print("• Tesseract OCR (for scanned documents)")
    console.print("• Poppler (for PDF image conversion)")
    console.print("• OpenAI API key (for AI extraction)")


def _display_parse_stats(stats) -> None:
    """Display parsing statistics."""
    table = Table(title="Parsing Results", show_header=False)
    table.add_column("Metric", style="cyan")
    table.add_column("Value", justify="right")

    table.add_row("Files processed", str(stats.total_files))
    table.add_row("Successful", f"[green]{stats.successful}[/]")
    if stats.failed:
        table.add_row("Failed", f"[red]{stats.failed}[/]")
    table.add_row("OCR used", str(stats.ocr_used))
    table.add_row("Total pages", str(stats.total_pages))
    table.add_row("Tables found", str(stats.total_tables))

    console.print(table)


def _display_assembly_stats(boq) -> None:
    """Display BOQ assembly statistics."""
    table = Table(title="BOQ Summary", show_header=False)
    table.add_column("Metric", style="cyan")
    table.add_column("Value", justify="right")

    table.add_row("Total items", str(boq.total_items))
    table.add_row("Sections", str(len(boq.sections)))
    table.add_row("Duplicates removed", str(boq.duplicate_items_removed))
    table.add_row("Subtotal", f"${boq.subtotal:,.2f}")
    table.add_row("Contingency", f"${boq.contingency:,.2f}")
    table.add_row("[bold]Grand Total[/]", f"[bold]${boq.grand_total:,.2f}[/]")

    console.print(table)

    # Show section breakdown
    if boq.sections:
        sec_table = Table(title="Sections")
        sec_table.add_column("Section", style="cyan")
        sec_table.add_column("Items", justify="right")
        sec_table.add_column("Subtotal", justify="right")

        for section in boq.sections:
            sec_table.add_row(
                section.name,
                str(section.item_count),
                f"${section.subtotal:,.2f}",
            )

        console.print(sec_table)


if __name__ == "__main__":
    app()
