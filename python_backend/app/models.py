from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class TextChunk(BaseModel):
    id: str = ""
    document_id: str = ""
    content: str = ""
    start_index: int = 0
    end_index: int = 0
    section: str = ""

    def __init__(self, **data):
        super().__init__(**data)
        if not self.id:
            self.id = str(uuid.uuid4())


class Document(BaseModel):
    id: str = ""
    filename: str = ""
    original_name: str = ""
    mime_type: str = ""
    size: int = 0
    content: str = ""
    chunks: list[TextChunk] = []
    created_at: datetime = None

    def __init__(self, **data):
        super().__init__(**data)
        if not self.id:
            self.id = str(uuid.uuid4())
        if self.created_at is None:
            self.created_at = datetime.utcnow()


class Source(BaseModel):
    document_id: str
    document_name: str
    chunk_content: str
    relevance_score: float = 0.0


class ChatMessage(BaseModel):
    id: str = ""
    role: str
    content: str
    timestamp: datetime = None
    sources: Optional[list[Source]] = None

    def __init__(self, **data):
        super().__init__(**data)
        if not self.id:
            self.id = str(uuid.uuid4())
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


class ChatSession(BaseModel):
    id: str = ""
    messages: list[ChatMessage] = []
    created_at: datetime = None
    updated_at: datetime = None

    def __init__(self, **data):
        super().__init__(**data)
        if not self.id:
            self.id = str(uuid.uuid4())
        now = datetime.utcnow()
        if self.created_at is None:
            self.created_at = now
        if self.updated_at is None:
            self.updated_at = now


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    message: ChatMessage
    session_id: str
    sources: Optional[list[Source]] = None


class UploadResult(BaseModel):
    success: bool
    document: Optional[Document] = None
    error: Optional[str] = None


class FAQItem(BaseModel):
    question: str
    answer: str


class FAQImportRequest(BaseModel):
    faqs: list[FAQItem]
