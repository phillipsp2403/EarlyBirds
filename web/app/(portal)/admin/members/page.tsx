import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MemberSearch from './MemberSearch'

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; suspended?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentMember } = await supabase
    .from('members')
    .select('access_level')
    .eq('id', user.id)
    .single()

  if (currentMember?.access_level !== 'admin') redirect('/dashboard')

  const { q, suspended } = await searchParams
  let query = supabase
    .from('members')
    .select('id, member_number, login_name, first_name, last_name, email, access_level, suspended, games_played')
    .order('last_name')

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,login_name.ilike.%${q}%,member_number.ilike.%${q}%`
    )
  }
  if (suspended === 'true') query = query.eq('suspended', true)
  if (suspended === 'false') query = query.eq('suspended', false)

  const { data: members } = await query

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <Link
          href="/admin/members/new"
          className="bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-lg"
        >
          + New member
        </Link>
      </div>

      <MemberSearch initialQ={q} initialSuspended={suspended} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Login</th>
              <th className="px-4 py-3 text-left">Level</th>
              <th className="px-4 py-3 text-left">Games</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(members ?? []).map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{m.member_number}</td>
                <td className="px-4 py-3 font-medium">{m.first_name} {m.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{m.login_name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.access_level === 'admin'
                      ? 'bg-yellow-100 text-yellow-700'
                      : m.access_level === 'rundown'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {m.access_level}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{m.games_played}</td>
                <td className="px-4 py-3">
                  {m.suspended ? (
                    <span className="text-xs text-red-500">Suspended</span>
                  ) : (
                    <span className="text-xs text-green-600">Active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/members/${m.id}`}
                    className="text-xs text-green-700 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(members ?? []).length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No members found.</p>
        )}
      </div>
    </div>
  )
}
