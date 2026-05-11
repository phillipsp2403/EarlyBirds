'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewMemberPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    member_number: '',
    login_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    access_level: 'member',
    initial_pin: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
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

  const fields: [string, string, string][] = [
    ['member_number', 'Member number', 'text'],
    ['login_name', 'Login name', 'text'],
    ['first_name', 'First name', 'text'],
    ['last_name', 'Last name', 'text'],
    ['email', 'Email', 'email'],
    ['phone', 'Phone', 'tel'],
    ['mobile', 'Mobile', 'tel'],
    ['initial_pin', 'Initial PIN (4 digits)', 'password'],
  ]

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">New Member</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        {fields.map(([key, label, type]) => (
          <div key={key}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input
              type={type}
              value={(form as Record<string, string>)[key]}
              onChange={set(key)}
              required={['member_number','login_name','first_name','last_name','email','initial_pin'].includes(key)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        ))}

        <div>
          <label className="block text-xs text-gray-500 mb-1">Access level</label>
          <select
            value={form.access_level}
            onChange={set('access_level')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="member">Member</option>
            <option value="rundown">Rundown</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg"
          >
            {loading ? 'Creating…' : 'Create member'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 text-sm px-4 py-2 rounded-lg border border-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
