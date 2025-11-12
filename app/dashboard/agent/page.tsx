import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Phone, Clock, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import LeadsList from '@/components/agent/leads-list'
import CallPanel from '@/components/agent/call-panel'

async function getAgentStats(agentId: string, orgId: string) {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Run all queries in parallel for faster loading
  const [
    { count: callsToday },
    { data: callsData },
    { count: assignedLeads },
    { count: qualifiedToday }
  ] = await Promise.all([
    // Calls made today
    supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .gte('created_at', `${today}T00:00:00`),

    // Total call time today
    supabase
      .from('calls')
      .select('duration_seconds')
      .eq('agent_id', agentId)
      .gte('created_at', `${today}T00:00:00`),

    // Assigned leads
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_agent_id', agentId)
      .in('status', ['new', 'contacted', 'qualified', 'interested']),

    // Qualified today
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_agent_id', agentId)
      .eq('status', 'qualified')
      .gte('updated_at', `${today}T00:00:00`)
  ])

  const totalCallTime = callsData?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) || 0

  return {
    callsToday: callsToday || 0,
    totalCallTime: Math.round(totalCallTime / 60), // Convert to minutes
    assignedLeads: assignedLeads || 0,
    qualifiedToday: qualifiedToday || 0,
  }
}

export default async function AgentDashboard() {
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
    if (['owner', 'manager'].includes(profile?.role)) {
      redirect('/dashboard/management')
    }
    redirect('/')
  }
  
  const stats = await getAgentStats(profile.id, profile.organization_id)

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">
            Today's leads and call activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Calls Today
              </CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.callsToday}</div>
              <p className="text-xs text-muted-foreground">
                Keep it up!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Call Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCallTime} min</div>
              <p className="text-xs text-muted-foreground">
                Total time today
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
              <div className="text-2xl font-bold">{stats.assignedLeads}</div>
              <p className="text-xs text-muted-foreground">
                In your queue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Qualified Today
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qualifiedToday}</div>
              <p className="text-xs text-muted-foreground">
                Great work!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Leads List and Call Panel */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LeadsList agentId={profile.id} />
          </div>
          
          <div>
            <CallPanel agentId={profile.id} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
