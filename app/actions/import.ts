'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface LeadImportData {
  first_name: string
  last_name: string
  email?: string
  phone: string
  company?: string
  job_title?: string
  source?: string
  priority?: number
  tags?: string[]
}

export async function importLeads(
  leads: LeadImportData[],
  campaignId: string,
  organizationId: string,
  clientId?: string,
  assignToAgentId?: string
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
      return { success: false, error: 'Unauthorized: Only owners and managers can import leads' }
    }

    if (profile.organization_id !== organizationId) {
      return { success: false, error: 'Unauthorized: Cannot import leads for other organizations' }
    }

    // Use service role for bulk operations
    const adminClient = await createServiceRoleClient()

    // Prepare leads for insertion
    const leadsToInsert = leads.map(lead => ({
      organization_id: organizationId,
      campaign_id: campaignId,
      client_id: clientId || null,
      assigned_agent_id: assignToAgentId || null,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email || null,
      phone: lead.phone,
      company: lead.company || null,
      job_title: lead.job_title || null,
      status: 'new',
      priority: lead.priority || 0,
      score: 0,
      source: lead.source || 'csv_import',
      tags: lead.tags || [],
      custom_fields: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Insert leads in batches of 100
    const batchSize = 100
    let totalInserted = 0
    const errors: string[] = []

    console.log(`Attempting to insert ${leadsToInsert.length} leads in batches of ${batchSize}`)

    for (let i = 0; i < leadsToInsert.length; i += batchSize) {
      const batch = leadsToInsert.slice(i, i + batchSize)

      console.log(`Inserting batch ${i / batchSize + 1}, size: ${batch.length}`)

      const { data, error } = await adminClient
        .from('leads')
        .insert(batch)
        .select()

      if (error) {
        console.error('Batch insert error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        errors.push(`Batch ${i / batchSize + 1}: ${error.message} (${error.code || 'no code'})`)
      } else {
        console.log(`Batch ${i / batchSize + 1} succeeded, inserted ${data?.length || 0} leads`)
        totalInserted += data?.length || 0
      }
    }

    console.log(`Total inserted: ${totalInserted}, Total errors: ${errors.length}`)

    // Log import activity
    await adminClient.from('activities').insert({
      organization_id: organizationId,
      user_id: user.id,
      type: 'import',
      content: `Imported ${totalInserted} leads from CSV`,
      metadata: {
        campaign_id: campaignId,
        client_id: clientId,
        total_leads: leads.length,
        successful: totalInserted,
        errors: errors.length
      }
    })

    revalidatePath('/dashboard/management/leads')
    revalidatePath('/dashboard/agent')

    if (totalInserted === 0 && errors.length > 0) {
      // Complete failure
      return {
        success: false,
        error: `Import failed: ${errors.join('; ')}`
      }
    }

    if (errors.length > 0) {
      // Partial success
      return {
        success: true,
        imported: totalInserted,
        total: leads.length,
        errors: errors,
        message: `Imported ${totalInserted} of ${leads.length} leads. Errors: ${errors.join('; ')}`
      }
    }

    return {
      success: true,
      imported: totalInserted,
      total: leads.length,
      message: `Successfully imported ${totalInserted} leads`
    }
  } catch (error: any) {
    console.error('Import error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during import'
    }
  }
}

export async function validateLeadCSV(csvData: string) {
  try {
    const lines = csvData.trim().split('\n')
    if (lines.length < 2) {
      return { success: false, error: 'CSV file is empty or missing data' }
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())

    // Required fields
    const requiredFields = ['first_name', 'last_name', 'phone']
    const missingFields = requiredFields.filter(field => !header.includes(field))

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required columns: ${missingFields.join(', ')}`
      }
    }

    // Parse data rows
    const leads: LeadImportData[] = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(',').map(v => v.trim())
      const lead: any = {}

      header.forEach((field, index) => {
        lead[field] = values[index] || ''
      })

      // Validate required fields
      if (!lead.first_name || !lead.last_name || !lead.phone) {
        errors.push(`Row ${i + 1}: Missing required fields`)
        continue
      }

      // Validate phone format (basic)
      const phoneRegex = /^[+]?[\d\s\-()]+$/
      if (!phoneRegex.test(lead.phone)) {
        errors.push(`Row ${i + 1}: Invalid phone number format`)
        continue
      }

      // Parse tags if present
      if (lead.tags && typeof lead.tags === 'string') {
        lead.tags = lead.tags.split('|').map((t: string) => t.trim()).filter(Boolean)
      }

      // Parse priority
      if (lead.priority) {
        lead.priority = parseInt(lead.priority) || 0
      }

      leads.push({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email || undefined,
        phone: lead.phone,
        company: lead.company || undefined,
        job_title: lead.job_title || undefined,
        source: lead.source || 'csv_import',
        priority: lead.priority || 0,
        tags: lead.tags || []
      })
    }

    return {
      success: true,
      leads,
      total: leads.length,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error: any) {
    console.error('CSV validation error:', error)
    return {
      success: false,
      error: 'Failed to parse CSV file. Please check the format.'
    }
  }
}
