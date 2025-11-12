import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import CampaignList from '@/components/management/campaign-list'

async function getCampaigns(orgId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('campaigns')
    .select(`
      *,
      clients(id, company_name),
      leads(count)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  
  return data || []
}

async function getClients(orgId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('company_name')
  
  return data || []
}

export default async function CampaignsPage() {
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
  
  const campaigns = await getCampaigns(profile.organization_id)
  const clients = await getClients(profile.organization_id)

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Campaign Management</h1>
          <p className="text-muted-foreground">
            Create and manage lead generation campaigns
          </p>
        </div>

        <CampaignList 
          campaigns={campaigns} 
          clients={clients}
          organizationId={profile.organization_id}
          userId={profile.id}
        />
      </div>
    </DashboardLayout>
  )
}
