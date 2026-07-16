import { useRef, useEffect, useState } from 'react'
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { Message } from '../types'

interface ChatInterfaceProps {
  messages: Message[]
  loading: boolean
  onSend: (text: string) => void
  onClear: () => void
}

export default function ChatInterface({ messages, loading, onSend, onClear }: ChatInterfaceProps) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value || loading) return
    onSend(value)
    setText('')
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AI Assistant</h2>
          <p className="text-xs text-slate-500">Powered by local knowledge base</p>
        </div>
        <button
          onClick={onClear}
          className="text-xs px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          Clear chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <Bot className="w-12 h-12 mb-3 text-slate-300" />
            <p className="text-sm">Upload documents or import FAQs, then ask questions.</p>
            <p className="text-xs mt-1">The assistant answers only from your knowledge base.</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!text.trim() || loading}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose prose-slate prose-sm max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-1.5">Sources</p>
              <div className="space-y-1.5">
                {message.sources.slice(0, 3).map((src, idx) => (
                  <div key={idx} className="text-xs bg-white rounded-md p-2 border border-slate-200">
                    <p className="font-medium text-slate-700 truncate">{src.document_name}</p>
                    <p className="text-slate-500 line-clamp-2">{src.chunk_content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!isUser && message.content.includes("don't have information") && (
            <div className="mt-3 flex items-center gap-1.5 text-amber-600 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Escalation suggested</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
