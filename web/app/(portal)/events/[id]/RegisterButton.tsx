'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterButton({
  eventId,
  isRegistered,
  isOpen,
}: {
  eventId: string
  isRegistered: boolean
  isOpen: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function toggle() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: isRegistered ? 'DELETE' : 'POST',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return <p className="text-sm text-gray-400">Registration has closed for this event.</p>
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-sm px-4 py-2 rounded-lg disabled:opacity-50 ${
          isRegistered
            ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            : 'bg-green-700 hover:bg-green-800 text-white'
        }`}
      >
        {loading
          ? '…'
          : isRegistered
          ? 'Cancel registration'
          : 'Register for this event'}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
