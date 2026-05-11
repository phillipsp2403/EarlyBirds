import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: announcements }, { data: member }] = await Promise.all([
    supabase
      .from('announcements')
      .select('id, title, body, sent_at, created_at')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(30),
    supabase
      .from('members')
      .select('access_level')
      .eq('id', user!.id)
      .single(),
  ])

  const isAdmin = member?.access_level === 'admin'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        {isAdmin && (
          <Link
            href="/admin/announcements/new"
            className="bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-lg"
          >
            + New announcement
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {(announcements ?? []).map(a => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <h2 className="font-semibold text-gray-900">{a.title}</h2>
              <time className="text-xs text-gray-400 shrink-0 ml-4">
                {new Date(a.sent_at!).toLocaleDateString('en-AU', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </time>
            </div>
            <div
              className="text-sm text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: a.body }}
            />
          </div>
        ))}
        {(announcements ?? []).length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No announcements.</p>
        )}
      </div>
    </div>
  )
}
