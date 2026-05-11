'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  member_number: string
  login_name: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  mobile: string | null
  access_level: string
  is_active: boolean
}

export default function EditMemberForm({ member }: { member: Member }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    phone: member.phone ?? '',
    mobile: member.mobile ?? '',
    access_level: member.access_level,
    is_active: member.is_active,
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
          #{member.member_number} · login: {member.login_name}
        </p>

        {(['first_name', 'last_name', 'email'] as const).map(key => (
          <div key={key}>
            <label className="block text-xs text-gray-500 mb-1 capitalize">{key.replace('_', ' ')}</label>
            <input
              type={key === 'email' ? 'email' : 'text'}
              value={(form as Record<string, string | boolean>)[key] as string}
              onChange={set(key)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={set('phone')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mobile</label>
            <input type="tel" value={form.mobile} onChange={set('mobile')}
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
          <div className="flex items-center gap-2 mt-5">
            <input type="checkbox" id="is_active" checked={form.is_active}
              onChange={set('is_active')} className="w-4 h-4" />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
          </div>
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
