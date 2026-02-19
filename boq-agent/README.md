# BOQ Agent

AI-powered Bill of Quantities (BOQ) extraction from tender documents.

## Features

- **Multi-format support**: PDF, Word (.docx), Excel (.xlsx/.xls), and images
- **OCR for scanned documents**: Automatic OCR using Tesseract for scanned PDFs and images
- **Content classification**: Automatically categorizes content into:
  - Technical Specifications
  - Drawings & Schedules
  - Scope of Work
  - General Conditions
  - Bill of Quantities
  - Pricing Schedules
  - Contract Terms
- **LLM-powered extraction**: Uses OpenAI GPT-4o for intelligent BOQ extraction
- **Template-driven output**: Configurable Excel output format

## Installation

### Prerequisites

1. **Python 3.11+**
2. **Tesseract OCR** (for scanned document support):
   - Windows: Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
   - macOS: `brew install tesseract`
   - Linux: `sudo apt install tesseract-ocr`

3. **Poppler** (for PDF to image conversion):
   - Windows: Download from [poppler releases](https://github.com/osber/poppler-builds)
   - macOS: `brew install poppler`
   - Linux: `sudo apt install poppler-utils`

### Install BOQ Agent

```bash
# Clone the repository
cd h2e/boq-agent

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate  # Windows

# Install in development mode
pip install -e ".[dev]"
```

### Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-api-key-here
```

## Usage

### Extract BOQ from documents

```bash
# Single file
boq-agent extract tender.pdf -o boq_output.xlsx

# Directory (recursive)
boq-agent extract ./tender_docs/ -o combined_boq.xlsx

# With custom template
boq-agent extract docs/ -t templates/my_template.yaml -o result.xlsx
```

### Analyze document content

```bash
# Show all classified content
boq-agent analyze tender.pdf

# Filter by category
boq-agent analyze tender.pdf --category scope_of_work
```

### Show supported formats

```bash
boq-agent supported
```

## Project Structure

```
boq-agent/
├── src/boq_agent/
│   ├── cli.py              # CLI entry point
│   ├── config.py           # Settings management
│   ├── processor.py        # Main document processor
│   ├── parsers/            # Document parsers
│   │   ├── base.py         # Base parser interface
│   │   ├── pdf_parser.py   # PDF with OCR fallback
│   │   ├── docx_parser.py  # Word documents
│   │   ├── excel_parser.py # Excel files
│   │   └── image_parser.py # Image OCR
│   └── classification/     # Content classification
│       └── classifier.py   # Category detection
├── templates/              # BOQ output templates
├── tests/                  # Test suite
└── pyproject.toml          # Project configuration
```

## Development

```bash
# Run tests
pytest

# Run linter
ruff check src/

# Type checking
mypy src/
```

## License

MIT
