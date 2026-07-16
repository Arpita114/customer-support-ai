import fitz  # PyMuPDF for PDF
import docx  # python-docx for DOCX
from pathlib import Path
from app.logger import logger


def parse_document(file_path: str, mime_type: str) -> str:
    logger.info(f"Parsing document: {file_path} (type: {mime_type})")

    try:
        if mime_type == "application/pdf":
            return _parse_pdf(file_path)
        elif mime_type in (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
        ):
            return _parse_docx(file_path)
        elif mime_type in ("text/plain", "text/markdown"):
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        else:
            raise ValueError(f"Unsupported file type: {mime_type}")
    except Exception as e:
        logger.error(f"Document parsing failed: {e}")
        raise


def _parse_pdf(file_path: str) -> str:
    try:
        doc = fitz.open(file_path)
        text_parts = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            if text and str(text).strip():
                text_parts.append(str(text))
        doc.close()
        result = "\n\n".join(text_parts)
        if not result.strip():
            raise ValueError("No text content found in PDF")
        return result
    except Exception as e:
        logger.error(f"PDF parsing failed: {e}")
        raise


def _parse_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        text_parts = [para.text for para in doc.paragraphs if para.text.strip()]
        return "\n\n".join(text_parts)
    except Exception as e:
        logger.error(f"DOCX parsing failed: {e}")
        raise


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
    import re

    chunks: list[str] = []
    sentences = re.findall(r'[^.!?]*[.!?]+', text) or [text]

    current_chunk = ""

    for sentence in sentences:
        trimmed = sentence.strip()
        if not trimmed:
            continue

        if len(current_chunk) + len(trimmed) > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            words = current_chunk.split()
            overlap_words = words[-(overlap // 5):]
            current_chunk = " ".join(overlap_words) + " " + trimmed
        else:
            current_chunk += (" " if current_chunk else "") + trimmed

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return [c for c in chunks if len(c) > 50]
