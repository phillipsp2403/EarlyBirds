import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { identifier, pin } = await request.json()

  if (!identifier || !pin) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 })
  }

  // Look up member by member_number or login_name using service role (bypasses RLS)
  const service = await createServiceClient()

  const isNumber = /^\d+$/.test(identifier)
  const { data: member, error: lookupError } = await service
    .from('members')
    .select('id, email, suspended')
    .eq(isNumber ? 'member_number' : 'login_name', identifier)
    .single()

  if (lookupError || !member) {
    return NextResponse.json({ error: 'Invalid member number or login name' }, { status: 401 })
  }

  if (member.suspended) {
    return NextResponse.json({ error: 'This account has been suspended' }, { status: 403 })
  }

  // Authenticate via Supabase Auth using email + PIN as password
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: member.email,
    password: pin,
  })

  if (authError) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
