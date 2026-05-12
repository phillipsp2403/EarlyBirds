'use client'

import Link from 'next/link'

interface Props {
  member: {
    first_name: string
    last_name: string
    access_level: 'admin' | 'rundown' | 'member'
  } | null
}

export default function NavBar({ member }: Props) {
  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const isAdmin = member?.access_level === 'admin'
  const isRundown = member?.access_level === 'rundown' || isAdmin

  return (
    <nav className="bg-green-800 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg tracking-tight">
            Early Birds
          </Link>
          <Link href="/events" className="text-sm hover:text-green-200">Events</Link>
          <Link href="/draws" className="text-sm hover:text-green-200">Draws</Link>
          {isRundown && <Link href="/results" className="text-sm hover:text-green-200">Results</Link>}
          <Link href="/stats" className="text-sm hover:text-green-200">Stats</Link>
          <Link href="/documents" className="text-sm hover:text-green-200">Documents</Link>
          {isAdmin && (
            <Link href="/admin/members" className="text-sm hover:text-green-200 text-yellow-300">
              Members
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/profile" className="hover:text-green-200">
            {member ? `${member.first_name} ${member.last_name}` : 'My Profile'}
          </Link>
          <button
            onClick={handleLogout}
            className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-xs"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
