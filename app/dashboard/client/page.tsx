import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, TrendingUp, DollarSign, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import ClientLeadsChart from '@/components/client/client-leads-chart'
import ExportLeadsButton from '@/components/client/export-leads-button'

// Revalidate this page every 30 seconds for better performance
export const revalidate = 30

async function getClientStats(clientId: string, costPerLead: number) {
  const supabase = await createClient()

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  // Run all queries in parallel for better performance
  const [
    { count: leadsThisWeek },
    { count: activeLeads },
    { count: totalLeads },
    { count: closedWon }
  ] = await Promise.all([
    // Leads delivered this week
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .gte('created_at', weekAgo.toISOString()),

    // Total active leads
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .in('status', ['new', 'contacted', 'qualified', 'interested']),

    // Total leads for conversion rate
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId),

    // Closed won leads
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'closed_won')
  ])

  const conversionRate = totalLeads && closedWon ? ((closedWon / totalLeads) * 100).toFixed(1) : '0'
  const estimatedValue = (closedWon || 0) * costPerLead

  return {
    leadsThisWeek: leadsThisWeek || 0,
    activeLeads: activeLeads || 0,
    conversionRate,
    estimatedValue,
  }
}

async function getClientCampaigns(clientId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('campaigns')
    .select(`
      *,
      leads(count)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  
  return data || []
}

async function getRecentLeads(clientId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10)

  return data || []
}

async function getChartData(clientId: string) {
  const supabase = await createClient()

  // Get last 30 days of leads with aggregation done in SQL
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: leads } = await supabase
    .from('leads')
    .select('created_at, status')
    .eq('client_id', clientId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (!leads || leads.length === 0) {
    return []
  }

  // Group by date on server
  const groupedData: Record<string, { leads: number, qualified: number, won: number }> = {}

  leads.forEach((lead) => {
    const date = new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!groupedData[date]) {
      groupedData[date] = { leads: 0, qualified: 0, won: 0 }
    }
    groupedData[date].leads++
    if (lead.status === 'qualified') groupedData[date].qualified++
    if (lead.status === 'closed_won') groupedData[date].won++
  })

  // Convert to array
  return Object.entries(groupedData).map(([date, counts]) => ({
    date,
    ...counts
  }))
}

export default async function ClientDashboard() {
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
  
  if (!profile) {
    redirect('/')
  }

  // Get the client record for this user (linked via profile.client_id)
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', profile.client_id)
    .single()

  if (!client) {
    return (
      <DashboardLayout user={profile}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">No Client Profile Found</h2>
          <p className="text-muted-foreground">Please contact your account manager.</p>
        </div>
      </DashboardLayout>
    )
  }

  // Run all data fetching in parallel for better performance
  const [stats, campaigns, recentLeads, chartData] = await Promise.all([
    getClientStats(client.id, client.cost_per_lead || 0),
    getClientCampaigns(client.id),
    getRecentLeads(client.id),
    getChartData(client.id)
  ])

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-8 dashboard-client">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">{client.company_name}</h1>
            <p className="text-lg text-muted-foreground">
              Lead generation dashboard
            </p>
          </div>
          <ExportLeadsButton clientId={client.id} />
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Leads This Week
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight animate-countUp">{stats.leadsThisWeek}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Delivered in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Active Leads
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight animate-countUp">{stats.activeLeads}</div>
              <p className="text-sm text-muted-foreground mt-1">
                In pipeline
              </p>
            </CardContent>
          </Card>

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
              <div className="text-3xl font-bold tracking-tight animate-countUp">{stats.conversionRate}%</div>
              <p className="text-sm text-muted-foreground mt-1">
                Lead to customer
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover border-0 shadow-premium dashboard-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-white/90">
                Estimated Value
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-white animate-countUp">
                £{stats.estimatedValue.toLocaleString()}
              </div>
              <p className="text-sm text-white/80 mt-1">
                From closed leads
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>Your current lead generation campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaigns yet</p>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">{campaign.leads?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">leads</p>
                      </div>
                      <Badge 
                        variant={campaign.status === 'active' ? 'success' : 'secondary'}
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads Chart */}
        <ClientLeadsChart data={chartData} />

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Latest leads delivered to you</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet</p>
            ) : (
              <div className="space-y-2">
                {recentLeads.map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {lead.company} {lead.job_title && `• ${lead.job_title}`}
                      </p>
                    </div>
                    <Badge variant="outline">{lead.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
