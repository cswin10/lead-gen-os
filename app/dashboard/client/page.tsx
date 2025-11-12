import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, TrendingUp, DollarSign, Target, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import ClientLeadsChart from '@/components/client/client-leads-chart'

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

  // For client users, we need to find their client record
  // In a real implementation, you'd have a proper client_user relationship
  // For now, we'll just use the first client in their org
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', profile.organization_id)
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{client.company_name}</h1>
            <p className="text-muted-foreground">
              Lead generation dashboard
            </p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Leads
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Leads This Week
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leadsThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                Delivered in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Leads
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLeads}</div>
              <p className="text-xs text-muted-foreground">
                In pipeline
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
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Lead to customer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estimated Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                £{stats.estimatedValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
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
