"""Configuration management for BOQ Agent."""

from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # OpenAI
    openai_api_key: str = Field(default="", description="OpenAI API key")
    openai_model: str = Field(default="gpt-4o", description="OpenAI model to use")

    # OCR
    tesseract_cmd: Optional[str] = Field(
        default=None,
        description="Path to Tesseract executable",
    )

    # Processing
    max_workers: int = Field(default=4, description="Max parallel workers")
    chunk_size: int = Field(default=4000, description="Max tokens per chunk")
    ocr_dpi: int = Field(default=300, description="DPI for OCR image conversion")
    ocr_language: str = Field(default="eng", description="Tesseract language")

    # Quality thresholds
    min_ocr_confidence: float = Field(
        default=60.0,
        description="Minimum OCR confidence score (0-100)",
    )


settings = Settings()


def get_tesseract_cmd() -> str:
    """Get Tesseract command path, with Windows default fallback."""
    if settings.tesseract_cmd:
        return settings.tesseract_cmd

    # Windows default paths
    windows_paths = [
        Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe"),
        Path(r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"),
    ]

    for path in windows_paths:
        if path.exists():
            return str(path)

    # Assume it's in PATH
    return "tesseract"
