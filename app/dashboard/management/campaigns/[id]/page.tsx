import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import CampaignLeadManagement from '@/components/management/campaign-lead-management'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getCampaignDetails(campaignId: string, orgId: string) {
  const supabase = await createClient()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select(`
      *,
      clients(id, company_name)
    `)
    .eq('id', campaignId)
    .eq('organization_id', orgId)
    .single()

  return campaign
}

async function getCampaignLeads(campaignId: string, orgId: string) {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      profiles:assigned_agent_id(id, full_name, email),
      calls(id, outcome, created_at),
      activities(id, type, content, created_at, metadata)
    `)
    .eq('campaign_id', campaignId)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return leads || []
}

async function getAgents(orgId: string) {
  const supabase = await createClient()

  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name, email, first_name, last_name')
    .eq('organization_id', orgId)
    .eq('role', 'agent')
    .order('full_name')

  return agents || []
}

async function getAgentLeadCounts(campaignId: string, orgId: string) {
  const supabase = await createClient()

  // Get leads grouped by agent
  const { data: leads } = await supabase
    .from('leads')
    .select('assigned_agent_id')
    .eq('campaign_id', campaignId)
    .eq('organization_id', orgId)

  if (!leads) return {}

  // Count leads per agent
  const counts: Record<string, number> = {}
  leads.forEach(lead => {
    if (lead.assigned_agent_id) {
      counts[lead.assigned_agent_id] = (counts[lead.assigned_agent_id] || 0) + 1
    }
  })

  return counts
}

export default async function CampaignDetailPage({
  params
}: {
  params: { id: string }
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

  const campaign = await getCampaignDetails(params.id, profile.organization_id)

  if (!campaign) {
    redirect('/dashboard/management/campaigns')
  }

  const [leads, agents, agentLeadCounts] = await Promise.all([
    getCampaignLeads(params.id, profile.organization_id),
    getAgents(profile.organization_id),
    getAgentLeadCounts(params.id, profile.organization_id)
  ])

  return (
    <DashboardLayout user={profile}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/management/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground">
            {campaign.clients?.company_name} • {campaign.description || 'No description'}
          </p>
        </div>

        <CampaignLeadManagement
          campaign={campaign}
          leads={leads}
          agents={agents}
          agentLeadCounts={agentLeadCounts}
          organizationId={profile.organization_id}
        />
      </div>
    </DashboardLayout>
  )
}
