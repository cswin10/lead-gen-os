import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface ReportData {
  summary: {
    totalCalls: number
    totalLeads: number
    qualifiedLeads: number
    closedWon: number
    revenue: number
    conversionRate: number
  }
  campaigns: Array<{
    id: string
    name: string
    client: string
    leadsGenerated: number
    qualifiedLeads: number
    status: string
  }>
  agents: Array<{
    id: string
    name: string
    calls: number
    leadsConverted: number
    avgCallDuration: number
  }>
  dailyBreakdown: Array<{
    date: string
    calls: number
    leads: number
    qualified: number
  }>
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 })
  }

  const body = await request.json()
  const { reportType, periodStart, periodEnd } = body

  if (!reportType || !periodStart || !periodEnd) {
    return NextResponse.json({ error: 'Missing required fields: reportType, periodStart, periodEnd' }, { status: 400 })
  }

  const orgId = profile.organization_id

  // Generate report data
  const reportData = await generateReportData(supabase, orgId, periodStart, periodEnd)

  // Create report name
  const startDate = new Date(periodStart)
  const endDate = new Date(periodEnd)
  const reportName = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

  // Save report to database
  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      organization_id: orgId,
      created_by: user.id,
      name: reportName,
      report_type: reportType,
      period_start: periodStart,
      period_end: periodEnd,
      data: reportData
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ report })
}

async function generateReportData(supabase: any, orgId: string, periodStart: string, periodEnd: string): Promise<ReportData> {
  const startDate = `${periodStart}T00:00:00`
  const endDate = `${periodEnd}T23:59:59`

  // Run all queries in parallel
  const [
    callsResult,
    leadsResult,
    qualifiedResult,
    closedWonResult,
    campaignsResult,
    agentsResult
  ] = await Promise.all([
    // Total calls in period
    supabase
      .from('calls')
      .select('*, profiles!agent_id(full_name)')
      .eq('organization_id', orgId)
      .gte('created_at', startDate)
      .lte('created_at', endDate),

    // Total leads in period
    supabase
      .from('leads')
      .select('*')
      .eq('organization_id', orgId)
      .gte('created_at', startDate)
      .lte('created_at', endDate),

    // Qualified leads in period
    supabase
      .from('leads')
      .select('*, clients(cost_per_lead)')
      .eq('organization_id', orgId)
      .eq('status', 'qualified')
      .gte('updated_at', startDate)
      .lte('updated_at', endDate),

    // Closed won in period
    supabase
      .from('leads')
      .select('*, clients(cost_per_lead)')
      .eq('organization_id', orgId)
      .eq('status', 'closed_won')
      .gte('updated_at', startDate)
      .lte('updated_at', endDate),

    // Campaign performance
    supabase
      .from('campaigns')
      .select(`
        id, name, status,
        clients(company_name),
        leads(id, status, created_at)
      `)
      .eq('organization_id', orgId),

    // Agent performance
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('organization_id', orgId)
      .eq('role', 'agent')
  ])

  const calls = callsResult.data || []
  const leads = leadsResult.data || []
  const qualifiedLeads = qualifiedResult.data || []
  const closedWon = closedWonResult.data || []
  const campaigns = campaignsResult.data || []
  const agents = agentsResult.data || []

  // Calculate revenue from closed won leads
  const revenue = closedWon.reduce((sum: number, lead: any) => {
    return sum + (lead.clients?.cost_per_lead || 0)
  }, 0)

  // Calculate conversion rate
  const conversionRate = leads.length > 0
    ? ((closedWon.length / leads.length) * 100)
    : 0

  // Process campaigns
  const campaignData = campaigns.map((campaign: any) => {
    const campaignLeads = (campaign.leads || []).filter((lead: any) => {
      const createdAt = new Date(lead.created_at)
      return createdAt >= new Date(startDate) && createdAt <= new Date(endDate)
    })

    return {
      id: campaign.id,
      name: campaign.name,
      client: campaign.clients?.company_name || 'Unknown',
      leadsGenerated: campaignLeads.length,
      qualifiedLeads: campaignLeads.filter((l: any) => l.status === 'qualified' || l.status === 'closed_won').length,
      status: campaign.status
    }
  }).filter((c: any) => c.leadsGenerated > 0)

  // Process agent performance
  const agentData = await Promise.all(agents.map(async (agent: any) => {
    const agentCalls = calls.filter((c: any) => c.agent_id === agent.id)
    const agentLeads = leads.filter((l: any) => l.assigned_agent_id === agent.id)
    const convertedLeads = agentLeads.filter((l: any) =>
      l.status === 'qualified' || l.status === 'closed_won'
    )

    const totalDuration = agentCalls.reduce((sum: number, call: any) => {
      return sum + (call.duration_seconds || 0)
    }, 0)

    return {
      id: agent.id,
      name: agent.full_name || 'Unknown Agent',
      calls: agentCalls.length,
      leadsConverted: convertedLeads.length,
      avgCallDuration: agentCalls.length > 0
        ? Math.round(totalDuration / agentCalls.length)
        : 0
    }
  }))

  // Generate daily breakdown
  const dailyBreakdown = generateDailyBreakdown(leads, calls, periodStart, periodEnd)

  return {
    summary: {
      totalCalls: calls.length,
      totalLeads: leads.length,
      qualifiedLeads: qualifiedLeads.length,
      closedWon: closedWon.length,
      revenue,
      conversionRate: Math.round(conversionRate * 10) / 10
    },
    campaigns: campaignData,
    agents: agentData.filter(a => a.calls > 0 || a.leadsConverted > 0),
    dailyBreakdown
  }
}

function generateDailyBreakdown(leads: any[], calls: any[], periodStart: string, periodEnd: string) {
  const breakdown: Array<{ date: string; calls: number; leads: number; qualified: number }> = []

  const start = new Date(periodStart)
  const end = new Date(periodEnd)

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0]

    const dayCalls = calls.filter(c =>
      c.created_at?.startsWith(dateStr)
    ).length

    const dayLeads = leads.filter(l =>
      l.created_at?.startsWith(dateStr)
    ).length

    const dayQualified = leads.filter(l =>
      l.updated_at?.startsWith(dateStr) &&
      (l.status === 'qualified' || l.status === 'closed_won')
    ).length

    breakdown.push({
      date: dateStr,
      calls: dayCalls,
      leads: dayLeads,
      qualified: dayQualified
    })
  }

  return breakdown
}
