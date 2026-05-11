'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function EntryForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event')!
  const memberId = searchParams.get('member')!

  const [score, setScore] = useState('')
  const [actuallyPlayed, setActuallyPlayed] = useState(true)
  const [memberName, setMemberName] = useState('')
  const [existingId, setExistingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/results?event=${eventId}&member=${memberId}`)
      .then(r => r.json())
      .then(data => {
        if (data.result) {
          setScore(String(data.result.score ?? ''))
          setActuallyPlayed(data.result.actually_played)
          setExistingId(data.result.id)
        }
        if (data.memberName) setMemberName(data.memberName)
      })
  }, [eventId, memberId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = existingId ? `/api/results/${existingId}` : '/api/results'
      const res = await fetch(url, {
        method: existingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          member_id: memberId,
          score: score === '' ? null : parseFloat(score),
          actually_played: actuallyPlayed,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push(`/results?event=${eventId}`)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Enter Result</h1>
      {memberName && <p className="text-gray-600">{memberName}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Score</label>
          <input
            type="number"
            step="0.1"
            value={score}
            onChange={e => setScore(e.target.value)}
            placeholder="Leave blank if not yet entered"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="actually_played"
            checked={actuallyPlayed}
            onChange={e => setActuallyPlayed(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="actually_played" className="text-sm text-gray-700">
            Actually played (uncheck if withdrew)
          </label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
            {loading ? 'Saving…' : 'Save'}
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

export default function ResultEntryPage() {
  return (
    <Suspense>
      <EntryForm />
    </Suspense>
  )
}
