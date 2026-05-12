'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  member_number: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  alt_phone: string | null
  access_level: string
  status: string
  is_active: boolean
  committee: boolean
  does_not_book: boolean
  joined: string | null
}

export default function EditMemberForm({ member }: { member: Member }) {
  const router = useRouter()
  const [form, setForm] = useState({
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    phone: member.phone ?? '',
    alt_phone: member.alt_phone ?? '',
    access_level: member.access_level,
    status: member.status ?? 'Active',
    is_active: member.is_active,
    committee: member.committee ?? false,
    does_not_book: member.does_not_book ?? false,
    joined: member.joined ?? new Date().toISOString().split('T')[0],
  })
  const [resetPin, setResetPin] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm(f => ({ ...f, [key]: value }))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMsg('')
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setMsg('Saved!')
      setTimeout(() => setMsg(''), 3000)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPin(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{4}$/.test(resetPin)) { setError('PIN must be 4 digits'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/members/${member.id}/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: resetPin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setMsg('PIN reset!')
      setResetPin('')
      setTimeout(() => setMsg(''), 3000)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs text-gray-400">
          #{member.member_number} · login: {member.email}
        </p>

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
            <label className="block text-xs text-gray-500 mb-1">Joined</label>
            <input type="date" value={form.joined} onChange={set('joined')} required
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

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="w-4 h-4" />
            Active (can log in)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.committee} onChange={set('committee')} className="w-4 h-4" />
            Committee member
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.does_not_book} onChange={set('does_not_book')} className="w-4 h-4" />
            Does not book
          </label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {msg && <p className="text-green-600 text-sm">{msg}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
            {loading ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="text-gray-600 text-sm px-4 py-2 rounded-lg border border-gray-300">
            Back
          </button>
        </div>
      </form>

      <form onSubmit={handleResetPin} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">Reset PIN</h2>
        <input
          type="password"
          value={resetPin}
          onChange={e => setResetPin(e.target.value)}
          placeholder="New 4-digit PIN"
          maxLength={4}
          inputMode="numeric"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button type="submit" disabled={loading}
          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
          Reset PIN
        </button>
      </form>
    </div>
  )
}
