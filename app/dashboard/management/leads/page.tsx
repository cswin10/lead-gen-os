import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import LeadsManagementList from '@/components/management/leads-management-list'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

async function getLeads(orgId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('leads')
    .select(`
      *,
      campaigns(name),
      clients(company_name),
      profiles(full_name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100)
  
  return data || []
}

async function getCampaigns(orgId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('campaigns')
    .select('id, name, client_id, clients(company_name)')
    .eq('organization_id', orgId)
    .order('name')
  
  return data || []
}

async function getAgents(orgId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('organization_id', orgId)
    .eq('role', 'agent')
    .order('full_name')
  
  return data || []
}

export default async function LeadsManagementPage() {
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
  
  const leads = await getLeads(profile.organization_id)
  const campaigns = await getCampaigns(profile.organization_id)
  const agents = await getAgents(profile.organization_id)

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lead Management</h1>
            <p className="text-muted-foreground">
              View and manage all leads
            </p>
          </div>
          <Link href="/dashboard/management/leads/import">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </Link>
        </div>

        <LeadsManagementList 
          leads={leads}
          campaigns={campaigns}
          agents={agents}
          organizationId={profile.organization_id}
        />
      </div>
    </DashboardLayout>
  )
}
