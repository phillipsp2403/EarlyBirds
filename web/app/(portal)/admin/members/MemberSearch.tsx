'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function MemberSearch({
  initialQ,
  initialActive,
}: {
  initialQ?: string
  initialActive?: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ ?? '')
  const [active, setActive] = useState(initialActive ?? '')

  function apply() {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (active) params.set('active', active)
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
        value={active}
        onChange={e => { setActive(e.target.value); }}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">All</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
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
