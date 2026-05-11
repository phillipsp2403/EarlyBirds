import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: events }, { data: myRegs }, { data: member }] = await Promise.all([
    supabase
      .from('events')
      .select('id, event_date, course_layout, scoring_format, group_size, registration_closes, draw_generated_at')
      .gte('event_date', new Date(Date.now() - 90 * 86400_000).toISOString().split('T')[0])
      .order('event_date', { ascending: false }),
    supabase
      .from('red_book')
      .select('event_id')
      .eq('member_id', user!.id),
    supabase
      .from('members')
      .select('access_level')
      .eq('id', user!.id)
      .single(),
  ])

  const registeredIds = new Set((myRegs ?? []).map(r => r.event_id))
  const isAdmin = member?.access_level === 'admin'
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        {isAdmin && (
          <Link
            href="/admin/events/new"
            className="bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-lg"
          >
            + New event
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {(events ?? []).map(event => {
          const isOpen = event.registration_closes! >= today
          const isFuture = event.event_date >= today
          const isReg = registeredIds.has(event.id)

          return (
            <div
              key={event.id}
              className="bg-white rounded-xl border border-gray-200 px-4 py-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {new Date(event.event_date).toLocaleDateString('en-AU', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {event.course_layout} · {event.scoring_format} · groups of {event.group_size}
                </p>
                {isFuture && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Registration closes {new Date(event.registration_closes!).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {event.draw_generated_at && (
                  <Link href={`/draws?event=${event.id}`}
                    className="text-xs text-blue-600 hover:underline">Draw</Link>
                )}
                {isFuture && isOpen && !isReg && (
                  <Link href={`/events/${event.id}`}
                    className="text-xs bg-green-700 text-white px-3 py-1 rounded-full hover:bg-green-800">
                    Register
                  </Link>
                )}
                {isFuture && isReg && (
                  <Link href={`/events/${event.id}`}
                    className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    Registered
                  </Link>
                )}
                {isFuture && !isOpen && !isReg && (
                  <span className="text-xs text-gray-400">Closed</span>
                )}
                {isAdmin && (
                  <Link href={`/admin/events/${event.id}`}
                    className="text-xs text-gray-500 hover:underline">Edit</Link>
                )}
              </div>
            </div>
          )
        })}

        {(events ?? []).length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No events found.</p>
        )}
      </div>
    </div>
  )
}
