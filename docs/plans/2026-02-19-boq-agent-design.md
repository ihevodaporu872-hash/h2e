# BOQ Agent - System Architecture Design

**Date**: 2026-02-19
**Status**: Implemented (Phase 1)

## Overview

BOQ Agent is a Python-based CLI tool that automatically extracts Bill of Quantities (BOQ) data from tender documents. It processes multiple file formats, classifies content by type, and generates structured Excel output.

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
│  │ BOQ.xlsx │    │              │    │  - Template Engine    │ │
│  │          │    │ - openpyxl   │    │  - Deduplication      │ │
│  └──────────┘    │ - Formatting │    │  - Hierarchy Builder  │ │
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
│   ├── processor.py        # Main orchestrator
│   │
│   ├── parsers/
│   │   ├── __init__.py
│   │   ├── base.py         # Abstract parser interface
│   │   ├── pdf_parser.py   # PDFPlumber + OCR fallback
│   │   ├── docx_parser.py  # python-docx
│   │   ├── excel_parser.py # openpyxl
│   │   └── image_parser.py # Tesseract OCR
│   │
│   └── classification/
│       ├── __init__.py
│       └── classifier.py   # Content categorization
│
├── templates/
│   └── default_template.yaml
│
└── tests/
```

## Core Components (Implemented)

### 1. Document Parsers
- **PdfParser**: Uses pdfplumber for text/tables, falls back to Tesseract OCR for scanned pages
- **DocxParser**: Uses python-docx with section and table extraction
- **ExcelParser**: Uses openpyxl with table structure detection
- **ImageParser**: Direct OCR using Tesseract

### 2. Content Classifier
Rule-based classification using keywords and regex patterns:
- Technical Specifications
- Drawings & Schedules
- Scope of Work
- General Conditions
- Bill of Quantities
- Pricing Schedules
- Contract Terms

### 3. Document Processor
Main orchestrator that:
- Processes files in parallel (configurable workers)
- Routes to appropriate parser
- Classifies extracted content
- Aggregates results with statistics

### 4. CLI Interface
Commands:
- `boq-agent extract <input> -o <output>` - Extract BOQ
- `boq-agent analyze <input>` - Show classified content
- `boq-agent supported` - List supported formats

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

## Next Phase (Not Yet Implemented)

1. **LLM Extraction Module** (`src/boq_agent/extraction/`)
   - Smart text chunking with tiktoken
   - Prompt templates for BOQ extraction
   - OpenAI API integration
   - Response parsing and validation

2. **BOQ Assembly Module** (`src/boq_agent/assembly/`)
   - Template engine for output structure
   - Deduplication logic
   - Hierarchy builder for work sections

3. **Excel Generator** (`src/boq_agent/output/`)
   - Template-driven Excel creation
   - Formatting and styling
   - Formula generation

## Usage

```bash
# Install
pip install -e ".[dev]"

# Configure
cp .env.example .env
# Edit .env with OPENAI_API_KEY

# Run
boq-agent extract tender.pdf -o boq_output.xlsx
boq-agent analyze tender.pdf --category scope_of_work
```
