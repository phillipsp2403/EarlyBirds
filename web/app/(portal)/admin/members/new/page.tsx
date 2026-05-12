'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewMemberPage() {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    member_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    alt_phone: '',
    access_level: 'member',
    status: 'Active',
    committee: false,
    does_not_book: false,
    joined: today,
    initial_pin: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm(f => ({ ...f, [key]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/admin/members')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">New Member</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Member number</label>
            <input type="text" value={form.member_number} onChange={set('member_number')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Joined</label>
            <input type="date" value={form.joined} onChange={set('joined')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">First name</label>
            <input type="text" value={form.first_name} onChange={set('first_name')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Last name</label>
            <input type="text" value={form.last_name} onChange={set('last_name')} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Email (also used as login name)</label>
          <input type="email" value={form.email} onChange={set('email')} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={set('phone')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Alt phone</label>
            <input type="tel" value={form.alt_phone} onChange={set('alt_phone')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Access level</label>
            <select value={form.access_level} onChange={set('access_level')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="member">Member</option>
              <option value="rundown">Rundown</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={form.status} onChange={set('status')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="Active">Active</option>
              <option value="Lapsed">Lapsed</option>
              <option value="Associated">Associated</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.committee} onChange={set('committee')} className="w-4 h-4" />
            Committee member
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.does_not_book} onChange={set('does_not_book')} className="w-4 h-4" />
            Does not book
          </label>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Initial PIN (4 digits)</label>
          <input type="password" value={form.initial_pin} onChange={set('initial_pin')} required
            maxLength={4} inputMode="numeric"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
            {loading ? 'Creating…' : 'Create member'}
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
