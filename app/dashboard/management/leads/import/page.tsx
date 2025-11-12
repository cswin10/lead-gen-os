import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import CSVImportForm from '@/components/management/csv-import-form'

async function getCampaigns(orgId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('campaigns')
    .select('id, name, client_id, clients(id, company_name)')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .order('name')
  
  return data || []
}

export default async function ImportLeadsPage() {
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

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Import Leads</h1>
          <p className="text-muted-foreground">
            Upload a CSV file to import leads in bulk
          </p>
        </div>

        <CSVImportForm campaigns={campaigns} organizationId={profile.organization_id} />
      </div>
    </DashboardLayout>
  )
}
