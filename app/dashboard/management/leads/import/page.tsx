import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import LeadImport from '@/components/management/lead-import'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

async function getImportData(orgId: string) {
  const supabase = await createClient()

  const [
    { data: campaigns },
    { data: clients },
    { data: agents }
  ] = await Promise.all([
    supabase
      .from('campaigns')
      .select('id, name')
      .eq('organization_id', orgId)
      .order('name'),

    supabase
      .from('clients')
      .select('id, company_name')
      .eq('organization_id', orgId)
      .order('company_name'),

    supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('organization_id', orgId)
      .eq('role', 'agent')
      .eq('is_active', true)
      .order('first_name')
  ])

  return {
    campaigns: campaigns || [],
    clients: clients || [],
    agents: agents || []
  }
}

export default async function ImportLeadsPage({
  searchParams
}: {
  searchParams: { campaign?: string }
}) {
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

  const { campaigns, clients, agents } = await getImportData(profile.organization_id)

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href={searchParams.campaign ? `/dashboard/management/campaigns/${searchParams.campaign}` : "/dashboard/management/leads"}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {searchParams.campaign ? 'Back to Campaign' : 'Back to Leads'}
                </Button>
              </Link>
            </div>
            <h1 className="text-4xl font-bold">Import Leads</h1>
            <p className="text-muted-foreground text-lg mt-1">
              Upload a CSV file to bulk import leads into your campaigns
            </p>
          </div>
        </div>

        {/* Import Component */}
        <LeadImport
          organizationId={profile.organization_id}
          campaigns={campaigns}
          clients={clients}
          agents={agents}
          defaultCampaignId={searchParams.campaign}
        />
      </div>
    </DashboardLayout>
  )
}
