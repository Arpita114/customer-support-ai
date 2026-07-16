# Customer Support AI

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Ollama-Local_AI-000000?logo=ollama&logoColor=white" />
  <img src="https://img.shields.io/badge/ChromaDB-0.6-FF6B6B" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" />
</p>

> **AI-powered customer support assistant** that answers questions using your company documentation and FAQs. Built with Python FastAPI backend and React frontend. Runs 100% locally with Ollama.

---

## Features

| Feature | Description |
|---------|-------------|
| 📄 **Document Ingestion** | Upload PDF, DOCX, and TXT files into the knowledge base |
| 🧠 **AI-Powered Q&A** | Answers questions using your company documentation via RAG |
| 💬 **Context-Aware Chat** | Maintains conversation history for follow-up questions |
| 🔍 **Vector Search** | ChromaDB-powered semantic search with embeddings |
| 🚀 **100% Free & Local** | Runs entirely on your machine via Ollama |
| 🎯 **Smart Escalation** | Says "I don't know" when information is unavailable |
| 📚 **Source Citations** | Shows which document chunks were used for each answer |
| 🎨 **Beautiful UI** | Modern React interface with Tailwind CSS |
| 📋 **FAQ Import** | Import FAQ items directly into the knowledge base |
| ⚡ **Streaming Responses** | Real-time AI response streaming |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 19 + TypeScript + Tailwind CSS + Vite           │  │
│  │  • Chat Interface    • Document Upload    • Sidebar     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬─────────────────────────────────┘
                              │ HTTP / SSE
┌─────────────────────────────▼─────────────────────────────────┐
│                        API LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FastAPI + Uvicorn                                      │  │
│  │  • /api/chat       • /api/documents    • /api/faqs     │  │
│  │  • /api/health     • /api/chat/stream  • /api/sessions │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬─────────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                    AI / VECTOR LAYER                           │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  Ollama        │  │  ChromaDB      │  │  nomic-embed    │  │
│  │  llama3.2      │  │  Vector Store  │  │  text           │  │
│  │  (LLM)         │  │  (Embeddings)  │  │  (Embeddings)   │  │
│  └────────────────┘  └────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0.0 | UI framework |
| TypeScript | 5.8.0 | Type safety |
| Vite | 6.0.0 | Build tool |
| Tailwind CSS | 3.4.17 | Styling |
| Lucide React | 0.460.0 | Icons |
| React Markdown | 9.0.1 | Markdown rendering |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.14 | Runtime |
| FastAPI | 0.115.6 | Web framework |
| Uvicorn | 0.34.0 | ASGI server |
| Ollama | Latest | Local AI/LLM |
| ChromaDB | 0.6.3 | Vector database |
| PyMuPDF | 1.25.2 | PDF text extraction |
| python-docx | 1.1.2 | DOCX text extraction |
| httpx | 0.28.1 | Async HTTP client |

### AI/ML
| Technology | Purpose |
|------------|---------|
| llama3.2 | Main chat LLM |
| nomic-embed-text | Text embeddings |

---

## Project Structure

```
customer-support-ai/
├── README.md                    # Project documentation
├── .gitignore                   # Git ignore rules
├── package.json                 # Root package configuration
├── requirements.txt             # Python dependencies
│
├── client/                      # React Frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx             # Entry point
│       ├── App.tsx              # Root component
│       ├── index.css            # Global styles
│       ├── types/index.ts       # TypeScript types
│       ├── hooks/useChat.ts     # Chat state management
│       └── components/
│           ├── ChatInterface.tsx
│           ├── DocumentUpload.tsx
│           └── Sidebar.tsx
│
├── python_backend/              # FastAPI Backend
│   ├── requirements.txt
│   ├── run_server.py
│   ├── .env
│   └── app/
│       ├── main.py              # FastAPI entry point
│       ├── config.py            # Configuration
│       ├── logger.py            # Logging setup
│       ├── models.py            # Pydantic models
│       ├── chat_service.py      # Chat logic
│       ├── document_service.py  # Document processing
│       ├── document_parser.py   # PDF/DOCX/TXT parser
│       ├── ollama_service.py    # Ollama AI integration
│       └── vector_store.py      # ChromaDB vector store
│
├── docs/
│   ├── api/API_DOCUMENTATION.md
│   └── architecture/ARCHITECTURE.md
│
├── scripts/
│   └── setup-ollama.js
│
└── server/                      # Legacy TypeScript backend
    └── ...
```

---

## Quick Start

### Prerequisites

