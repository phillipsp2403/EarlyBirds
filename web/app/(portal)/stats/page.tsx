import { createClient } from '@/lib/supabase/server'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: member }, { data: results }, { data: partners }] = await Promise.all([
    supabase
      .from('members')
      .select('first_name, last_name, games_played, times_as_booker, first_tee_count, tenth_tee_count')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('results')
      .select('score, actually_played, events(event_date, course_layout, scoring_format)')
      .eq('member_id', user!.id)
      .eq('actually_played', true)
      .order('events(event_date)', { ascending: false })
      .limit(20),
    supabase
      .from('playing_partners')
      .select('play_count, partner:partner_id(first_name, last_name)')
      .or(`member_id.eq.${user!.id},partner_id.eq.${user!.id}`)
      .order('play_count', { ascending: false })
      .limit(10),
  ])

  const scores = (results ?? [])
    .filter(r => r.score !== null)
    .map(r => Number(r.score))

  const avg = scores.length
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : null
  const best = scores.length ? Math.max(...scores) : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Statistics</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Games played', member?.games_played ?? 0],
          ['Times booker', member?.times_as_booker ?? 0],
          ['1st tee starts', member?.first_tee_count ?? 0],
          ['10th tee starts', member?.tenth_tee_count ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {avg !== null && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{avg}</p>
            <p className="text-xs text-gray-500 mt-1">Average score</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{best}</p>
            <p className="text-xs text-gray-500 mt-1">Best score</p>
          </div>
        </div>
      )}

      <section>
        <h2 className="font-semibold text-gray-800 mb-3">Recent Results</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-gray-500 bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Course</th>
                <th className="px-4 py-2 text-left">Format</th>
                <th className="px-4 py-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(results ?? []).map((r, i) => {
                const e = r.events as { event_date: string; course_layout: string; scoring_format: string } | null
                return (
                  <tr key={i}>
                    <td className="px-4 py-2 text-gray-700">
                      {e ? new Date(e.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{e?.course_layout ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{e?.scoring_format ?? '—'}</td>
                    <td className="px-4 py-2 text-right font-medium">{r.score ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {(results ?? []).length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">No results yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-gray-800 mb-3">Playing Partners</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-gray-500 bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Partner</th>
                <th className="px-4 py-2 text-right">Times together</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(partners ?? []).map((p, i) => {
                const partner = p.partner as unknown as { first_name: string; last_name: string } | null
                return (
                  <tr key={i}>
                    <td className="px-4 py-2 text-gray-700">
                      {partner ? `${partner.first_name} ${partner.last_name}` : '—'}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">{p.play_count}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {(partners ?? []).length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">No partner history yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
