'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function batchAssignLeads(
  campaignId: string,
  agentId: string,
  organizationId: string,
  count: number | 'all'
) {
  try {
    // Verify authorization
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Unauthorized: Only owners and managers can assign leads' }
    }

    if (profile.organization_id !== organizationId) {
      return { success: false, error: 'Unauthorized: Cannot assign leads for other organizations' }
    }

    // Verify agent exists and belongs to this organization
    const { data: agent } = await supabase
      .from('profiles')
      .select('id, role, organization_id')
      .eq('id', agentId)
      .eq('organization_id', organizationId)
      .eq('role', 'agent')
      .single()

    if (!agent) {
      return { success: false, error: 'Agent not found or invalid' }
    }

    // Get unassigned leads from this campaign
    const query = supabase
      .from('leads')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId)
      .is('assigned_agent_id', null)
      .order('created_at', { ascending: true }) // Oldest first

    if (count !== 'all') {
      query.limit(count)
    }

    const { data: unassignedLeads, error: fetchError } = await query

    if (fetchError) {
      return { success: false, error: 'Failed to fetch unassigned leads: ' + fetchError.message }
    }

    if (!unassignedLeads || unassignedLeads.length === 0) {
      return { success: false, error: 'No unassigned leads available in this campaign' }
    }

    // Use service role for bulk update
    const adminClient = await createServiceRoleClient()

    const leadIds = unassignedLeads.map(lead => lead.id)

    // Update leads to assign to agent
    const { error: updateError } = await adminClient
      .from('leads')
      .update({
        assigned_agent_id: agentId,
        updated_at: new Date().toISOString()
      })
      .in('id', leadIds)

    if (updateError) {
      return { success: false, error: 'Failed to assign leads: ' + updateError.message }
    }

    // Log activity
    const activities = leadIds.map(leadId => ({
      organization_id: organizationId,
      lead_id: leadId,
      user_id: user.id,
      type: 'assignment',
      content: `Lead assigned to agent`,
      metadata: { agent_id: agentId, assigned_by: user.id }
    }))

    await adminClient.from('activities').insert(activities)

    revalidatePath(`/dashboard/management/campaigns/${campaignId}`)
    revalidatePath('/dashboard/management/leads')

    return {
      success: true,
      message: `Successfully assigned ${leadIds.length} lead(s) to agent`,
      count: leadIds.length
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to assign leads' }
  }
}

export async function autoDistributeLeads(
  campaignId: string,
  organizationId: string
) {
  try {
    // Verify authorization
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    if (profile.organization_id !== organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get all active agents
    const { data: agents } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('role', 'agent')
      .order('created_at')

    if (!agents || agents.length === 0) {
      return { success: false, error: 'No agents available for distribution' }
    }

    // Get unassigned leads
    const { data: unassignedLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId)
      .is('assigned_agent_id', null)
      .order('priority', { ascending: false }) // High priority first
      .order('created_at', { ascending: true }) // Then oldest first

    if (!unassignedLeads || unassignedLeads.length === 0) {
      return { success: false, error: 'No unassigned leads available' }
    }

    // Round-robin distribution
    const adminClient = await createServiceRoleClient()
    let totalAssigned = 0

    for (let i = 0; i < unassignedLeads.length; i++) {
      const agentIndex = i % agents.length
      const agentId = agents[agentIndex].id
      const leadId = unassignedLeads[i].id

      await adminClient
        .from('leads')
        .update({
          assigned_agent_id: agentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

      // Log activity
      await adminClient.from('activities').insert({
        organization_id: organizationId,
        lead_id: leadId,
        user_id: user.id,
        type: 'assignment',
        content: 'Lead auto-distributed to agent',
        metadata: { agent_id: agentId, assigned_by: user.id, distribution_type: 'auto' }
      })

      totalAssigned++
    }

    revalidatePath(`/dashboard/management/campaigns/${campaignId}`)
    revalidatePath('/dashboard/management/leads')

    return {
      success: true,
      message: `Successfully distributed ${totalAssigned} leads across ${agents.length} agent(s)`,
      count: totalAssigned
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to auto-distribute leads' }
  }
}

export async function reassignLead(
  leadId: string,
  newAgentId: string,
  organizationId: string
) {
  try {
    // Verify authorization
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    if (profile.organization_id !== organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current lead info
    const { data: lead } = await supabase
      .from('leads')
      .select('assigned_agent_id')
      .eq('id', leadId)
      .eq('organization_id', organizationId)
      .single()

    if (!lead) {
      return { success: false, error: 'Lead not found' }
    }

    // Verify new agent
    const { data: agent } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', newAgentId)
      .eq('organization_id', organizationId)
      .eq('role', 'agent')
      .single()

    if (!agent) {
      return { success: false, error: 'Agent not found' }
    }

    // Update lead assignment
    const adminClient = await createServiceRoleClient()

    const { error: updateError } = await adminClient
      .from('leads')
      .update({
        assigned_agent_id: newAgentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)

    if (updateError) {
      return { success: false, error: 'Failed to reassign lead: ' + updateError.message }
    }

    // Log activity
    await adminClient.from('activities').insert({
      organization_id: organizationId,
      lead_id: leadId,
      user_id: user.id,
      type: 'assignment',
      content: `Lead reassigned to ${agent.full_name}`,
      metadata: {
        previous_agent_id: lead.assigned_agent_id,
        new_agent_id: newAgentId,
        reassigned_by: user.id
      }
    })

    revalidatePath('/dashboard/management/leads')

    return { success: true, message: `Lead reassigned to ${agent.full_name}` }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reassign lead' }
  }
}

export async function bulkReassignLeads(
  leadIds: string[],
  newAgentId: string,
  organizationId: string
) {
  try {
    // Verify authorization
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    if (profile.organization_id !== organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify new agent
    const { data: agent } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', newAgentId)
      .eq('organization_id', organizationId)
      .eq('role', 'agent')
      .single()

    if (!agent) {
      return { success: false, error: 'Agent not found' }
    }

    // Update leads
    const adminClient = await createServiceRoleClient()

    const { error: updateError } = await adminClient
      .from('leads')
      .update({
        assigned_agent_id: newAgentId,
        updated_at: new Date().toISOString()
      })
      .in('id', leadIds)

    if (updateError) {
      return { success: false, error: 'Failed to reassign leads: ' + updateError.message }
    }

    // Log activities
    const activities = leadIds.map(leadId => ({
      organization_id: organizationId,
      lead_id: leadId,
      user_id: user.id,
      type: 'assignment',
      content: `Lead reassigned to ${agent.full_name}`,
      metadata: { new_agent_id: newAgentId, reassigned_by: user.id, bulk: true }
    }))

    await adminClient.from('activities').insert(activities)

    revalidatePath('/dashboard/management/leads')

    return {
      success: true,
      message: `Successfully reassigned ${leadIds.length} lead(s) to ${agent.full_name}`
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to bulk reassign leads' }
  }
}
