import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/admin/members — create a new member with initial PIN
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase
    .from('members')
    .select('access_level')
    .eq('id', user.id)
    .single()

  if (caller?.access_level !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    member_number,
    login_name,
    first_name,
    last_name,
    email,
    phone,
    mobile,
    access_level,
    initial_pin,
  } = body

  if (!/^\d{4}$/.test(initial_pin)) {
    return NextResponse.json({ error: 'Initial PIN must be 4 digits' }, { status: 400 })
  }

  const service = await createServiceClient()

  // Create the auth user with email + PIN as password
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password: initial_pin,
    email_confirm: true,
    app_metadata: { access_level },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 400 })
  }

  // Insert member profile
  const { error: memberError } = await service
    .from('members')
    .insert({
      id: authData.user.id,
      member_number,
      login_name,
      first_name,
      last_name,
      email,
      phone: phone || null,
      mobile: mobile || null,
      access_level,
    })

  if (memberError) {
    // Clean up orphaned auth user
    await service.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: memberError.message }, { status: 400 })
  }

  return NextResponse.json({ id: authData.user.id })
}
