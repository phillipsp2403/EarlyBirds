import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../web/.env.local')

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const SUPABASE_URL  = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY   = env.SUPABASE_SERVICE_ROLE_KEY

const MEMBER_NUMBER = 9798
const FIRST_NAME    = 'Paul'
const LAST_NAME     = 'Phillips'
const EMAIL         = 'paul@thephillips.com.au'
const PIN           = '1415'
const ACCESS_LEVEL  = 'admin'

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'apikey': SERVICE_KEY,
}

// 1. Create auth user
console.log('Creating auth user…')
const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    email: EMAIL,
    password: PIN,
    email_confirm: true,
    app_metadata: { access_level: ACCESS_LEVEL },
  }),
})

const authData = await authRes.json()
if (!authRes.ok) {
  console.error('Auth error:', authData)
  process.exit(1)
}

const userId = authData.id
console.log('Auth user created:', userId)

// 2. Insert member row
console.log('Inserting member row…')
const memberRes = await fetch(`${SUPABASE_URL}/rest/v1/members`, {
  method: 'POST',
  headers: { ...headers, 'Prefer': 'return=minimal' },
  body: JSON.stringify({
    id: userId,
    member_number: MEMBER_NUMBER,
    login_name: 'paul',
    first_name: FIRST_NAME,
    last_name: LAST_NAME,
    email: EMAIL,
    access_level: ACCESS_LEVEL,
  }),
})

if (!memberRes.ok) {
  const err = await memberRes.text()
  console.error('Member insert error:', err)
  // Roll back auth user
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers })
  console.log('Rolled back auth user.')
  process.exit(1)
}

console.log('Done! Log in with member number 9798 and PIN 1415.')
