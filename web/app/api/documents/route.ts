import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: m } = await supabase.from('members').select('access_level').eq('id', user.id).single()
  if (m?.access_level !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const access_level = (formData.get('access_level') as string) || 'all'

  if (!file || !title) {
    return NextResponse.json({ error: 'Missing file or title' }, { status: 400 })
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() ?? ''
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(uploadData.path)

  // For private buckets, use a signed URL approach — store the path and generate signed URLs on demand
  const { data, error } = await supabase
    .from('documents')
    .insert({
      title,
      file_url: uploadData.path, // store path, generate signed URL on download
      file_type: fileExt.toUpperCase(),
      access_level: access_level as 'all' | 'rundown' | 'admin',
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ id: data.id })
}
