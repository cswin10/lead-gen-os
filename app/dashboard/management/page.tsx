import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Phone, Users, TrendingUp, DollarSign, Target, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import CampaignPerformanceChart from '@/components/charts/campaign-performance-chart'
import TeamLeaderboard from '@/components/management/team-leaderboard'

// Revalidate this page every 30 seconds for better performance
export const revalidate = 30

async function getKPIs(orgId: string) {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthStart = new Date()
  monthStart.setDate(1)

  // Run all queries in parallel for better performance
  const [
    { count: callsToday },
    { count: leadsToday },
    { count: qualifiedLeads },
    { data: wonLeads },
    { count: totalLeads },
    { count: closedWon }
  ] = await Promise.all([
    // Get today's calls
    supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', `${today}T00:00:00`),

    // Get leads delivered today
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', `${today}T00:00:00`),

    // Get qualified leads this week
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'qualified')
      .gte('created_at', weekAgo.toISOString()),

    // Get total revenue this month (closed_won leads)
    supabase
      .from('leads')
      .select('*, clients(cost_per_lead)')
      .eq('organization_id', orgId)
      .eq('status', 'closed_won')
      .gte('created_at', monthStart.toISOString()),

    // Get total leads for conversion rate
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', monthStart.toISOString()),

    // Get closed won for conversion rate
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'closed_won')
      .gte('created_at', monthStart.toISOString())
  ])

  const revenue = wonLeads?.reduce((sum, lead: any) => {
    return sum + (lead.clients?.cost_per_lead || 0)
  }, 0) || 0

  const conversionRate = totalLeads && closedWon ? ((closedWon / totalLeads) * 100).toFixed(1) : '0'

  return {
    callsToday: callsToday || 0,
    leadsToday: leadsToday || 0,
    qualifiedLeads: qualifiedLeads || 0,
    revenue,
    conversionRate,
  }
}

async function getActiveCampaigns(orgId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('campaigns')
    .select(`
      *,
      clients(company_name),
      leads(count)
    `)
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .limit(5)

  return data || []
}

async function getCampaignPerformance(orgId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('campaign_performance')
    .select('*')
    .eq('organization_id', orgId)
    .limit(10)

  return data || []
}

export default async function ManagementDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(name)')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    redirect('/dashboard/agent')
  }

  // Run all data fetching in parallel for better performance
  const [kpis, activeCampaigns, campaignPerformance] = await Promise.all([
    getKPIs(profile.organization_id),
    getActiveCampaigns(profile.organization_id),
    getCampaignPerformance(profile.organization_id)
  ])

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Management Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your lead generation operations
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Calls Today
              </CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.callsToday}</div>
              <p className="text-xs text-muted-foreground">
                Active calling sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Leads Delivered
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.leadsToday}</div>
              <p className="text-xs text-muted-foreground">
                New leads today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Revenue Generated
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                £{kpis.revenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Closed won this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Qualified Leads
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.qualifiedLeads}</div>
              <p className="text-xs text-muted-foreground">
                Past 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>Currently running campaigns by client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active campaigns</p>
              ) : (
                activeCampaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.clients?.company_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{campaign.leads?.length || 0} leads</p>
                        <p className="text-xs text-muted-foreground">
                          Target: {campaign.target_leads}
                        </p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <TeamLeaderboard organizationId={profile.organization_id} />

        {/* Campaign Performance Chart */}
        <CampaignPerformanceChart data={campaignPerformance} />
      </div>
    </DashboardLayout>
  )
}
