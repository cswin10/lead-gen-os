import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Fetch the report
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'csv'

  if (format === 'json') {
    return NextResponse.json(report.data, {
      headers: {
        'Content-Disposition': `attachment; filename="${sanitizeFilename(report.name)}.json"`,
      }
    })
  }

  // Generate CSV
  const csv = generateCSV(report.data, report.name)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${sanitizeFilename(report.name)}.csv"`,
    }
  })
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '_')
}

function generateCSV(data: any, reportName: string): string {
  const lines: string[] = []

  // Report Header
  lines.push(`"${reportName}"`)
  lines.push(`"Generated: ${new Date().toLocaleString('en-GB')}"`)
  lines.push('')

  // Summary Section
  lines.push('"SUMMARY"')
  lines.push('"Metric","Value"')
  lines.push(`"Total Calls","${data.summary?.totalCalls || 0}"`)
  lines.push(`"Total Leads","${data.summary?.totalLeads || 0}"`)
  lines.push(`"Qualified Leads","${data.summary?.qualifiedLeads || 0}"`)
  lines.push(`"Closed Won","${data.summary?.closedWon || 0}"`)
  lines.push(`"Revenue","£${(data.summary?.revenue || 0).toLocaleString()}"`)
  lines.push(`"Conversion Rate","${data.summary?.conversionRate || 0}%"`)
  lines.push('')

  // Campaigns Section
  if (data.campaigns && data.campaigns.length > 0) {
    lines.push('"CAMPAIGN PERFORMANCE"')
    lines.push('"Campaign","Client","Leads Generated","Qualified Leads","Status"')
    data.campaigns.forEach((campaign: any) => {
      lines.push(`"${escapeCSV(campaign.name)}","${escapeCSV(campaign.client)}","${campaign.leadsGenerated}","${campaign.qualifiedLeads}","${campaign.status}"`)
    })
    lines.push('')
  }

  // Agents Section
  if (data.agents && data.agents.length > 0) {
    lines.push('"AGENT PERFORMANCE"')
    lines.push('"Agent","Calls Made","Leads Converted","Avg Call Duration (sec)"')
    data.agents.forEach((agent: any) => {
      lines.push(`"${escapeCSV(agent.name)}","${agent.calls}","${agent.leadsConverted}","${agent.avgCallDuration}"`)
    })
    lines.push('')
  }

  // Daily Breakdown Section
  if (data.dailyBreakdown && data.dailyBreakdown.length > 0) {
    lines.push('"DAILY BREAKDOWN"')
    lines.push('"Date","Calls","Leads","Qualified"')
    data.dailyBreakdown.forEach((day: any) => {
      const formattedDate = new Date(day.date).toLocaleDateString('en-GB')
      lines.push(`"${formattedDate}","${day.calls}","${day.leads}","${day.qualified}"`)
    })
  }

  return lines.join('\n')
}

function escapeCSV(str: string): string {
  if (!str) return ''
  return str.replace(/"/g, '""')
}
