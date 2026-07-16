import { MessageSquare, FolderOpen, Settings, ChevronLeft, ChevronRight } from 'lucide-react'

interface SidebarProps {
  activeTab: 'chat' | 'documents'
  onTabChange: (tab: 'chat' | 'documents') => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <div className={`bg-slate-900 text-white flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between px-4 py-4">
        {!collapsed && (
          <div>
            <h1 className="text-sm font-bold tracking-tight">Support AI</h1>
            <p className="text-[10px] text-slate-400">Customer Assistant</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <NavItem
          icon={<MessageSquare className="w-4 h-4" />}
          label="Chat"
          active={activeTab === 'chat'}
          onClick={() => onTabChange('chat')}
          collapsed={collapsed}
        />
        <NavItem
          icon={<FolderOpen className="w-4 h-4" />}
          label="Documents"
          active={activeTab === 'documents'}
          onClick={() => onTabChange('documents')}
          collapsed={collapsed}
        />
        <NavItem
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
          active={false}
          onClick={() => {}}
          collapsed={collapsed}
        />
      </nav>

      <div className="p-3 border-t border-slate-800">
        {!collapsed && (
          <div className="text-[10px] text-slate-500">
            <p>Local AI · Ollama</p>
            <p>RAG Powered</p>
          </div>
        )}
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
      title={collapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  )
}
