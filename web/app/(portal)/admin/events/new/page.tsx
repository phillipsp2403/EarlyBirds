'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewEventPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    event_date: '',
    course_layout: '',
    scoring_format: 'stableford',
    group_size: '4',
    start_time: '07:00',
    tee_interval_mins: '10',
    registration_closes: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          group_size: parseInt(form.group_size),
          tee_interval_mins: parseInt(form.tee_interval_mins),
          registration_closes: form.registration_closes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/events')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">New Event</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Event date</label>
          <input type="date" value={form.event_date} onChange={set('event_date')} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Course / layout</label>
          <input type="text" value={form.course_layout} onChange={set('course_layout')} required
            placeholder="e.g. Pines, Hills"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Scoring format</label>
            <select value={form.scoring_format} onChange={set('scoring_format')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="stableford">Stableford</option>
              <option value="gross">Gross</option>
              <option value="net">Net</option>
              <option value="par">Par</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Group size</label>
            <select value={form.group_size} onChange={set('group_size')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="4">4</option>
              <option value="6">6</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start time</label>
            <input type="time" value={form.start_time} onChange={set('start_time')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tee interval (mins)</label>
            <input type="number" value={form.tee_interval_mins} onChange={set('tee_interval_mins')}
              min="1" max="20"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Registration closes (leave blank for 16 days before event)
          </label>
          <input type="date" value={form.registration_closes} onChange={set('registration_closes')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
            {loading ? 'Creating…' : 'Create event'}
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
