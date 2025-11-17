import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Phone, Clock, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import AgentWorkspace from '@/components/agent/agent-workspace'

// Revalidate this page every 30 seconds for better performance
export const revalidate = 30

async function getAgentStats(agentId: string, orgId: string) {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Run all queries in parallel for better performance
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
      <div className="space-y-8 dashboard-agent">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Agent Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Today's leads and call activity
          </p>
        </div>

        {/* Stats Cards with Premium Styling */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Calls Today
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-sky-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight animate-countUp">{stats.callsToday}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Keep it up!
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Call Time
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-cyan-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight animate-countUp">{stats.totalCallTime} min</div>
              <p className="text-sm text-muted-foreground mt-1">
                Total time today
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Active Leads
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight animate-countUp">{stats.assignedLeads}</div>
              <p className="text-sm text-muted-foreground mt-1">
                In your queue
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover border-0 shadow-premium dashboard-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-white/90">
                Qualified Today
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-white animate-countUp">{stats.qualifiedToday}</div>
              <p className="text-sm text-white/80 mt-1">
                Great work!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Leads List and Call Panel */}
        <AgentWorkspace agentId={profile.id} organizationId={profile.organization_id} />
      </div>
    </DashboardLayout>
  )
}
