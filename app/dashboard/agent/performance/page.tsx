import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, Phone, Target, Award, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardLayout from '@/components/layouts/dashboard-layout'

export const revalidate = 30

async function getPerformanceMetrics(agentId: string, organizationId: string) {
  const supabase = await createClient()

  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    { data: monthlyMetrics },
    { data: weeklyMetrics },
    { data: allLeads },
    { data: calls }
  ] = await Promise.all([
    // Last 30 days metrics
    supabase
      .from('daily_metrics')
      .select('*')
      .eq('agent_id', agentId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true }),

    // Last 7 days metrics
    supabase
      .from('daily_metrics')
      .select('*')
      .eq('agent_id', agentId)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true }),

    // Lead conversion stats
    supabase
      .from('leads')
      .select('status, created_at')
      .eq('assigned_agent_id', agentId),

    // Call stats
    supabase
      .from('calls')
      .select('outcome, duration_seconds')
      .eq('agent_id', agentId)
  ])

  // Calculate aggregated metrics
  const monthlyTotal = {
    calls: monthlyMetrics?.reduce((sum, m) => sum + (m.calls_made || 0), 0) || 0,
    connected: monthlyMetrics?.reduce((sum, m) => sum + (m.calls_connected || 0), 0) || 0,
    qualified: monthlyMetrics?.reduce((sum, m) => sum + (m.leads_qualified || 0), 0) || 0,
    appointments: monthlyMetrics?.reduce((sum, m) => sum + (m.appointments_set || 0), 0) || 0,
    deals: monthlyMetrics?.reduce((sum, m) => sum + (m.deals_closed || 0), 0) || 0,
  }

  const weeklyTotal = {
    calls: weeklyMetrics?.reduce((sum, m) => sum + (m.calls_made || 0), 0) || 0,
    connected: weeklyMetrics?.reduce((sum, m) => sum + (m.calls_connected || 0), 0) || 0,
    qualified: weeklyMetrics?.reduce((sum, m) => sum + (m.leads_qualified || 0), 0) || 0,
    appointments: weeklyMetrics?.reduce((sum, m) => sum + (m.appointments_set || 0), 0) || 0,
  }

  // Lead status breakdown
  const leadStats = {
    new: allLeads?.filter(l => l.status === 'new').length || 0,
    contacted: allLeads?.filter(l => l.status === 'contacted').length || 0,
    qualified: allLeads?.filter(l => l.status === 'qualified').length || 0,
    interested: allLeads?.filter(l => l.status === 'interested').length || 0,
    notInterested: allLeads?.filter(l => l.status === 'not_interested').length || 0,
    converted: allLeads?.filter(l => l.status === 'converted').length || 0,
  }

  // Calculate rates
  const connectionRate = monthlyTotal.calls ? Math.round((monthlyTotal.connected / monthlyTotal.calls) * 100) : 0
  const qualificationRate = monthlyTotal.connected ? Math.round((monthlyTotal.qualified / monthlyTotal.connected) * 100) : 0
  const conversionRate = leadStats.qualified ? Math.round((leadStats.converted / leadStats.qualified) * 100) : 0

  return {
    monthly: monthlyTotal,
    weekly: weeklyTotal,
    leads: leadStats,
    rates: {
      connection: connectionRate,
      qualification: qualificationRate,
      conversion: conversionRate,
    },
    dailyBreakdown: monthlyMetrics || []
  }
}

export default async function PerformancePage() {
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

  if (!profile || profile.role !== 'agent') {
    redirect('/dashboard')
  }

  const metrics = await getPerformanceMetrics(profile.id, profile.organization_id)

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-lg text-muted-foreground">
            Track your progress and key metrics
          </p>
        </div>

        {/* Key Metrics - Last 30 Days */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Last 30 Days</h2>
          <div className="grid gap-6 md:grid-cols-5">
            <Card className="border-0 shadow-premium">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.monthly.calls}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.weekly.calls} this week
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-premium">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Connected</CardTitle>
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.monthly.connected}</div>
                <p className="text-xs text-green-600 mt-1">
                  {metrics.rates.connection}% connection rate
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-premium">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Qualified</CardTitle>
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.monthly.qualified}</div>
                <p className="text-xs text-blue-600 mt-1">
                  {metrics.rates.qualification}% of connected
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-premium">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.monthly.appointments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.weekly.appointments} this week
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-premium dashboard-primary">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-white/90">Deals Closed</CardTitle>
                  <Award className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{metrics.monthly.deals}</div>
                <p className="text-xs text-white/80 mt-1">
                  {metrics.rates.conversion}% conversion
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lead Status Breakdown */}
        <Card className="border-0 shadow-premium">
          <CardHeader>
            <CardTitle>Lead Pipeline</CardTitle>
            <CardDescription>Status breakdown of all your leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div>
                  <div className="text-sm font-medium text-blue-900">New Leads</div>
                  <div className="text-2xl font-bold text-blue-900">{metrics.leads.new}</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div>
                  <div className="text-sm font-medium text-yellow-900">Contacted</div>
                  <div className="text-2xl font-bold text-yellow-900">{metrics.leads.contacted}</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-yellow-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div>
                  <div className="text-sm font-medium text-purple-900">Qualified</div>
                  <div className="text-2xl font-bold text-purple-900">{metrics.leads.qualified}</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                <div>
                  <div className="text-sm font-medium text-green-900">Interested</div>
                  <div className="text-2xl font-bold text-green-900">{metrics.leads.interested}</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div>
                  <div className="text-sm font-medium text-emerald-900">Converted</div>
                  <div className="text-2xl font-bold text-emerald-900">{metrics.leads.converted}</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Award className="h-6 w-6 text-emerald-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div>
                  <div className="text-sm font-medium text-gray-900">Not Interested</div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.leads.notInterested}</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-gray-500/20 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="border-0 shadow-premium">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>How you're doing compared to key metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Connection Rate</span>
                <span className="text-sm font-bold">{metrics.rates.connection}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${metrics.rates.connection}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Target: 30%+</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Qualification Rate</span>
                <span className="text-sm font-bold">{metrics.rates.qualification}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${metrics.rates.qualification}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Target: 20%+</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Conversion Rate</span>
                <span className="text-sm font-bold">{metrics.rates.conversion}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(metrics.rates.conversion, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Target: 10%+</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
