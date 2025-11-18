import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Phone, Clock, CheckCircle2, XCircle, PhoneOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import { formatDistanceToNow } from 'date-fns'

export const revalidate = 30

async function getCallHistory(agentId: string) {
  const supabase = await createClient()

  const { data: calls } = await supabase
    .from('calls')
    .select(`
      *,
      leads(first_name, last_name, company, phone)
    `)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(100)

  return calls || []
}

async function getCallStats(agentId: string) {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalCalls },
    { count: callsToday },
    { count: callsThisWeek },
    { data: allCalls }
  ] = await Promise.all([
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('agent_id', agentId),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('agent_id', agentId).gte('created_at', `${today}T00:00:00`),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('agent_id', agentId).gte('created_at', weekAgo),
    supabase.from('calls').select('duration_seconds, outcome').eq('agent_id', agentId)
  ])

  const totalDuration = allCalls?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) || 0
  const avgDuration = totalCalls ? Math.round(totalDuration / totalCalls) : 0
  const successfulCalls = allCalls?.filter(c => c.outcome === 'connected' || c.outcome === 'qualified').length || 0
  const successRate = totalCalls ? Math.round((successfulCalls / totalCalls) * 100) : 0

  return {
    totalCalls: totalCalls || 0,
    callsToday: callsToday || 0,
    callsThisWeek: callsThisWeek || 0,
    avgDuration,
    successRate
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case 'failed':
    case 'no-answer':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'busy':
      return <PhoneOff className="h-4 w-4 text-orange-600" />
    default:
      return <Phone className="h-4 w-4 text-gray-600" />
  }
}

function getOutcomeBadge(outcome: string | null) {
  if (!outcome) return null

  const colors: Record<string, string> = {
    connected: 'bg-green-100 text-green-800',
    qualified: 'bg-blue-100 text-blue-800',
    'not-interested': 'bg-gray-100 text-gray-800',
    'no-answer': 'bg-orange-100 text-orange-800',
    voicemail: 'bg-yellow-100 text-yellow-800'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[outcome] || 'bg-gray-100 text-gray-800'}`}>
      {outcome.replace('-', ' ')}
    </span>
  )
}

export default async function CallsPage() {
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

  const [calls, stats] = await Promise.all([
    getCallHistory(profile.id),
    getCallStats(profile.id)
  ])

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Call History</h1>
          <p className="text-lg text-muted-foreground">
            View all your call activity and performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-5">
          <Card className="border-0 shadow-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCalls}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.callsToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Calls made</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.callsThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">Calls made</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.floor(stats.avgDuration / 60)}:{(stats.avgDuration % 60).toString().padStart(2, '0')}</div>
              <p className="text-xs text-muted-foreground mt-1">Minutes</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-premium dashboard-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.successRate}%</div>
              <p className="text-xs text-white/80 mt-1">Connected calls</p>
            </CardContent>
          </Card>
        </div>

        {/* Call History Table */}
        <Card className="border-0 shadow-premium">
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>Your most recent call activity</CardDescription>
          </CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No calls yet</h3>
                <p className="text-muted-foreground">Start making calls to see your history here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calls.map((call: any) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-slate-50 to-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getStatusIcon(call.status)}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {call.leads?.first_name} {call.leads?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {call.leads?.company || call.phone_number}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${(call.duration_seconds % 60).toString().padStart(2, '0')}` : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="w-24">
                        {getOutcomeBadge(call.outcome)}
                      </div>
                    </div>
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
