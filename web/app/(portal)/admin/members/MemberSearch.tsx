'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function MemberSearch({
  initialQ,
  initialSuspended,
}: {
  initialQ?: string
  initialSuspended?: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ ?? '')
  const [suspended, setSuspended] = useState(initialSuspended ?? '')

  function apply() {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (suspended) params.set('suspended', suspended)
    router.push(`/admin/members?${params}`)
  }

  return (
    <div className="flex gap-2 items-center">
      <input
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && apply()}
        placeholder="Search name, login, number…"
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
      <select
        value={suspended}
        onChange={e => setSuspended(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">All</option>
        <option value="false">Active</option>
        <option value="true">Suspended</option>
      </select>
      <button
        onClick={apply}
        className="bg-green-700 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-800"
      >
        Search
      </button>
    </div>
  )
}
