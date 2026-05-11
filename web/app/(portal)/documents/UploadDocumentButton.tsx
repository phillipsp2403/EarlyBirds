'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadDocumentButton() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [accessLevel, setAccessLevel] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file || !title) return
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('access_level', accessLevel)

      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setShowForm(false)
      setTitle('')
      router.refresh()
    } catch {
      setError('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-lg"
      >
        + Upload document
      </button>
    )
  }

  return (
    <form onSubmit={handleUpload} className="flex items-end gap-2 flex-wrap">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Access</label>
        <select value={accessLevel} onChange={e => setAccessLevel(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">All members</option>
          <option value="rundown">Rundown+</option>
          <option value="admin">Admin only</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">File</label>
        <input type="file" ref={fileRef} required
          className="text-sm text-gray-600" />
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button type="submit" disabled={loading}
        className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
        {loading ? 'Uploading…' : 'Upload'}
      </button>
      <button type="button" onClick={() => setShowForm(false)}
        className="text-gray-600 text-sm px-4 py-2 rounded-lg border border-gray-300">
        Cancel
      </button>
    </form>
  )
}
