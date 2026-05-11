import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: member }, { data: upcomingEvents }, { data: myRegistrations }] =
    await Promise.all([
      supabase
        .from('members')
        .select('first_name, access_level, games_played, times_as_booker')
        .eq('id', user!.id)
        .single(),
      supabase
        .from('events')
        .select('id, event_date, course_layout, scoring_format, registration_closes')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date')
        .limit(5),
      supabase
        .from('red_book')
        .select('event_id')
        .eq('member_id', user!.id),
    ])

  const registeredEventIds = new Set((myRegistrations ?? []).map(r => r.event_id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {member?.first_name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {member?.games_played} games played · {member?.times_as_booker} times as booker
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Upcoming Events</h2>
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.map(event => {
              const isRegistered = registeredEventIds.has(event.id)
              const isOpen = new Date(event.registration_closes!) >= new Date()
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(event.event_date).toLocaleDateString('en-AU', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {event.course_layout} · {event.scoring_format}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isRegistered ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Registered
                      </span>
                    ) : isOpen ? (
                      <Link
                        href={`/events/${event.id}`}
                        className="text-xs bg-green-700 text-white px-3 py-1 rounded-full hover:bg-green-800"
                      >
                        Register
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">Closed</span>
                    )}
                    <Link href={`/draws?event=${event.id}`} className="text-xs text-gray-500 hover:underline">
                      Draw
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No upcoming events.</p>
        )}
      </section>
    </div>
  )
}
