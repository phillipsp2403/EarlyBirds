import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RegisterButton from './RegisterButton'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: event }, { data: reg }, { data: registrations }] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('red_book')
      .select('id')
      .eq('event_id', id)
      .eq('member_id', user.id)
      .maybeSingle(),
    supabase
      .from('red_book')
      .select('member_id, members(first_name, last_name)')
      .eq('event_id', id)
      .order('registered_at'),
  ])

  if (!event) redirect('/events')

  const today = new Date().toISOString().split('T')[0]
  const isOpen = (event.registration_closes ?? '') >= today
  const isRegistered = !!reg

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {new Date(event.event_date).toLocaleDateString('en-AU', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {event.course_layout} · {event.scoring_format} · groups of {event.group_size}
        </p>
        {event.start_time && (
          <p className="text-gray-500 text-sm">First tee time: {event.start_time}</p>
        )}
        {event.notes && (
          <p className="text-gray-600 text-sm mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">{event.notes}</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            Registration {isOpen ? 'open' : 'closed'}
          </p>
          <p className="text-xs text-gray-400">
            Closes {event.registration_closes ? new Date(event.registration_closes).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' }) : '—'}
          </p>
        </div>
        <RegisterButton
          eventId={id}
          isRegistered={isRegistered}
          isOpen={isOpen}
        />
      </div>

      <div>
        <h2 className="font-semibold text-gray-800 mb-2">
          Registered ({(registrations ?? []).length})
        </h2>
        <ul className="space-y-1">
          {(registrations ?? []).map((r, i) => {
            const m = r.members as { first_name: string; last_name: string } | null
            return (
              <li key={r.member_id} className="text-sm text-gray-700 flex gap-2">
                <span className="text-gray-400 w-5 text-right">{i + 1}.</span>
                {m ? `${m.first_name} ${m.last_name}` : '—'}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
