import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateDraw } from '@/lib/draw/algorithm'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('members').select('access_level').eq('id', user.id).single()
  if (caller?.access_level !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: eventId } = await params

  // Load event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Load registered members
  const { data: registrations } = await supabase
    .from('red_book')
    .select('member_id, members(id, first_name, last_name, games_played, times_as_booker, last_booker_date, first_tee_count, tenth_tee_count, is_active, does_not_book)')
    .eq('event_id', eventId)

  const members = (registrations ?? [])
    .map(r => r.members as { id: string; first_name: string; last_name: string; games_played: number; times_as_booker: number; last_booker_date: string | null; first_tee_count: number; tenth_tee_count: number; is_active: boolean; does_not_book: boolean } | null)
    .filter((m): m is NonNullable<typeof m> => m !== null && m.is_active)

  if (members.length < 3) {
    return NextResponse.json({ error: 'Need at least 3 registered active members' }, { status: 400 })
  }

  // Load playing partner history
  const memberIds = members.map(m => m.id)
  const { data: history } = await supabase
    .from('playing_partners')
    .select('member_id, partner_id, play_count')
    .or(`member_id.in.(${memberIds.join(',')}),partner_id.in.(${memberIds.join(',')})`)

  const today = new Date().toISOString().split('T')[0]

  const groups = generateDraw({
    members,
    partnerHistory: history ?? [],
    groupSize: event.group_size,
    courseName: event.course_layout,
    startTime: event.start_time ?? '07:00',
    teeIntervalMins: event.tee_interval_mins ?? 10,
    today,
  })

  const service = await createServiceClient()

  // Delete any existing draw for this event
  await service.from('draw_groups').delete().eq('event_id', eventId)

  // Insert new draw groups
  for (const g of groups) {
    const { data: groupRow, error: groupErr } = await service
      .from('draw_groups')
      .insert({
        event_id: eventId,
        group_number: g.group_number,
        tee_time: g.tee_time,
        start_tee: g.start_tee,
      })
      .select('id')
      .single()

    if (groupErr || !groupRow) continue

    // Insert group members
    await service.from('draw_group_members').insert(
      g.members.map(memberId => ({
        group_id: groupRow.id,
        member_id: memberId,
        is_booker: memberId === g.booker,
      }))
    )

    // Update playing_partners table (upsert)
    for (let i = 0; i < g.members.length; i++) {
      for (let j = i + 1; j < g.members.length; j++) {
        const a = g.members[i] < g.members[j] ? g.members[i] : g.members[j]
        const b = a === g.members[i] ? g.members[j] : g.members[i]
        await service
          .from('playing_partners')
          .upsert(
            { member_id: a, partner_id: b, play_count: 1 },
            { onConflict: 'member_id,partner_id', ignoreDuplicates: false }
          )
          .then(async () => {
            // Increment play_count
            await service.rpc('increment_play_count', { p_member_id: a, p_partner_id: b })
          })
      }
    }
  }

  // Update member stats: booker counts, tee counts, games_played
  for (const g of groups) {
    // Booker
    const booker = members.find(m => m.id === g.booker)!
    await service
      .from('members')
      .update({
        times_as_booker: booker.times_as_booker + 1,
        last_booker_date: today,
        games_played: booker.games_played + 1,
      })
      .eq('id', g.booker)

    // Non-bookers
    const nonBookers = g.members.filter(id => id !== g.booker)
    for (const memberId of nonBookers) {
      const m = members.find(x => x.id === memberId)!
      const teeUpdates: Record<string, number> = {}
      if (g.start_tee === 1) teeUpdates.first_tee_count = m.first_tee_count + 1
      if (g.start_tee === 10) teeUpdates.tenth_tee_count = m.tenth_tee_count + 1
      await service
        .from('members')
        .update({ games_played: m.games_played + 1, ...teeUpdates })
        .eq('id', memberId)
    }

    // Booker tee update too
    if (g.start_tee === 1) {
      await service
        .from('members')
        .update({ first_tee_count: (members.find(m => m.id === g.booker)!.first_tee_count) + 1 })
        .eq('id', g.booker)
    } else if (g.start_tee === 10) {
      await service
        .from('members')
        .update({ tenth_tee_count: (members.find(m => m.id === g.booker)!.tenth_tee_count) + 1 })
        .eq('id', g.booker)
    }
  }

  // Mark draw as generated
  await service
    .from('events')
    .update({ draw_generated_at: new Date().toISOString() })
    .eq('id', eventId)

  return NextResponse.json({ groups })
}
