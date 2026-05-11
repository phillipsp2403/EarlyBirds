import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: m } = await supabase.from('members').select('access_level').eq('id', user.id).single()
  if (m?.access_level !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, body, recipient_type, send_now } = await request.json()

  const sent_at = send_now ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('announcements')
    .insert({ title, body, recipient_type, sent_at, created_by: user.id })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // If sending, trigger email delivery via Resend
  // TODO: integrate Resend when API key is configured
  // For now, the announcement is marked sent_at and visible in the portal

  return NextResponse.json({ id: data.id })
}
