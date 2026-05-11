import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import UploadDocumentButton from './UploadDocumentButton'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('members')
    .select('access_level')
    .eq('id', user!.id)
    .single()

  const isAdmin = member?.access_level === 'admin'

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        {isAdmin && <UploadDocumentButton />}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {(documents ?? []).map(doc => (
          <div key={doc.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">{doc.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {doc.file_type?.toUpperCase()}
                {isAdmin && ` · ${doc.access_level}`}
                {' · '}
                {new Date(doc.uploaded_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <a
              href={`/api/documents/${doc.id}/download`}
              className="text-xs text-green-700 hover:underline shrink-0 ml-4"
            >
              Download
            </a>
          </div>
        ))}
        {(documents ?? []).length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No documents available.</p>
        )}
      </div>
    </div>
  )
}
