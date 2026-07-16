import uuid
import os
import shutil
from pathlib import Path
from app.config import UPLOAD_DIR
from app.models import Document, TextChunk, UploadResult
from app.document_parser import parse_document, chunk_text
from app.vector_store import vector_store
from app.logger import logger


class DocumentService:
    def __init__(self):
        self.documents: dict[str, Document] = {}

    async def process_upload(
        self, file_path: str, original_name: str, mime_type: str, size: int
    ) -> UploadResult:
        try:
            doc_id = str(uuid.uuid4())

            logger.info(f"Parsing document: {original_name}")
            content = await self._parse_document_async(file_path, mime_type)

            if not content or len(content.strip()) < 50:
                self._cleanup_file(file_path)
                return UploadResult(
                    success=False,
                    error="Document contains insufficient text content",
                )

            chunk_texts = chunk_text(content, 800, 150)
            text_chunks: list[TextChunk] = []
            for idx, chunk in enumerate(chunk_texts):
                text_chunks.append(TextChunk(
                    document_id=doc_id,
                    content=chunk,
                    start_index=idx * 800,
                    end_index=idx * 800 + len(chunk),
                    section=f"chunk-{idx + 1}",
                ))

            document = Document(
                id=doc_id,
                filename=Path(file_path).name,
                original_name=original_name,
                mime_type=mime_type,
                size=size,
                content=content[:10000],
                chunks=text_chunks,
            )

            logger.info(f"Generating embeddings for {len(text_chunks)} chunks...")
            await vector_store.add_chunks(text_chunks)

            self.documents[doc_id] = document

            logger.info(f"Document processed: {original_name} ({len(text_chunks)} chunks)")
            return UploadResult(success=True, document=document)

        except Exception as e:
            logger.error(f"Document processing failed: {e}")
            self._cleanup_file(file_path)
            return UploadResult(success=False, error=str(e))

    async def _parse_document_async(self, file_path: str, mime_type: str) -> str:
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, parse_document, file_path, mime_type)

    def _cleanup_file(self, file_path: str):
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)
        except Exception:
            pass

    async def get_all_documents(self) -> list[Document]:
        docs = list(self.documents.values())
        docs.sort(key=lambda d: d.created_at, reverse=True)
        return docs

    async def get_document(self, doc_id: str) -> Document | None:
        return self.documents.get(doc_id)

    async def delete_document(self, doc_id: str) -> bool:
        doc = self.documents.get(doc_id)
        if not doc:
            return False

        try:
            await vector_store.delete_by_document_id(doc_id)

            file_path = Path(UPLOAD_DIR) / doc.filename
            if file_path.exists():
                file_path.unlink()

            del self.documents[doc_id]

            logger.info(f"Deleted document: {doc.original_name}")
            return True
        except Exception as e:
            logger.error(f"Document deletion failed: {e}")
            return False

    async def get_document_count(self) -> int:
        return len(self.documents)

    async def import_faqs(self, faqs: list[dict]) -> UploadResult:
        try:
            if not faqs:
                return UploadResult(success=False, error="No FAQ items provided")

            text_parts = []
            for idx, faq in enumerate(faqs, 1):
                question = faq.get("question", "").strip()
                answer = faq.get("answer", "").strip()
                if question and answer:
                    text_parts.append(f"Q{idx}: {question}\nA{idx}: {answer}\n")

            if not text_parts:
                return UploadResult(success=False, error="No valid Q&A pairs found")

            content = "\n".join(text_parts)
            doc_id = str(uuid.uuid4())

            chunk_texts = chunk_text(content, 800, 150)
            text_chunks: list[TextChunk] = []
            for idx, chunk in enumerate(chunk_texts):
                text_chunks.append(TextChunk(
                    document_id=doc_id,
                    content=chunk,
                    start_index=idx * 800,
                    end_index=idx * 800 + len(chunk),
                    section=f"faq-{idx + 1}",
                ))

            document = Document(
                id=doc_id,
                filename=f"faq-{doc_id[:8]}.txt",
                original_name="Imported FAQs",
                mime_type="text/plain",
                size=len(content.encode("utf-8")),
                content=content[:10000],
                chunks=text_chunks,
            )

            logger.info(f"Generating embeddings for {len(text_chunks)} FAQ chunks...")
            await vector_store.add_chunks(text_chunks)

            self.documents[doc_id] = document

            logger.info(f"FAQs imported: {len(faqs)} items ({len(text_chunks)} chunks)")
            return UploadResult(success=True, document=document)

        except Exception as e:
            logger.error(f"FAQ import failed: {e}")
            return UploadResult(success=False, error=str(e))


document_service = DocumentService()
