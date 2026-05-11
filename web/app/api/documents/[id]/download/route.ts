import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: doc } = await supabase
    .from('documents')
    .select('file_url, title')
    .eq('id', id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_url, 300) // 5-minute expiry

  if (error || !data) return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })

  return NextResponse.redirect(data.signedUrl)
}
