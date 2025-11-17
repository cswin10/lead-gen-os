'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateLeadStatus(leadId: string, status: string, notes?: string) {
  const supabase = await createClient()

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Add status-specific fields
  if (status === 'contacted') {
    updateData.last_contacted_at = new Date().toISOString()
  }

  if (notes) {
    updateData.notes = notes
  }

  const { error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', leadId)

  if (error) {
    console.error('Error updating lead:', error)
    return { success: false, error: error.message }
  }

  // Revalidate the agent dashboard
  revalidatePath('/dashboard/agent')

  return { success: true }
}

export async function logCall(
  leadId: string,
  agentId: string,
  organizationId: string,
  durationSeconds: number,
  outcome: string,
  notes?: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('calls')
    .insert({
      lead_id: leadId,
      agent_id: agentId,
      organization_id: organizationId,
      duration_seconds: durationSeconds,
      outcome,
      notes,
      created_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error logging call:', error)
    return { success: false, error: error.message }
  }

  // Revalidate the agent dashboard
  revalidatePath('/dashboard/agent')

  return { success: true }
}
