import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase
    .from('members')
    .select('access_level')
    .eq('id', user.id)
    .single()
  if (caller?.access_level !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { pin } = await request.json()

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 })
  }

  const service = await createServiceClient()
  const { error } = await service.auth.admin.updateUserById(id, { password: pin })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
