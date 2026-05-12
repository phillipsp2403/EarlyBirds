import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: m } = await supabase.from('members').select('access_level').eq('id', user.id).single()
  return m?.access_level === 'admin' ? supabase : null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const {
    first_name, last_name, email, phone, alt_phone,
    access_level, status, is_active, committee, does_not_book, joined,
  } = body

  const service = await createServiceClient()

  const { error } = await service
    .from('members')
    .update({
      first_name,
      last_name,
      email,
      login_name: email,
      phone: phone || null,
      alt_phone: alt_phone || null,
      access_level,
      status,
      is_active,
      committee,
      does_not_book,
      joined,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (email) {
    await service.auth.admin.updateUserById(id, { email })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const service = await createServiceClient()
  await service.auth.admin.deleteUser(id)

  return NextResponse.json({ ok: true })
}
