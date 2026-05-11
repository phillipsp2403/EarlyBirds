import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditMemberForm from './EditMemberForm'

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: caller } = await supabase
    .from('members')
    .select('access_level')
    .eq('id', user.id)
    .single()
  if (caller?.access_level !== 'admin') redirect('/dashboard')

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()

  if (!member) redirect('/admin/members')

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">
        Edit — {member.first_name} {member.last_name}
      </h1>
      <EditMemberForm member={member} />
    </div>
  )
}
