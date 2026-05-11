import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import GenerateDrawButton from './GenerateDrawButton'

export default async function DrawsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { event: eventId } = await searchParams

  const { data: member } = await supabase
    .from('members')
    .select('access_level')
    .eq('id', user!.id)
    .single()
  const isAdmin = member?.access_level === 'admin'

  // List events with draws generated (or specific event)
  let eventQuery = supabase
    .from('events')
    .select('id, event_date, course_layout')
    .order('event_date', { ascending: false })
    .limit(20)

  if (!eventId) {
    eventQuery = eventQuery.not('draw_generated_at', 'is', null)
  }

  const { data: events } = await eventQuery
  const selectedEvent = eventId
    ? (events ?? []).find(e => e.id === eventId) ?? (await supabase.from('events').select('id, event_date, course_layout').eq('id', eventId).single()).data
    : (events ?? [])[0]

  // Load draw groups for selected event
  const { data: groups } = selectedEvent
    ? await supabase
        .from('draw_groups')
        .select('id, group_number, tee_time, start_tee, draw_group_members(is_booker, member_id, members(first_name, last_name))')
        .eq('event_id', selectedEvent.id)
        .order('group_number')
    : { data: [] }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Draws</h1>
        {isAdmin && selectedEvent && (
          <GenerateDrawButton eventId={selectedEvent.id} />
        )}
      </div>

      {/* Event selector */}
      <div className="flex gap-2 flex-wrap">
        {(events ?? []).map(e => (
          <Link
            key={e.id}
            href={`/draws?event=${e.id}`}
            className={`text-sm px-3 py-1 rounded-full border ${
              selectedEvent?.id === e.id
                ? 'bg-green-700 text-white border-green-700'
                : 'text-gray-600 border-gray-300 hover:border-green-500'
            }`}
          >
            {new Date(e.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
            {' '}{e.course_layout}
          </Link>
        ))}
      </div>

      {/* Draw groups */}
      {selectedEvent && (groups ?? []).length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {(groups ?? []).map(group => {
            const gMembers = (group.draw_group_members ?? []) as Array<{
              is_booker: boolean
              member_id: string
              members: { first_name: string; last_name: string } | null
            }>
            return (
              <div key={group.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Group {group.group_number}</h3>
                  <div className="text-xs text-gray-500 space-x-2">
                    {group.tee_time && <span>{group.tee_time.slice(0, 5)}</span>}
                    {group.start_tee && <span>Tee {group.start_tee}</span>}
                  </div>
                </div>
                <ul className="space-y-1">
                  {gMembers.map(gm => (
                    <li key={gm.member_id} className="text-sm flex items-center gap-2">
                      {gm.members
                        ? `${gm.members.first_name} ${gm.members.last_name}`
                        : '—'}
                      {gm.is_booker && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                          Booker
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      ) : selectedEvent ? (
        <div className="text-center text-gray-400 py-12">
          <p>No draw generated yet for this event.</p>
          {isAdmin && (
            <p className="text-sm mt-1">Use the Generate Draw button above.</p>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-12 text-sm">No draws available.</p>
      )}
    </div>
  )
}
