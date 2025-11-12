import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Phone, Clock, Target } from 'lucide-react'

export default async function TeamLeaderboard({ organizationId }: { organizationId: string }) {
  const supabase = await createClient()
  
  // Get agent performance
  const { data: agents } = await supabase
    .from('agent_performance')
    .select('*')
    .eq('organization_id', organizationId)
    .order('won_leads', { ascending: false })
    .limit(10)
  
  if (!agents || agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Leaderboard</CardTitle>
          <CardDescription>Top performing agents</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No agent data available yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Leaderboard</CardTitle>
        <CardDescription>Top performing agents this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.map((agent, index) => (
            <div key={agent.agent_id} className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                {index === 1 && <Trophy className="h-5 w-5 text-gray-400" />}
                {index === 2 && <Trophy className="h-5 w-5 text-orange-600" />}
                {index > 2 && <span className="text-sm font-medium">{index + 1}</span>}
              </div>
              
              <div className="flex-1">
                <p className="font-medium">{agent.agent_name}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {agent.total_calls} calls
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.round((agent.total_call_time_seconds || 0) / 60)} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {agent.qualified_leads} qualified
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-lg font-bold">{agent.won_leads}</p>
                <p className="text-xs text-muted-foreground">Closed</p>
              </div>
              
              <Badge variant={agent.conversion_rate >= 20 ? 'success' : 'secondary'}>
                {agent.conversion_rate || 0}%
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
