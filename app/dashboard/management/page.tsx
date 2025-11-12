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
      <div className="space-y-8">
        {/* Header with gradient */}
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Management Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Overview of your lead generation operations
          </p>
        </div>

        {/* KPI Cards with Premium Styling */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Calls Today - Blue gradient */}
          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Calls Today
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight animate-countUp">{kpis.callsToday}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Active calling sessions
              </p>
            </CardContent>
          </Card>

          {/* Leads Delivered - Purple gradient */}
          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Leads Delivered
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight animate-countUp">{kpis.leadsToday}</div>
              <p className="text-sm text-muted-foreground mt-1">
                New leads today
              </p>
            </CardContent>
          </Card>

          {/* Conversion Rate - Emerald gradient */}
          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Conversion Rate
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight animate-countUp">{kpis.conversionRate}%</div>
              <p className="text-sm text-muted-foreground mt-1">
                This month
              </p>
            </CardContent>
          </Card>

          {/* Revenue - Gradient accent */}
          <Card className="relative overflow-hidden card-hover border-0 shadow-premium bg-gradient-to-br from-primary to-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-white/90">
                Revenue Generated
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-white animate-countUp">
                £{kpis.revenue.toLocaleString()}
              </div>
              <p className="text-sm text-white/80 mt-1">
                Closed won this month
              </p>
            </CardContent>
          </Card>

          {/* Qualified Leads - Amber gradient */}
          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Qualified Leads
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight animate-countUp">{kpis.qualifiedLeads}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Past 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Campaigns */}
        <Card className="border-0 shadow-premium">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Active Campaigns</CardTitle>
            <CardDescription className="text-base">Currently running campaigns by client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active campaigns</p>
              ) : (
                activeCampaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-200">
                    <div>
                      <p className="font-semibold text-base">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {campaign.clients?.company_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">{campaign.leads?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">
                          of {campaign.target_leads} leads
                        </p>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">Active</Badge>
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
