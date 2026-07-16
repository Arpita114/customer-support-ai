export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: Source[]
}

export interface Source {
  document_id: string
  document_name: string
  chunk_content: string
  relevance_score: number
}

export interface ChatSession {
  id: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  originalName: string
  mimeType: string
  size: number
  chunkCount: number
  createdAt: string
}

export interface HealthStatus {
  success: boolean
  status: string
  ollama: string
  documents: number
  sessions: number
}
