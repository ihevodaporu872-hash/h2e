# BOQ Agent - System Architecture Design

**Date**: 2026-02-19
**Status**: Fully Implemented (Phase 1 + Phase 2)

## Overview

BOQ Agent is a Python-based CLI tool that automatically extracts Bill of Quantities (BOQ) data from tender documents. It processes multiple file formats, classifies content by type, uses AI for intelligent extraction, and generates structured Excel output.

## Design Decisions

### Integration Approach
**Chosen**: Standalone CLI tool
**Rationale**: Fastest to develop, easy to test, can be wrapped in an API later.

### Input Formats
**Chosen**: Mixed formats (PDF, DOCX, XLSX, images)
**Rationale**: Real-world tenders come in various formats.

### Output Format
**Chosen**: Template-driven configurable output
**Rationale**: Maximum flexibility across different clients and project types.

### Extraction Intelligence
**Chosen**: LLM-powered (OpenAI GPT-4o)
**Rationale**: Best accuracy for complex tender documents where context matters.

### Processing Model
**Chosen**: Medium volume, balanced (~10-50 docs/day, <1 min per doc)
**Rationale**: Reasonable target achievable with smart chunking and parallel LLM calls.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      BOQ EXTRACTION AGENT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────────┐ │
│  │  INPUT   │    │   PARSER     │    │    LLM PROCESSOR      │ │
│  │          │───▶│   LAYER      │───▶│                       │ │
│  │ PDF/DOCX │    │              │    │  - Chunking           │ │
│  │ XLSX     │    │ - PDF Parser │    │  - Prompt Templates   │ │
│  │          │    │ - DOCX Parser│    │  - OpenAI GPT-4o      │ │
│  └──────────┘    │ - Excel Parser    │  - Response Parsing   │ │
│                  │ - OCR (Tesseract) │                       │ │
│                  └──────────────┘    └───────────────────────┘ │
│                                                │                │
│                                                ▼                │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────────┐ │
│  │  OUTPUT  │◀───│   EXCEL      │◀───│    BOQ ASSEMBLER      │ │
│  │          │    │   GENERATOR  │    │                       │ │
│  │ BOQ.xlsx │    │              │    │  - Section Builder    │ │
│  │          │    │ - openpyxl   │    │  - Deduplication      │ │
│  └──────────┘    │ - Formatting │    │  - Item Numbering     │ │
│                  └──────────────┘    └───────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
boq-agent/
├── pyproject.toml
├── README.md
├── .env.example
│
├── src/boq_agent/
│   ├── __init__.py
│   ├── cli.py              # CLI entry point (typer)
│   ├── config.py           # Settings & environment
│   ├── processor.py        # Document parsing orchestrator
│   │
│   ├── parsers/            # Document parsing
│   │   ├── base.py         # Abstract parser interface
│   │   ├── pdf_parser.py   # PDFPlumber + OCR fallback
│   │   ├── docx_parser.py  # python-docx
│   │   ├── excel_parser.py # openpyxl
│   │   └── image_parser.py # Tesseract OCR
│   │
│   ├── classification/     # Content classification
│   │   └── classifier.py   # Rule-based categorization
│   │
│   ├── extraction/         # LLM-based extraction
│   │   ├── chunker.py      # Smart text chunking with tiktoken
│   │   ├── prompts.py      # Prompt templates for GPT-4o
│   │   └── extractor.py    # OpenAI API integration
│   │
│   ├── assembly/           # BOQ assembly
│   │   └── assembler.py    # Deduplication & section builder
│   │
│   └── output/             # Excel generation
│       └── generator.py    # Template-driven Excel output
│
├── templates/
│   └── default_template.yaml
│
└── tests/
```

## Core Components

### 1. Document Parsers (Phase 1)
- **PdfParser**: Uses pdfplumber for text/tables, falls back to Tesseract OCR for scanned pages
- **DocxParser**: Uses python-docx with section and table extraction
- **ExcelParser**: Uses openpyxl with table structure detection
- **ImageParser**: Direct OCR using Tesseract

### 2. Content Classifier (Phase 1)
Rule-based classification using keywords and regex patterns:
- Technical Specifications
- Drawings & Schedules
- Scope of Work
- General Conditions
- Bill of Quantities
- Pricing Schedules
- Contract Terms

### 3. LLM Extraction (Phase 2)
- **TextChunker**: Smart chunking with tiktoken for accurate token counting
- **PromptTemplates**: Structured prompts for BOQ, scope, specs, and table extraction
- **BOQExtractor**: OpenAI GPT-4o integration with JSON response parsing

### 4. BOQ Assembler (Phase 2)
- Section classification based on keywords (12 default sections)
- Duplicate detection using text similarity (SequenceMatcher)
- Automatic item renumbering within sections
- Totals calculation with configurable contingency

### 5. Excel Generator (Phase 2)
- Template-driven output (YAML configuration)
- Professional formatting with styles
- Section headers and subtotals
- Contingency and grand total calculations

### 6. CLI Interface
Commands:
```bash
# Full extraction with AI
boq-agent extract tender.pdf -o boq.xlsx --project "My Project"

# Skip LLM (parse only)
boq-agent extract docs/ --skip-llm

# Analyze content categories
boq-agent analyze tender.pdf --category scope_of_work

# List supported formats
boq-agent supported
```

## Error Handling

Handled error types:
- FILE_NOT_FOUND
- FILE_CORRUPTED
- PASSWORD_PROTECTED
- UNSUPPORTED_FORMAT
- OCR_FAILED
- LOW_QUALITY_SCAN
- ENCODING_ERROR

## Dependencies

```toml
# PDF parsing
pdfplumber, pypdf, pdf2image, pytesseract, Pillow

# Document parsing
python-docx, openpyxl, pandas

# LLM & NLP
openai, tiktoken

# CLI & Config
typer, rich, pydantic, pydantic-settings, pyyaml
```

## Usage

```bash
# Install
cd boq-agent
pip install -e ".[dev]"

# Configure
cp .env.example .env
# Edit .env with OPENAI_API_KEY

# Extract BOQ from documents
boq-agent extract tender.pdf -o boq_output.xlsx

# Extract with project name and custom contingency
boq-agent extract docs/ -p "Building A" --contingency 10.0 -o output.xlsx

# Analyze content classification
boq-agent analyze tender.pdf --category bill_of_quantities

# Run without LLM (parsing only)
boq-agent extract tender.pdf --skip-llm
```

## Output Example

The generated Excel file includes:
- Header with project name and date
- Column headers (Item No., Description, Unit, Quantity, Rate, Amount)
- Organized sections (Preliminaries, Earthworks, Concrete, etc.)
- Section subtotals
- Contingency line
- Grand total with professional formatting
