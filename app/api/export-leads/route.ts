import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  // Get the client ID from query params
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return NextResponse.json({ error: 'Client ID required' }, { status: 400 })
  }

  // Fetch all leads for this client
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Generate CSV
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Company',
    'Job Title',
    'Status',
    'Created At',
    'Last Contacted',
  ]

  const csvRows = [
    headers.join(','),
    ...leads.map((lead) =>
      [
        lead.first_name || '',
        lead.last_name || '',
        lead.email || '',
        lead.phone || '',
        lead.company || '',
        lead.job_title || '',
        lead.status || '',
        lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '',
        lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : '',
      ]
        .map((field) => `"${field}"`)
        .join(',')
    ),
  ]

  const csv = csvRows.join('\n')

  // Return CSV file
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
