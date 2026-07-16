import { useState, useCallback } from 'react'
import type { Message, ChatSession, Document, HealthStatus } from '../types'

const API_BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async (content: string) => {
    setLoading(true)
    try {
      const body = {
        message: content,
        ...(sessionId ? { session_id: sessionId } : {}),
      }
      const data = await request<{
        success: boolean
        message: Message
        sessionId: string
        sources?: Message['sources']
      }>('/chat', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setSessionId(data.sessionId)
      setMessages(prev => [
        ...prev,
        { ...data.message, sources: data.sources || data.message.sources },
      ])
      return data
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const clear = useCallback(() => {
    setMessages([])
    setSessionId(null)
  }, [])

  return { messages, sessionId, loading, sendMessage, clear }
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)

  const fetchDocuments = useCallback(async () => {
    const data = await request<{ success: boolean; count: number; documents: Document[] }>('/documents')
    setDocuments(data.documents)
  }, [])

  const uploadDocument = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = (await res.json()) as { success: boolean; document: Document }
      setDocuments(prev => [data.document, ...prev])
      return data
    } finally {
      setUploading(false)
    }
  }, [])

  const deleteDocument = useCallback(async (id: string) => {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Delete failed')
    setDocuments(prev => prev.filter(d => d.id !== id))
  }, [])

  return { documents, uploading, fetchDocuments, uploadDocument, deleteDocument }
}

export function useHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null)

  const check = useCallback(async () => {
    const data = await request<HealthStatus>('/health')
    setHealth(data)
  }, [])

  return { health, check }
}

export function useSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])

  const fetchSessions = useCallback(async () => {
    const data = await request<{ success: boolean; count: number; sessions: ChatSession[] }>('/chat/sessions')
    setSessions(data.sessions)
  }, [])

  return { sessions, fetchSessions }
}
