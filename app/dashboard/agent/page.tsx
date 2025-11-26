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
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 dashboard-agent">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Agent Dashboard</h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            Today's leads and call activity
          </p>
        </div>

        {/* Stats Cards with Premium Styling */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-4">
          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-sky-500/10 to-transparent rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground">
                Calls Today
              </CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight animate-countUp">{stats.callsToday}</div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                Keep it up!
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground">
                Call Time
              </CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight animate-countUp">{stats.totalCallTime}<span className="text-lg sm:text-xl">m</span></div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                Total time today
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover border-0 shadow-premium">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground">
                Active Leads
              </CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight animate-countUp">{stats.assignedLeads}</div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                In your queue
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden card-hover border-0 shadow-premium dashboard-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-semibold text-white/90">
                Qualified
              </CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white animate-countUp">{stats.qualifiedToday}</div>
              <p className="text-xs sm:text-sm text-white/80 mt-1 hidden sm:block">
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
