'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAgent(formData: {
  email: string
  firstName: string
  lastName: string
  password: string
  organizationId: string
}) {
  const supabase = await createClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
  })

  if (authError) {
    return { success: false, error: authError.message }
  }

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      role: 'agent',
      organization_id: formData.organizationId,
    })

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true, credentials: { email: formData.email, password: formData.password } }
}

export async function createClientAndUser(formData: {
  // Client company info
  companyName: string
  industry: string
  costPerLead: number
  // User info
  email: string
  firstName: string
  lastName: string
  password: string
  organizationId: string
}) {
  const supabase = await createClient()

  // Create client record
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      company_name: formData.companyName,
      industry: formData.industry,
      cost_per_lead: formData.costPerLead,
      organization_id: formData.organizationId,
    })
    .select()
    .single()

  if (clientError) {
    return { success: false, error: clientError.message }
  }

  // Create auth user for client portal access
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
  })

  if (authError) {
    return { success: false, error: authError.message }
  }

  // Create profile linked to client company
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      role: 'client',
      organization_id: formData.organizationId,
      client_id: client.id,  // Link this user to their client company
    })

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  revalidatePath('/dashboard/settings')
  return {
    success: true,
    clientId: client.id,
    credentials: { email: formData.email, password: formData.password }
  }
}

export async function getTeamMembers(organizationId: string) {
  const supabase = await createClient()

  const { data: agents } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('role', 'agent')
    .order('created_at', { ascending: false })

  const { data: clients } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  return { agents: agents || [], clients: clients || [] }
}
