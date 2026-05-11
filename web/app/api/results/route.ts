import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('event')
  const memberId = searchParams.get('member')

  const [{ data: result }, { data: member }] = await Promise.all([
    supabase
      .from('results')
      .select('*')
      .eq('event_id', eventId!)
      .eq('member_id', memberId!)
      .maybeSingle(),
    supabase
      .from('members')
      .select('first_name, last_name')
      .eq('id', memberId!)
      .single(),
  ])

  return NextResponse.json({
    result,
    memberName: member ? `${member.first_name} ${member.last_name}` : '',
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: m } = await supabase.from('members').select('access_level').eq('id', user.id).single()
  if (!['admin', 'rundown'].includes(m?.access_level ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { data, error } = await supabase
    .from('results')
    .insert({ ...body, entered_by: user.id })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ id: data.id })
}
