'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAgent(formData: {
  email: string
  firstName: string
  lastName: string
  password: string
  organizationId: string
}) {
  try {
    // Check authorization - only owners/managers can create agents
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
      return { success: false, error: 'Unauthorized: Only owners and managers can create agents' }
    }

    if (profile.organization_id !== formData.organizationId) {
      return { success: false, error: 'Unauthorized: Cannot create agents for other organizations' }
    }

    // Use service role client for admin operations
    const adminClient = await createServiceRoleClient()

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true,
    })

    if (authError) {
      return { success: false, error: `Auth user creation failed: ${authError.message}` }
    }

    // Update profile (auto-created by trigger) with correct data
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'agent',
        organization_id: formData.organizationId,
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      return { success: false, error: `Profile creation failed: ${profileError.message}` }
    }

    revalidatePath('/dashboard/settings')
    return { success: true, credentials: { email: formData.email, password: formData.password } }
  } catch (error: any) {
    console.error('Error in createAgent:', error)
    return {
      success: false,
      error: error?.message || 'An unexpected error occurred. Check server logs for details.'
    }
  }
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
  try {
    // Check authorization - only owners/managers can create clients
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
      return { success: false, error: 'Unauthorized: Only owners and managers can create clients' }
    }

    if (profile.organization_id !== formData.organizationId) {
      return { success: false, error: 'Unauthorized: Cannot create clients for other organizations' }
    }

    // Use service role client for admin operations
    const adminClient = await createServiceRoleClient()

    // Create client record
    const { data: client, error: clientError } = await adminClient
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
      return { success: false, error: `Client creation failed: ${clientError.message}` }
    }

    // Create auth user for client portal access
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true,
    })

    if (authError) {
      return { success: false, error: `Auth user creation failed: ${authError.message}` }
    }

    // Update profile (auto-created by trigger) and link to client company
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'client',
        organization_id: formData.organizationId,
        client_id: client.id,  // Link this user to their client company
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      return { success: false, error: `Profile creation failed: ${profileError.message}` }
    }

    revalidatePath('/dashboard/settings')
    return {
      success: true,
      clientId: client.id,
      credentials: { email: formData.email, password: formData.password }
    }
  } catch (error: any) {
    console.error('Error in createClientAndUser:', error)
    return {
      success: false,
      error: error?.message || 'An unexpected error occurred. Check server logs for details.'
    }
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
