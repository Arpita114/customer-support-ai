import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatInterface from './components/ChatInterface'
import DocumentUpload from './components/DocumentUpload'
import { useChat, useDocuments, useHealth } from './hooks/useChat'
import { Wifi, WifiOff } from 'lucide-react'

type Tab = 'chat' | 'documents'

export default function App() {
  const [tab, setTab] = useState<Tab>('chat')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const chat = useChat()
  const docs = useDocuments()
  const health = useHealth()

  useEffect(() => {
    health.check()
    docs.fetchDocuments()
  }, [health.check, docs.fetchDocuments])

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={tab}
        onTabChange={setTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              {tab === 'chat' ? 'AI Chat' : 'Knowledge Base'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <HealthBadge health={health.health} onRefresh={health.check} />
          </div>
        </header>

        <div className="flex-1 min-h-0">
          {tab === 'chat' ? (
            <ChatInterface
              messages={chat.messages}
              loading={chat.loading}
              onSend={chat.sendMessage}
              onClear={chat.clear}
            />
          ) : (
            <DocumentUpload
              documents={docs.documents}
              uploading={docs.uploading}
              onUpload={docs.uploadDocument}
              onDelete={docs.deleteDocument}
              onRefresh={docs.fetchDocuments}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function HealthBadge({ health, onRefresh }: { health: ReturnType<typeof useHealth>['health'], onRefresh: () => void }) {
  return (
    <button
      onClick={onRefresh}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors"
    >
      {health?.ollama === 'connected' ? (
        <>
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-700">Ollama connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Ollama disconnected</span>
        </>
      )}
    </button>
  )
}
