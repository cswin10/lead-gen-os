import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import AddAgentForm from '@/components/settings/add-agent-form'
import AddClientForm from '@/components/settings/add-client-form'
import TeamList from '@/components/settings/team-list'

export default async function SettingsPage() {
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

  // Get team members
  const { data: agents } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('role', 'agent')
    .order('created_at', { ascending: false })

  const { data: clientUsers } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-8 dashboard-management">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-lg text-muted-foreground">
            Manage your team and clients
          </p>
        </div>

        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="agents">
              <Users className="h-4 w-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="clients">
              <Building2 className="h-4 w-4 mr-2" />
              Clients
            </TabsTrigger>
          </TabsList>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <Card className="border-0 shadow-premium">
              <CardHeader>
                <CardTitle className="text-2xl">Add New Agent</CardTitle>
                <CardDescription className="text-base">
                  Create a new agent account for your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddAgentForm organizationId={profile.organization_id} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-premium">
              <CardHeader>
                <CardTitle className="text-2xl">Team Members</CardTitle>
                <CardDescription className="text-base">
                  {agents?.length || 0} agent{agents?.length !== 1 ? 's' : ''} in your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamList members={agents || []} type="agent" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Card className="border-0 shadow-premium">
              <CardHeader>
                <CardTitle className="text-2xl">Add New Client</CardTitle>
                <CardDescription className="text-base">
                  Create a new client company and portal access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddClientForm organizationId={profile.organization_id} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-premium">
              <CardHeader>
                <CardTitle className="text-2xl">Client Companies</CardTitle>
                <CardDescription className="text-base">
                  {clients?.length || 0} client{clients?.length !== 1 ? 's' : ''} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clients && clients.length > 0 ? (
                    clients.map((client: any) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-slate-50 to-white"
                      >
                        <div>
                          <p className="font-semibold text-base">{client.company_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.industry} • £{client.cost_per_lead}/lead
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(client.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No clients yet. Add your first client above.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
