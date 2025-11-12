import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import ClientList from '@/components/management/client-list'

async function getClients(orgId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  
  return data || []
}

export default async function ClientsPage() {
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
  
  const clients = await getClients(profile.organization_id)

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">
            Manage companies you're generating leads for
          </p>
        </div>

        <ClientList clients={clients} organizationId={profile.organization_id} />
      </div>
    </DashboardLayout>
  )
}
