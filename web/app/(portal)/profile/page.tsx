'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MemberProfile {
  member_number: string
  login_name: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  mobile: string | null
  access_level: string
  games_played: number
  times_as_booker: number
}

export default function ProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [phone, setPhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data as MemberProfile)
            setPhone(data.phone ?? '')
            setMobile(data.mobile ?? '')
          }
        })
    })
  }, [])

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('members')
      .update({ phone, mobile })
      .eq('id', user.id)
    setSaveMsg(error ? 'Failed to save.' : 'Saved!')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault()
    setPinError('')
    setPinMsg('')

    if (newPin !== confirmPin) {
      setPinError('New PINs do not match')
      return
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits')
      return
    }

    // Verify current PIN by re-authenticating
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: profile?.login_name, pin: currentPin }),
    })

    if (!res.ok) {
      setPinError('Current PIN is incorrect')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPin })
    if (error) {
      setPinError('Failed to update PIN')
    } else {
      setPinMsg('PIN updated successfully')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    }
  }

  if (!profile) return <p className="text-gray-500">Loading…</p>

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Member #{profile.member_number} · {profile.access_level}
        </p>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
        <h2 className="font-semibold text-gray-800">Account details</h2>
        <dl className="text-sm text-gray-700 space-y-1">
          <div className="flex gap-2"><dt className="text-gray-500 w-28">Name</dt><dd>{profile.first_name} {profile.last_name}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-28">Login name</dt><dd>{profile.login_name}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-28">Email</dt><dd>{profile.email}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-28">Games played</dt><dd>{profile.games_played}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-28">Times booker</dt><dd>{profile.times_as_booker}</dd></div>
        </dl>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Contact details</h2>
        <form onSubmit={handleSaveContact} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mobile</label>
            <input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-lg"
          >
            Save
          </button>
          {saveMsg && <p className="text-green-600 text-sm">{saveMsg}</p>}
        </form>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Change PIN</h2>
        <form onSubmit={handleChangePin} className="space-y-3">
          {(['Current PIN', 'New PIN', 'Confirm new PIN'] as const).map((label, i) => {
            const vals = [currentPin, newPin, confirmPin]
            const setters = [setCurrentPin, setNewPin, setConfirmPin]
            return (
              <div key={label}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={vals[i]}
                  onChange={e => setters[i](e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )
          })}
          {pinError && <p className="text-red-600 text-sm">{pinError}</p>}
          {pinMsg && <p className="text-green-600 text-sm">{pinMsg}</p>}
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-lg"
          >
            Update PIN
          </button>
        </form>
      </section>
    </div>
  )
}
