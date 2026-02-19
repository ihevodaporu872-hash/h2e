"""Smart text chunking for LLM processing."""

import re
from dataclasses import dataclass
from typing import Optional

import tiktoken


@dataclass
class TextChunk:
    """A chunk of text with metadata."""

    text: str
    index: int
    total_chunks: int
    token_count: int
    source_page: Optional[int] = None
    source_section: Optional[str] = None


class TextChunker:
    """Splits text into optimal chunks for LLM processing.

    Uses tiktoken for accurate token counting and preserves
    semantic boundaries (paragraphs, sentences) when splitting.
    """

    def __init__(
        self,
        max_tokens: int = 4000,
        overlap_tokens: int = 200,
        model: str = "gpt-4o",
    ):
        """Initialize chunker.

        Args:
            max_tokens: Maximum tokens per chunk.
            overlap_tokens: Token overlap between chunks for context.
            model: Model name for tokenizer selection.
        """
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens

        # Get the appropriate tokenizer
        try:
            self.encoding = tiktoken.encoding_for_model(model)
        except KeyError:
            self.encoding = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """Count tokens in text."""
        return len(self.encoding.encode(text))

    def chunk_text(
        self,
        text: str,
        source_page: Optional[int] = None,
        source_section: Optional[str] = None,
    ) -> list[TextChunk]:
        """Split text into chunks respecting semantic boundaries.

        Args:
            text: Text to chunk.
            source_page: Optional source page number.
            source_section: Optional source section name.

        Returns:
            List of TextChunk objects.
        """
        if not text.strip():
            return []

        total_tokens = self.count_tokens(text)

        # If text fits in one chunk, return it
        if total_tokens <= self.max_tokens:
            return [
                TextChunk(
                    text=text.strip(),
                    index=0,
                    total_chunks=1,
                    token_count=total_tokens,
                    source_page=source_page,
                    source_section=source_section,
                )
            ]

        # Split into paragraphs first
        paragraphs = self._split_into_paragraphs(text)

        chunks = []
        current_chunk_parts: list[str] = []
        current_tokens = 0

        for para in paragraphs:
            para_tokens = self.count_tokens(para)

            # If single paragraph exceeds max, split it further
            if para_tokens > self.max_tokens:
                # Save current chunk if any
                if current_chunk_parts:
                    chunks.append("\n\n".join(current_chunk_parts))
                    current_chunk_parts = []
                    current_tokens = 0

                # Split large paragraph into sentences
                sentence_chunks = self._split_large_paragraph(para)
                chunks.extend(sentence_chunks)
                continue

            # Check if adding this paragraph exceeds limit
            if current_tokens + para_tokens > self.max_tokens - self.overlap_tokens:
                if current_chunk_parts:
                    chunks.append("\n\n".join(current_chunk_parts))

                    # Start new chunk with overlap from last paragraph
                    if len(current_chunk_parts) > 0:
                        overlap_text = current_chunk_parts[-1]
                        if self.count_tokens(overlap_text) <= self.overlap_tokens:
                            current_chunk_parts = [overlap_text, para]
                            current_tokens = self.count_tokens(overlap_text) + para_tokens
                        else:
                            current_chunk_parts = [para]
                            current_tokens = para_tokens
                    else:
                        current_chunk_parts = [para]
                        current_tokens = para_tokens
                else:
                    current_chunk_parts = [para]
                    current_tokens = para_tokens
            else:
                current_chunk_parts.append(para)
                current_tokens += para_tokens

        # Add remaining content
        if current_chunk_parts:
            chunks.append("\n\n".join(current_chunk_parts))

        # Convert to TextChunk objects
        total = len(chunks)
        return [
            TextChunk(
                text=chunk.strip(),
                index=i,
                total_chunks=total,
                token_count=self.count_tokens(chunk),
                source_page=source_page,
                source_section=source_section,
            )
            for i, chunk in enumerate(chunks)
        ]

    def chunk_documents(
        self,
        documents: list[dict],
    ) -> list[TextChunk]:
        """Chunk multiple documents with metadata.

        Args:
            documents: List of dicts with 'text', 'page', 'section' keys.

        Returns:
            List of all chunks from all documents.
        """
        all_chunks = []

        for doc in documents:
            chunks = self.chunk_text(
                text=doc.get("text", ""),
                source_page=doc.get("page"),
                source_section=doc.get("section"),
            )
            all_chunks.extend(chunks)

        # Renumber indices across all chunks
        total = len(all_chunks)
        for i, chunk in enumerate(all_chunks):
            chunk.index = i
            chunk.total_chunks = total

        return all_chunks

    def _split_into_paragraphs(self, text: str) -> list[str]:
        """Split text into paragraphs."""
        # Split on double newlines or multiple newlines
        paragraphs = re.split(r"\n\s*\n", text)
        return [p.strip() for p in paragraphs if p.strip()]

    def _split_large_paragraph(self, text: str) -> list[str]:
        """Split a large paragraph into smaller chunks by sentences."""
        # Split on sentence boundaries
        sentences = re.split(r"(?<=[.!?])\s+", text)

        chunks = []
        current_chunk: list[str] = []
        current_tokens = 0

        for sentence in sentences:
            sentence_tokens = self.count_tokens(sentence)

            # If single sentence is too large, split by words
            if sentence_tokens > self.max_tokens:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = []
                    current_tokens = 0

                # Split by words as last resort
                word_chunks = self._split_by_words(sentence)
                chunks.extend(word_chunks)
                continue

            if current_tokens + sentence_tokens > self.max_tokens:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                current_chunk = [sentence]
                current_tokens = sentence_tokens
            else:
                current_chunk.append(sentence)
                current_tokens += sentence_tokens

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    def _split_by_words(self, text: str) -> list[str]:
        """Last resort: split text by words."""
        words = text.split()
        chunks = []
        current_chunk: list[str] = []
        current_tokens = 0

        for word in words:
            word_tokens = self.count_tokens(word + " ")

            if current_tokens + word_tokens > self.max_tokens:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_tokens = word_tokens
            else:
                current_chunk.append(word)
                current_tokens += word_tokens

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks
