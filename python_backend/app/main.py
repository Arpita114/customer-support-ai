"""FastAPI application for Customer Support AI Assistant."""

import os
import uuid
import json
import dataclasses
from pathlib import Path
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import HOST, PORT, ENVIRONMENT, UPLOAD_DIR, MAX_FILE_SIZE
from app.logger import logger
from app.vector_store import vector_store
from app.ollama_service import ollama_service
from app.document_service import document_service
from app.chat_service import chat_service

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
    "text/markdown",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager."""
    logger.info("Initializing vector store...")
    try:
        await vector_store.initialize()
        logger.info("Vector store ready")
    except Exception as e:
        logger.warning(f"Vector store initialization issue: {e}")

    logger.info("Checking Ollama connection...")
    try:
        ollama_healthy = await ollama_service.check_health()
        if ollama_healthy:
            logger.info("Ollama is connected")
        else:
            logger.warning("Ollama is not running. Please start it with: ollama serve")
            logger.info("Then pull models: ollama pull llama3.2 && ollama pull nomic-embed-text")
    except Exception as e:
        logger.warning(f"Ollama check failed: {e}")

    logger.info("Server starting...")
    yield
    logger.info("Server shutting down...")


app = FastAPI(
    title="Customer Support AI API",
    version="1.0.0",
    description="AI-powered customer support assistant API using local AI (Ollama)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ENVIRONMENT == "development" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """System health check endpoint."""
    ollama_ok = await ollama_service.check_health()
    return {
        "success": True,
        "status": "running",
        "ollama": "connected" if ollama_ok else "disconnected",
        "documents": await document_service.get_document_count(),
        "sessions": len(chat_service.sessions),
    }


@app.post("/api/documents")
async def upload_document(file: UploadFile = File(...)):
    """Upload a document (PDF, DOCX, or TXT) to the knowledge base."""
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Only PDF, DOCX, and TXT are allowed.",
        )

    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    content = await file.read()
    size = len(content)

    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    suffix = Path(file.filename).suffix
    unique_name = f"{uuid.uuid4()}{suffix}"
    file_path = Path(UPLOAD_DIR) / unique_name
    with open(file_path, "wb") as f:
        f.write(content)

    logger.info(f"Upload received: {file.filename} ({size} bytes)")

    result = await document_service.process_upload(
        str(file_path), file.filename, file.content_type, size
    )

    if result.success and result.document:
        return {
            "success": True,
            "document": {
                "id": result.document.id,
                "originalName": result.document.original_name,
                "mimeType": result.document.mime_type,
                "size": result.document.size,
                "chunkCount": len(result.document.chunks),
                "createdAt": result.document.created_at.isoformat(),
            },
        }
    else:
        raise HTTPException(status_code=400, detail=result.error or "Upload failed")


@app.get("/api/documents")
async def list_documents():
    """List all uploaded documents."""
    documents = await document_service.get_all_documents()
    return {
        "success": True,
        "count": len(documents),
        "documents": [
            {
                "id": d.id,
                "originalName": d.original_name,
                "mimeType": d.mime_type,
                "size": d.size,
                "chunkCount": len(d.chunks),
                "createdAt": d.created_at.isoformat(),
            }
            for d in documents
        ],
    }


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document from the knowledge base."""
    success = await document_service.delete_document(doc_id)
    if success:
        return {"success": True, "message": "Document deleted"}
    raise HTTPException(status_code=404, detail="Document not found")


@app.post("/api/faqs")
async def import_faqs(request: dict):
    """Import FAQ items into the knowledge base."""
    faqs = request.get("faqs", [])
    if not faqs:
        raise HTTPException(status_code=400, detail="No FAQ items provided")

    result = await document_service.import_faqs(faqs)
    if result.success and result.document:
        return {
            "success": True,
            "document": {
                "id": result.document.id,
                "originalName": result.document.original_name,
                "mimeType": result.document.mime_type,
                "size": result.document.size,
                "chunkCount": len(result.document.chunks),
                "createdAt": result.document.created_at.isoformat(),
            },
        }
    else:
        raise HTTPException(status_code=400, detail=result.error or "FAQ import failed")


NO_INFORMATION_RESPONSE = "I'm sorry, I don't have information about that in our knowledge base. Would you like me to escalate this to a human agent?"

SYSTEM_PROMPT = f"""You are a helpful Customer Support AI Assistant. Your role is to answer user questions based ONLY on the provided company documentation and knowledge base.

Guidelines:
1. Answer questions using ONLY the information from the provided context
2. If the answer is not in the context, respond with: "{NO_INFORMATION_RESPONSE}"
3. Be concise but thorough in your responses
4. Maintain a professional, friendly tone
5. If asked about something unrelated to customer support, politely redirect to support topics
6. Cite the source document when possible
7. Do not make up information or hallucinate answers

Context from knowledge base:"""


@app.post("/api/chat")
async def chat_message(request: dict):
    """Send a message to the AI assistant and get a response."""
    message = request.get("message", "")
    session_id = request.get("session_id")
    if not message or not message.strip():
        raise HTTPException(status_code=400, detail="Message is required and must be a string")

    logger.info(f"Chat message received: \"{message[:50]}...\"")

    try:
        response = await chat_service.process_message(message, session_id)
        return {
            "success": True,
            "message": {
                "id": response.message.id,
                "role": response.message.role,
                "content": response.message.content,
                "timestamp": response.message.timestamp.isoformat(),
                "sources": (
                    [dataclasses.asdict(s) for s in response.message.sources]
                    if response.message.sources
                    else None
                ),
            },
            "sessionId": response.session_id,
            "sources": (
                [dataclasses.asdict(s) for s in response.sources]
                if response.sources
                else None
            ),
        }
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/stream")
async def chat_stream(request: dict):
    """Stream AI response tokens using Server-Sent Events."""
    message = request.get("message", "")
    session_id = request.get("session_id")
    if not message or not message.strip():
        raise HTTPException(status_code=400, detail="Valid message is required")

    logger.info(f"Streaming chat: \"{message[:50]}...\"")

    async def event_generator():
        async for event in chat_service.stream_message(message, session_id):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    )


@app.get("/api/chat/sessions")
async def list_sessions():
    """List all chat sessions."""
    sessions = await chat_service.get_all_sessions()
    return {
        "success": True,
        "count": len(sessions),
        "sessions": [
            {
                "id": s.id,
                "messageCount": len(s.messages),
                "createdAt": s.created_at.isoformat(),
                "updatedAt": s.updated_at.isoformat(),
            }
            for s in sessions
        ],
    }


@app.get("/api/chat/sessions/{session_id}")
async def get_session(session_id: str):
    """Get chat session details."""
    session = await chat_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "success": True,
        "session": {
            "id": session.id,
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "timestamp": m.timestamp.isoformat(),
                    "sources": (
                        [dataclasses.asdict(s) for s in m.sources]
                        if m.sources
                        else None
                    ),
                }
                for m in session.messages
            ],
            "createdAt": session.created_at.isoformat(),
            "updatedAt": session.updated_at.isoformat(),
        },
    }


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Customer Support AI API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=ENVIRONMENT == "development",
    )
