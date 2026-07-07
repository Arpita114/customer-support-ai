# 🤖 Customer Support AI Assistant

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Ollama-Local_AI-000000?logo=ollama&logoColor=white" />
  <img src="https://img.shields.io/badge/LanceDB-Vector_DB-FF6B6B" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" />
</p>

> An **intelligent, 100% FREE, self-hosted** customer support assistant powered by local AI. No API keys. No subscription fees. Complete data privacy.

---

## 📑 Table of Contents

- [🎯 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [📸 Screenshots](#-screenshots)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [📚 API Documentation](#-api-documentation)
- [🔌 Deployment](#-deployment)
- [🛠️ Tech Stack](#️-tech-stack)
- [📝 Environment Variables](#-environment-variables)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| 📄 **Document Ingestion** | Upload PDF, DOCX, and TXT files into the knowledge base |
| 🧠 **AI-Powered Q&A** | Answers questions using your company documentation via RAG |
| 💬 **Context-Aware Chat** | Maintains conversation history for follow-up questions |
| 🔍 **Vector Search** | LanceDB-powered semantic search with embeddings |
| 🚀 **100% Free & Local** | Runs entirely on your machine via Ollama |
| 📊 **Admin Dashboard** | Upload documents, view chat history, manage knowledge base |
| ⚡ **Streaming Responses** | Real-time AI response streaming |
| 🎯 **Smart Escalation** | Says "I don't know" when information is unavailable |
| 📚 **Source Citations** | Shows which document chunks were used for each answer |
| 🎨 **Beautiful UI** | Modern React interface with Tailwind CSS |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  React 19 + TypeScript + Tailwind CSS + Vite              │ │
│  │  • Chat Interface    • Document Upload    • Admin Panel   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / SSE
┌────────────────────────────▼────────────────────────────────────┐
│                        API GATEWAY                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Express.js + TypeScript                                    │ │
│  │  • REST API Endpoints    • Swagger Docs    • CORS/Helmet  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼─────────┐ ┌──────▼──────┐ ┌────────▼────────┐
│  AI SERVICES      │ │  VECTOR DB  │ │  FILE STORAGE   │
│  ┌─────────────┐  │ │  ┌────────┐ │ │  ┌────────────┐ │
│  │ Ollama LLM  │  │ │  │LanceDB │ │ │  │ Uploads    │ │
│  │ (llama3.2)  │  │ │  │+Embeds │ │ │  │ Directory  │ │
│  └─────────────┘  │ │  └────────┘ │ │  └────────────┘ │
│  ┌─────────────┐  │ │             │ │                 │
│  │ nomic-embed │  │ │             │ │                 │
│  │ -text       │  │ │             │ │                 │
│  └─────────────┘  │ │             │ │                 │
└───────────────────┘ └─────────────┘ └─────────────────┘
```

**Detailed Architecture:** [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)

**Architecture Diagram:** [docs/architecture/system-architecture.png](docs/architecture/system-architecture.png)

---

## 📸 Screenshots

> *Screenshots will be added here after deployment*

| Dashboard | Chat Interface | Document Upload |
|-----------|----------------|-----------------|
| *Coming soon* | *Coming soon* | *Coming soon* |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- [Ollama](https://ollama.com/) installed on your machine

### 1. Clone the Repository

```bash
git clone https://github.com/Arpita114/customer-support-ai.git
cd customer-support-ai
```

### 2. Install Ollama Models

```bash
# Pull required AI models
ollama pull llama3.2
ollama pull nomic-embed-text

# Verify installation
ollama list
```

### 3. Install Dependencies

```bash
# Install all dependencies (root + server + client)
npm run install:all
```

### 4. Configure Environment

```bash
# Copy environment template
cp server/.env.example server/.env

# Edit server/.env with your settings (optional)
```

### 5. Start Development

```bash
# Start both server and client concurrently
npm run dev

# Or start separately:
npm run dev:server  # Terminal 1 - API on port 3000
npm run dev:client  # Terminal 2 - UI on port 5173
```

### 6. Open in Browser

- **Application:** http://localhost:5173
- **API Documentation:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/api/health

---

## 📁 Project Structure

```
customer-support-ai/
├── 📄 README.md                    # Project documentation
├── 📄 package.json                 # Root package configuration
├── 📄 .gitignore                   # Git ignore rules
│
├── 📁 client/                      # React Frontend
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   ├── 📄 tailwind.config.js
│   ├── 📄 tsconfig.json
│   ├── 📄 index.html
│   └── 📁 src/
│       ├── 📄 main.tsx             # Entry point
│       ├── 📄 App.tsx              # Root component
│       ├── 📄 index.css            # Global styles
│       ├── 📁 components/
│       │   ├── 📄 ChatInterface.tsx    # Chat UI
│       │   ├── 📄 DocumentUpload.tsx # Upload UI
│       │   └── 📄 Sidebar.tsx        # Navigation
│       ├── 📁 hooks/
│       │   └── 📄 useChat.ts       # Chat state management
│       └── 📁 types/
│           └── 📄 index.ts         # TypeScript types
│
├── 📁 server/                      # Express Backend
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 .env.example             # Environment template
│   └── 📁 src/
│       ├── 📄 index.ts             # Server entry point
│       ├── 📁 routes/
│       │   ├── 📄 documents.ts     # Document API routes
│       │   ├── 📄 chat.ts          # Chat API routes
│       │   └── 📄 health.ts        # Health check route
│       ├── 📁 services/
│       │   ├── 📄 ollamaService.ts # AI/LLM integration
│       │   ├── 📄 vectorStore.ts   # Vector database
│       │   ├── 📄 documentService.ts # Document processing
│       │   └── 📄 chatService.ts   # Chat logic
│       ├── 📁 utils/
│       │   ├── 📄 config.ts        # Configuration
│       │   ├── 📄 logger.ts        # Winston logger
│       │   └── 📄 documentParser.ts # PDF/DOCX/TXT parser
│       └── 📁 types/
│           └── 📄 index.ts         # TypeScript types
│
├── 📁 docs/                        # Documentation
│   ├── 📁 architecture/
│   │   ├── 📄 ARCHITECTURE.md      # Detailed architecture docs
│   │   └── 📄 system-architecture.png # Architecture diagram
│   └── 📁 api/
│       └── 📄 API_DOCUMENTATION.md # API reference
│
├── 📁 scripts/                     # Utility scripts
│   └── 📄 setup-ollama.js          # Ollama setup helper
│
└── 📁 .github/
    └── 📁 workflows/
        └── 📄 ci.yml               # GitHub Actions CI/CD
```

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3000/api
Production:  https://your-domain.com/api
```

### Endpoints Overview

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/health` | System health check | No |
| `POST` | `/api/documents` | Upload PDF/DOCX/TXT | No |
| `GET` | `/api/documents` | List all documents | No |
| `DELETE` | `/api/documents/:id` | Delete a document | No |
| `POST` | `/api/chat` | Send message (JSON response) | No |
| `POST` | `/api/chat/stream` | Send message (SSE stream) | No |
| `GET` | `/api/chat/sessions` | List chat sessions | No |
| `GET` | `/api/chat/sessions/:id` | Get session details | No |

### Interactive API Docs

Full Swagger UI documentation available at:
```
http://localhost:3000/api/docs
```

**Detailed API Documentation:** [docs/api/API_DOCUMENTATION.md](docs/api/API_DOCUMENTATION.md)

---

## 🔌 Deployment

### Local Deployment (Development)

```bash
# Start Ollama
ollama serve

# Start application
npm run dev
```

### Docker Deployment (Production)

```bash
# Build Docker images
docker-compose up --build
```

### Cloud Deployment Options

| Platform | Guide | Link |
|----------|-------|------|
| **Vercel** (Frontend) | Deploy React app | [vercel.com](https://vercel.com) |
| **Render** (Full-stack) | Deploy Node.js + React | [render.com](https://render.com) |
| **Railway** (Full-stack) | One-click deploy | [railway.app](https://railway.app) |
| **AWS EC2** (Self-hosted) | VPS deployment | [aws.amazon.com](https://aws.amazon.com) |

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure environment variables
- [ ] Set up Ollama on server (or use external LLM API)
- [ ] Configure CORS for production domain
- [ ] Set up reverse proxy (Nginx/Caddy)
- [ ] Enable HTTPS with SSL certificate
- [ ] Set up monitoring and logging

**Live Demo:** *Coming soon — [Add your deployment link here]*

---

## 🛠️ Tech Stack

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
| Express.js | 4.21.2 | Web framework |
| TypeScript | 5.8.0 | Type safety |
| Ollama | Latest | Local AI/LLM |
| LanceDB | 0.15.0 | Vector database |
| Multer | 1.4.5 | File uploads |
| Winston | 3.17.0 | Logging |
| Swagger | 6.2.8 | API documentation |

### AI/ML
| Technology | Purpose |
|------------|---------|
| llama3.2 | Main chat LLM |
| nomic-embed-text | Text embeddings |
| pdf-parse | PDF text extraction |
| mammoth | DOCX text extraction |

---

## 📝 Environment Variables

Create `server/.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Ollama AI Configuration
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=llama3.2
EMBEDDING_MODEL=nomic-embed-text

# Database
VECTOR_DB_PATH=./data/vectors.lance

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run server tests
cd server && npm test

# Run client tests
cd client && npm test
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 🙏 Acknowledgments

- [Ollama](https://ollama.com/) — For making local AI accessible
- [LanceDB](https://lancedb.github.io/) — For the excellent vector database
- [React](https://react.dev/) — For the UI framework
- [Express](https://expressjs.com/) — For the web framework

---

## 👩‍💻 Author

**Arpita Gupta**

- GitHub: [@Arpita114](https://github.com/Arpita114)
- Project: [customer-support-ai](https://github.com/Arpita114/customer-support-ai)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <b>Built with ❤️ by Arpita Gupta</b>
  <br>
  <sub>100% Free • Self-Hosted • Privacy-First</sub>
</p>
