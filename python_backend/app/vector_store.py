import chromadb
from chromadb.config import Settings
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection
from app.config import VECTOR_DB_PATH
from app.ollama_service import ollama_service
from app.models import TextChunk, Source
from app.logger import logger


class VectorStore:
    def __init__(self):
        self.client: ClientAPI | None = None
        self.collection: Collection | None = None
        self.initialized = False

    async def initialize(self):
        try:
            self.client = chromadb.PersistentClient(
                path=VECTOR_DB_PATH,
                settings=Settings(anonymized_telemetry=False),
            )

            try:
                self.collection = self.client.get_collection("documents")
                logger.info("Vector store loaded from existing data")
            except Exception:
                self.collection = self.client.create_collection("documents")
                logger.info("Vector store created")

            self.initialized = True
        except Exception as e:
            logger.error(f"Vector store initialization failed: {e}")
            raise

    async def add_chunks(self, chunks: list[TextChunk]):
        if not self.initialized:
            await self.initialize()

        if self.collection is None:
            logger.error("Vector store not initialized")
            return

        ids = []
        documents = []
        metadatas = []
        embeddings = []

        for chunk in chunks:
            try:
                embedding = await ollama_service.generate_embedding(chunk.content)
                ids.append(chunk.id)
                documents.append(chunk.content)
                metadatas.append({
                    "document_id": chunk.document_id,
                    "start_index": str(chunk.start_index),
                    "end_index": str(chunk.end_index),
                    "section": chunk.section,
                })
                embeddings.append(embedding)
            except Exception as e:
                logger.error(f"Failed to embed chunk {chunk.id}: {e}")

        if ids:
            try:
                self.collection.add(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas,
                    embeddings=embeddings,
                )
                logger.info(f"Added {len(ids)} chunks to vector store")
            except Exception as e:
                logger.error(f"Failed to add chunks to vector store: {e}")

    async def search(self, query: str, top_k: int = 5) -> list[Source]:
        if not self.initialized:
            await self.initialize()

        if self.collection is None:
            logger.error("Vector store not initialized")
            return []

        try:
            query_embedding = await ollama_service.generate_embedding(query)

            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
            )

            sources = []
            ids_list = results.get("ids")
            distances_list = results.get("distances")
            metadatas_list = results.get("metadatas")
            documents_list = results.get("documents")

            if ids_list and ids_list[0]:
                for i in range(len(ids_list[0])):
                    distance = distances_list[0][i] if distances_list else 0.0
                    metadata = metadatas_list[0][i] if metadatas_list else {}
                    doc_id = str(metadata.get("document_id", "")) if metadata else ""
                    chunk_content = str(documents_list[0][i]) if documents_list else ""
                    sources.append(Source(
                        document_id=doc_id,
                        document_name="",
                        chunk_content=chunk_content,
                        relevance_score=max(0.0, 1.0 - distance),
                    ))

            return sources
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

    async def delete_by_document_id(self, document_id: str):
        if not self.initialized:
            await self.initialize()

        if self.collection is None:
            logger.error("Vector store not initialized")
            return

        try:
            results = self.collection.get(
                where={"document_id": document_id},
            )
            ids_to_delete = results.get("ids")
            if ids_to_delete:
                self.collection.delete(ids=ids_to_delete)
                logger.info(f"Deleted {len(ids_to_delete)} chunks for document {document_id}")
        except Exception as e:
            logger.error(f"Failed to delete chunks for document {document_id}: {e}")

    async def get_all_document_ids(self) -> list[str]:
        if not self.initialized:
            await self.initialize()

        if self.collection is None:
            logger.error("Vector store not initialized")
            return []

        try:
            results = self.collection.get()
            doc_ids: set[str] = set()
            metadatas = results.get("metadatas") or []
            for meta in metadatas:
                if meta and "document_id" in meta:
                    doc_ids.add(str(meta["document_id"]))
            return list(doc_ids)
        except Exception as e:
            logger.error(f"Failed to get document IDs from vector store: {e}")
            return []


vector_store = VectorStore()
