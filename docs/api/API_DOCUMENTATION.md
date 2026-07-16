# 📚 API Documentation

Complete reference for the Customer Support AI Assistant REST API.

**Base URL:** `http://localhost:3000/api`

**Interactive Docs:** [Swagger UI](http://localhost:3000/api/docs)

---

## 🔐 Authentication

> **Current Version:** No authentication required (development mode)
>
> **Production:** JWT-based auth recommended

---

## 📊 Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "data": { ... },        // Present on success
  "error": "message"     // Present on failure
}
```

---

## 🏥 Health Check

### Check System Status

```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "api": "up",
    "ollama": "connected",
    "vectorStore": "up"
  },
  "stats": {
    "documents": 5
  },
  "timestamp": "2026-07-08T10:30:00.000Z"
}
```

**Error Response (503 Service Unavailable):**
```json
{
  "success": true,
  "status": "degraded",
  "services": {
    "api": "up",
    "ollama": "disconnected",
    "vectorStore": "up"
  }
}
```

---

## 📄 Documents

### Upload Document

Upload a PDF, DOCX, or TXT file to the knowledge base.

```http
POST /api/documents
Content-Type: multipart/form-data
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `file` | File | ✅ | PDF, DOCX, or TXT file (max 10MB) |

**Request:**
```bash
curl -X POST http://localhost:3000/api/documents \
  -F "file=@company-faq.pdf"
```

**Response (200 OK):**
```json
{
  "success": true,
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "company-faq.pdf",
    "mimeType": "application/pdf",
    "size": 245760,
    "chunkCount": 12,
    "createdAt": "2026-07-08T10:30:00.000Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Document contains insufficient text content"
}
```

**Response (413 Payload Too Large):**
```json
{
  "success": false,
  "error": "File too large. Maximum size is 10MB."
}
```

---

### List Documents

Get all uploaded documents.

```http
GET /api/documents
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 3,
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "company-faq.pdf",
      "mimeType": "application/pdf",
      "size": 245760,
      "chunkCount": 12,
      "createdAt": "2026-07-08T10:30:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "originalName": "return-policy.docx",
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "size": 15360,
      "chunkCount": 3,
      "createdAt": "2026-07-08T09:15:00.000Z"
    }
  ]
}
```

---

### Delete Document

Remove a document and its embeddings from the knowledge base.

```http
DELETE /api/documents/:id
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string (UUID) | ✅ | Document ID |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Document deleted"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Document not found"
}
```

---

## 💬 Chat

### Send Message (JSON Response)

Send a message to the AI assistant and receive a complete JSON response.

```http
POST /api/chat
Content-Type: application/json
```

**Request Body:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `message` | string | ✅ | User's question (1-2000 chars) |
| `sessionId` | string | ❌ | Existing session ID for context |

**Request:**
```json
{
  "message": "What is your return policy?",
  "sessionId": "session-uuid-here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": {
    "id": "msg-uuid-1",
    "role": "assistant",
    "content": "Our return policy allows returns within 30 days of purchase...",
    "timestamp": "2026-07-08T10:30:00.000Z",
    "sources": [
      {
        "documentId": "550e8400-e29b-41d4-a716-446655440000",
        "documentName": "company-faq.pdf",
        "chunkContent": "Return Policy: Customers may return items within 30 days...",
        "relevanceScore": 0.95
      }
    ]
  },
  "sessionId": "session-uuid-here",
  "sources": [
    {
      "documentId": "550e8400-e29b-41d4-a716-446655440000",
      "documentName": "company-faq.pdf",
      "chunkContent": "Return Policy: Customers may return items within 30 days...",
      "relevanceScore": 0.95
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Message is required and must be a string"
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Chat processing failed"
}
```

---

### Send Message (Streaming / SSE)

Send a message and receive a real-time streaming response using Server-Sent Events.

```http
POST /api/chat/stream
Content-Type: application/json
Accept: text/event-stream
```

**Request Body:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `message` | string | ✅ | User's question |
| `sessionId` | string | ❌ | Existing session ID |

**Event Types:**

| Event Type | Description |
|-----------|-------------|
| `status` | Status update (searching, generating) |
| `sources` | Retrieved document sources |
| `chunk` | Text chunk from AI response |
| `done` | Stream complete |
| `error` | Error occurred |

**Example Stream:**
```
data: {"type":"status","data":{"status":"searching"}}

data: {"type":"sources","data":{"sources":[{"documentId":"...","documentName":"faq.pdf","relevanceScore":0.95}]}}

data: {"type":"status","data":{"status":"generating"}}

data: {"type":"chunk","data":{"chunk":"Our ","messageId":"msg-123"}}

data: {"type":"chunk","data":{"chunk":"return policy ","messageId":"msg-123"}}

data: {"type":"chunk","data":{"chunk":"allows returns within 30 days.","messageId":"msg-123"}}

data: {"type":"done","data":{"messageId":"msg-123","sessionId":"sess-456"}}

data: [DONE]
```

**JavaScript Client Example:**
```javascript
const eventSource = new EventSource('/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello?' })
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'chunk':
      appendText(data.data.chunk);
      break;
    case 'sources':
      showSources(data.data.sources);
      break;
    case 'done':
      eventSource.close();
      break;
    case 'error':
      showError(data.data.error);
      break;
  }
};
```

---

### List Chat Sessions

Get all active chat sessions.

```http
GET /api/chat/sessions
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "sessions": [
    {
      "id": "sess-uuid-1",
      "messageCount": 12,
      "createdAt": "2026-07-08T10:00:00.000Z",
      "updatedAt": "2026-07-08T10:30:00.000Z"
    }
  ]
}
```

---

### Get Session Details

Retrieve full conversation history for a session.

```http
GET /api/chat/sessions/:id
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | ✅ | Session ID |

**Response (200 OK):**
```json
{
  "success": true,
  "session": {
    "id": "sess-uuid-1",
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "What is your return policy?",
        "timestamp": "2026-07-08T10:00:00.000Z"
      },
      {
        "id": "msg-2",
        "role": "assistant",
        "content": "Our return policy allows returns within 30 days...",
        "timestamp": "2026-07-08T10:00:05.000Z",
        "sources": [...]
      }
    ],
    "createdAt": "2026-07-08T10:00:00.000Z",
    "updatedAt": "2026-07-08T10:30:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Session not found"
}
```

---

## 📋 Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid parameters, missing fields |
| 404 | Not Found | Document/session doesn't exist |
| 413 | Payload Too Large | File exceeds 10MB limit |
| 415 | Unsupported Media Type | Invalid file type |
| 500 | Internal Server Error | Server processing error |
| 503 | Service Unavailable | Ollama not running |

---

## 🔧 Testing with cURL

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Upload Document
```bash
curl -X POST http://localhost:3000/api/documents \
  -F "file=@./docs/sample-faq.pdf"
```

### List Documents
```bash
curl http://localhost:3000/api/documents
```

### Chat (JSON)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What are your business hours?"}'
```

### Chat (Stream)
```bash
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message":"Hello?"}'
```

### Delete Document
```bash
curl -X DELETE http://localhost:3000/api/documents/550e8400-e29b-41d4-a716-446655440000
```

---

## 🔄 Rate Limits

> **Current Version:** No rate limiting (development)
>
> **Production:** Recommended 100 requests/minute per IP

---

## 📈 API Versioning

Current version: **v1** (default)

Future versions will use URL prefixing:
```
/api/v2/documents
/api/v2/chat
```

---

## 📝 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-08 | Initial release |

---

*For questions or issues, please open a GitHub issue.*

*Last updated: July 2026*
*Author: Arpita Gupta*
