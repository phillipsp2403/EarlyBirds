import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('access_level')
    .eq('id', user.id)
    .single()

  const canEnter = member?.access_level === 'admin' || member?.access_level === 'rundown'
  if (!canEnter) redirect('/dashboard')

  const { event: eventId } = await searchParams

  const { data: events } = await supabase
    .from('events')
    .select('id, event_date, course_layout, scoring_format')
    .not('draw_generated_at', 'is', null)
    .order('event_date', { ascending: false })
    .limit(20)

  const selectedEventId = eventId ?? (events ?? [])[0]?.id

  const [{ data: drawMembers }, { data: existingResults }] = selectedEventId
    ? await Promise.all([
        supabase
          .from('draw_group_members')
          .select('member_id, is_booker, draw_groups!inner(event_id), members(first_name, last_name)')
          .eq('draw_groups.event_id', selectedEventId),
        supabase
          .from('results')
          .select('*')
          .eq('event_id', selectedEventId),
      ])
    : [{ data: [] }, { data: [] }]

  const resultMap = new Map(
    (existingResults ?? []).map(r => [r.member_id, r])
  )

  const selectedEvent = (events ?? []).find(e => e.id === selectedEventId)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Results Entry</h1>

      <div className="flex gap-2 flex-wrap">
        {(events ?? []).map(e => (
          <Link
            key={e.id}
            href={`/results?event=${e.id}`}
            className={`text-sm px-3 py-1 rounded-full border ${
              selectedEventId === e.id
                ? 'bg-green-700 text-white border-green-700'
                : 'text-gray-600 border-gray-300 hover:border-green-500'
            }`}
          >
            {new Date(e.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
            {' '}{e.course_layout}
          </Link>
        ))}
      </div>

      {selectedEvent && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
            {new Date(selectedEvent.event_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}{selectedEvent.scoring_format}
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Member</th>
                <th className="px-4 py-2 text-left">Score</th>
                <th className="px-4 py-2 text-left">Played</th>
                <th className="px-4 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(drawMembers ?? []).map(dm => {
                const m = dm.members as { first_name: string; last_name: string } | null
                const existing = resultMap.get(dm.member_id)
                return (
                  <ResultRow
                    key={dm.member_id}
                    eventId={selectedEventId}
                    memberId={dm.member_id}
                    memberName={m ? `${m.first_name} ${m.last_name}` : '—'}
                    existingScore={existing?.score ?? null}
                    existingPlayed={existing?.actually_played ?? true}
                    existingId={existing?.id ?? null}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Inline client component for each row
function ResultRow({
  eventId,
  memberId,
  memberName,
  existingScore,
  existingPlayed,
  existingId,
}: {
  eventId: string
  memberId: string
  memberName: string
  existingScore: number | null
  existingPlayed: boolean
  existingId: string | null
}) {
  return (
    <tr>
      <td className="px-4 py-2">{memberName}</td>
      <td className="px-4 py-2 text-gray-500">
        {existingScore !== null ? existingScore : '—'}
      </td>
      <td className="px-4 py-2">
        {existingId ? (existingPlayed ? '✓' : '✗') : '—'}
      </td>
      <td className="px-4 py-2">
        <Link
          href={`/results/entry?event=${eventId}&member=${memberId}`}
          className="text-xs text-green-700 hover:underline"
        >
          {existingId ? 'Edit' : 'Enter'}
        </Link>
      </td>
    </tr>
  )
}
