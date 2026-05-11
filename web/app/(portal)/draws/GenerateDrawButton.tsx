'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GenerateDrawButton({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    if (!confirm('Generate (or regenerate) the draw for this event?')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/events/${eventId}/draw`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg"
      >
        {loading ? 'Generating…' : 'Generate Draw'}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
