'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [recipientType, setRecipientType] = useState<'all' | 'specific'>('all')
  const [sendNow, setSendNow] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, recipient_type: recipientType, send_now: sendNow }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/announcements')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">New Announcement</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Body (HTML supported)</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} required rows={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
          {body && (
            <div className="mt-2 p-3 border border-gray-200 rounded-lg text-sm text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: body }} />
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Recipients</label>
          <select value={recipientType} onChange={e => setRecipientType(e.target.value as 'all' | 'specific')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="all">All active members</option>
            <option value="specific">Specific members (TBD)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="send_now" checked={sendNow} onChange={e => setSendNow(e.target.checked)}
            className="w-4 h-4" />
          <label htmlFor="send_now" className="text-sm text-gray-700">Send email now</label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
            {loading ? 'Publishing…' : sendNow ? 'Publish & send' : 'Save draft'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="text-gray-600 text-sm px-4 py-2 rounded-lg border border-gray-300">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
