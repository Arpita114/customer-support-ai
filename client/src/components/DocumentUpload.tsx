import { useCallback, useState } from 'react'
import { Upload, FileText, Trash2, Loader2, Plus } from 'lucide-react'
import type { Document } from '../types'

interface DocumentUploadProps {
  documents: Document[]
  uploading: boolean
  onUpload: (file: File) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

export default function DocumentUpload({ documents, uploading, onUpload, onDelete, onRefresh }: DocumentUploadProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }, [onUpload])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    e.target.value = ''
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Knowledge Base</h3>
        <p className="text-xs text-slate-500 mt-0.5">Upload docs or import FAQs</p>
      </div>

      <div className="p-4 space-y-3">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-slate-400" />
            )}
            <p className="text-xs text-slate-600 font-medium">
              {uploading ? 'Uploading...' : 'Drop files or click to upload'}
            </p>
            <p className="text-[10px] text-slate-400">PDF, DOCX, TXT, MD</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Refresh list
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="group flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:border-slate-300 transition-colors">
            <div className="flex-shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{doc.originalName}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {(doc.size / 1024).toFixed(1)} KB · {doc.chunkCount} chunks
              </p>
            </div>
            <button
              onClick={() => onDelete(doc.id)}
              className="flex-shrink-0 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
              title="Delete document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">No documents yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
