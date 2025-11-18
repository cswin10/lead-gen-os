'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Handle call outcome with smart requeue logic
export async function handleCallOutcome(
  leadId: string,
  agentId: string,
  organizationId: string,
  outcome: string,
  durationSeconds: number,
  notes: string,
  callbackDate?: string
) {
  const supabase = await createClient()

  const updateData: any = {
    last_contacted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Outcome-based logic
  switch (outcome) {
    // No Contact Outcomes
    case 'no_answer':
      updateData.status = 'contacted'
      // Requeue with increasing delay (handled by smart requeue logic in queries)
      break

    case 'wrong_number':
      updateData.status = 'lost'
      break

    case 'gatekeeper':
      updateData.status = 'contacted'
      // Will be requeued for next attempt
      break

    case 'busy':
      updateData.status = 'contacted'
      // Requeue for later
      break

    case 'voicemail':
      updateData.status = 'contacted'
      break

    // Contacted Outcomes
    case 'connected':
      updateData.status = 'contacted'
      break

    case 'interested':
      updateData.status = 'interested'
      updateData.score = 70 // Boost score
      break

    case 'qualified':
      updateData.status = 'qualified'
      updateData.score = 90 // High score
      break

    case 'not_interested':
      updateData.status = 'not_interested'
      break

    case 'callback':
      updateData.status = 'contacted'
      if (callbackDate) {
        updateData.next_follow_up_at = callbackDate
      }
      break

    case 'appointment_set':
      updateData.status = 'qualified'
      updateData.score = 95
      if (callbackDate) {
        updateData.next_follow_up_at = callbackDate
      }
      break

    default:
      updateData.status = 'contacted'
  }

  // Update the lead
  const { error: updateError } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', leadId)

  if (updateError) {
    console.error('Error updating lead:', updateError)
    return { success: false, error: updateError.message }
  }

  // Log the call
  const { error: callError } = await supabase
    .from('calls')
    .insert({
      lead_id: leadId,
      agent_id: agentId,
      organization_id: organizationId,
      duration_seconds: durationSeconds,
      outcome,
      notes,
      status: 'completed',
      phone_number: '', // Will be filled from lead
      direction: 'outbound',
    })

  if (callError) {
    console.error('Error logging call:', callError)
    return { success: false, error: callError.message }
  }

  // Log activity
  await supabase.from('activities').insert({
    organization_id: organizationId,
    lead_id: leadId,
    user_id: agentId,
    type: 'call',
    content: notes || `Call outcome: ${outcome}`,
    metadata: { outcome, duration: durationSeconds }
  })

  revalidatePath('/dashboard/agent')
  return { success: true }
}

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

// Add note to lead
export async function addLeadNote(
  leadId: string,
  agentId: string,
  organizationId: string,
  note: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('activities')
    .insert({
      organization_id: organizationId,
      lead_id: leadId,
      user_id: agentId,
      type: 'note',
      content: note,
    })

  if (error) {
    console.error('Error adding note:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/agent')
  return { success: true }
}

// Schedule callback
export async function scheduleCallback(leadId: string, callbackDate: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .update({
      next_follow_up_at: callbackDate,
      status: 'contacted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  if (error) {
    console.error('Error scheduling callback:', error)
    return { success: false, error: error.message }
  }

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
