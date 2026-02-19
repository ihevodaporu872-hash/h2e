"""Image parser with OCR for text extraction."""

from pathlib import Path

import pytesseract
from PIL import Image, UnidentifiedImageError

from ..config import get_tesseract_cmd, settings
from .base import (
    BaseParser,
    DocumentContent,
    ParserErrorType,
    ParserResult,
)


class ImageParser(BaseParser):
    """Parser for image files with OCR text extraction."""

    SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp"]

    def __init__(self):
        """Initialize image parser with Tesseract configuration."""
        pytesseract.pytesseract.tesseract_cmd = get_tesseract_cmd()

    def parse(self, file_path: Path) -> ParserResult:
        """Parse image file using OCR."""
        if not file_path.exists():
            return self._create_error_result(
                file_path,
                ParserErrorType.FILE_NOT_FOUND,
                f"File not found: {file_path}",
            )

        result = ParserResult(
            file_path=file_path,
            file_type=file_path.suffix.lower(),
            success=True,
            ocr_used=True,
            total_pages=1,
        )

        try:
            image = Image.open(file_path)
            result.metadata = self._extract_metadata(image)

            # Preprocess image for better OCR
            processed_image = self._preprocess_image(image)

            # Perform OCR with confidence data
            ocr_result = self._perform_ocr(processed_image)

            if ocr_result["text"].strip():
                result.content_sections.append(
                    DocumentContent(
                        text=ocr_result["text"],
                        page_number=1,
                        confidence=ocr_result["confidence"] / 100.0,
                        metadata={"ocr": True},
                    )
                )

                if ocr_result["confidence"] < settings.min_ocr_confidence:
                    result.warnings.append(
                        f"Low OCR confidence ({ocr_result['confidence']:.1f}%). "
                        "Text extraction may be inaccurate."
                    )
                    result.add_error(
                        ParserErrorType.LOW_QUALITY_SCAN,
                        f"Low OCR confidence: {ocr_result['confidence']:.1f}%",
                        page_number=1,
                        recoverable=True,
                    )
            else:
                result.warnings.append("No text could be extracted from image.")
                result.add_error(
                    ParserErrorType.OCR_FAILED,
                    "No readable text found in image",
                    recoverable=True,
                )

        except UnidentifiedImageError:
            return self._create_error_result(
                file_path,
                ParserErrorType.FILE_CORRUPTED,
                "Cannot identify image file. File may be corrupted.",
            )
        except Exception as e:
            return self._create_error_result(
                file_path,
                ParserErrorType.UNKNOWN,
                f"Failed to process image: {e}",
            )

        return result

    def _extract_metadata(self, image: Image.Image) -> dict:
        """Extract image metadata."""
        return {
            "format": image.format,
            "mode": image.mode,
            "width": image.width,
            "height": image.height,
            "dpi": image.info.get("dpi", (72, 72)),
        }

    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocess image for better OCR results."""
        # Convert to RGB if necessary
        if image.mode in ("RGBA", "P"):
            background = Image.new("RGB", image.size, (255, 255, 255))
            if image.mode == "RGBA":
                background.paste(image, mask=image.split()[3])
            else:
                background.paste(image)
            image = background
        elif image.mode != "RGB":
            image = image.convert("RGB")

        # Convert to grayscale for OCR
        grayscale = image.convert("L")

        # Apply threshold for better text detection
        threshold = 128
        binary = grayscale.point(lambda x: 255 if x > threshold else 0, "1")

        # Convert back to grayscale for Tesseract
        return binary.convert("L")

    def _perform_ocr(self, image: Image.Image) -> dict:
        """Perform OCR and return text with confidence."""
        try:
            # Get detailed OCR data
            ocr_data = pytesseract.image_to_data(
                image,
                lang=settings.ocr_language,
                output_type=pytesseract.Output.DICT,
            )

            # Calculate confidence
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
                "text": text.strip(),
                "confidence": avg_confidence,
            }

        except pytesseract.TesseractNotFoundError:
            raise RuntimeError(
                "Tesseract OCR is not installed. "
                "Please install Tesseract and ensure it's in your PATH."
            )