- [Python](https://www.python.org/) 3.14+ installed
- [Node.js](https://nodejs.org/) 18+ installed
- [Ollama](https://ollama.com/) installed on your machine

### 1. Clone the Repository

```bash
git clone https://github.com/Arpita114/customer-support-ai.git
cd customer-support-ai
```

### 2. Start Ollama

```bash
# Start Ollama service
ollama serve
```

**Note:** Keep this terminal window open while running the project. Ollama must be running for the AI to work.

### 3. Install Ollama Models

Open a new terminal and run:

```bash
# Pull required AI models
ollama pull llama3.2
ollama pull nomic-embed-text

# Verify installation
ollama list
```

**Or use the setup script:**

```bash
npm run setup:ollama
```

### 4. Install Python Dependencies

```bash
cd python_backend
pip install -r requirements.txt
```

### 5. Install Frontend Dependencies

```bash
cd client
npm install
```

### 6. Start Development

```bash
# Terminal 1: Start the Python backend
cd python_backend
python run_server.py

# Terminal 2: Start the React frontend
cd client
npm run dev
```

### 7. Open in Browser

- **Application:** http://localhost:5173
- **API Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/api/health

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System health check |
| POST | `/api/documents` | Upload a document (PDF, DOCX, TXT) |
| GET | `/api/documents` | List all uploaded documents |
| DELETE | `/api/documents/{id}` | Delete a document |
| POST | `/api/faqs` | Import FAQ items into knowledge base |
| POST | `/api/chat` | Send a chat message |
| POST | `/api/chat/stream` | Stream chat response (SSE) |
| GET | `/api/chat/sessions` | List all chat sessions |
| GET | `/api/chat/sessions/{id}` | Get session details |

---

## Environment Variables

Create a `.env` file in `python_backend/`:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development

# Ollama AI Configuration (local development)
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=llama3.2
EMBEDDING_MODEL=nomic-embed-text

# OpenAI-compatible API (production / Render)
# Get a free API key from https://console.groq.com/keys
USE_OPENAI_FALLBACK=false
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_CHAT_MODEL=llama3-8b-8192
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Vector Database
VECTOR_DB_PATH=./data/vectors

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=INFO
```

---

## Deployment

### Backend on Render

1. Push this repository to GitHub.
2. Create a new **Web Service** in [Render](https://render.com/).
3. Connect your GitHub repo.
4. Set the following:
   - **Root Directory**: `python_backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: `Python 3.14`
5. Add environment variables:
   - `ENVIRONMENT=production`
   - `USE_OPENAI_FALLBACK=true`
   - `OPENAI_API_KEY` = your Groq API key (get one free at https://console.groq.com/keys)
   - `OPENAI_BASE_URL=https://api.groq.com/openai/v1`
   - `OPENAI_CHAT_MODEL=llama3-8b-8192`
   - `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`
6. Deploy. Render will give you a public backend URL.

### Frontend on Vercel

1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com/).
3. Set the **Root Directory** to `client`.
4. Add an environment variable:
   - `VITE_API_URL` = your Render backend URL (for example, `https://customer-support-ai-backend.onrender.com`)
5. Deploy.

### Connect Frontend to Backend

After both are deployed:
- Set `VITE_API_URL` in Vercel to your Render backend URL.
- Redeploy the frontend on Vercel.

---

## Contributing
5. Deploy. Vercel will detect Vite and build automatically.

### Backend on Render

1. Push this repository to GitHub.
2. Create a new **Web Service** in [Render](https://render.com/).
3. Connect your GitHub repo.
4. Set the following:
   - **Root Directory**: `python_backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: `Python 3.14`
5. Add environment variables:
   - `ENVIRONMENT=production`
   - `OLLAMA_BASE_URL=https://api.ollama.ai`
   - `LLM_MODEL=llama3.2`
   - `EMBEDDING_MODEL=nomic-embed-text`
6. Deploy. Render will give you a public backend URL.

### Connect Frontend to Backend

After both are deployed:
- Set `VITE_API_URL` in Vercel to your Render backend URL.
- Redeploy the frontend on Vercel.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Ollama](https://ollama.com/) for local AI models
- [ChromaDB](https://www.trychroma.com/) for vector storage
- [FastAPI](https://fastapi.tiangolo.com/) for the API framework
- [React](https://react.dev/) and [Tailwind CSS](https://tailwindcss.com/) for the frontend

---

<p align="center">Built with ❤️ using Python, FastAPI, React, and Ollama</p>
