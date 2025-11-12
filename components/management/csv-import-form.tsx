'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function CSVImportForm({ campaigns, organizationId }: any) {
  const [campaignId, setCampaignId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: number, failed: number, errors: string[] } | null>(null)

  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const leads = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length === 0 || !values[0]) continue

      const lead: any = {}
      headers.forEach((header, index) => {
        lead[header] = values[index] || ''
      })
      leads.push(lead)
    }

    return leads
  }

  const handleImport = async () => {
    if (!file || !campaignId) {
      alert('Please select a campaign and upload a CSV file')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Read file
      const text = await file.text()
      const parsedLeads = parseCSV(text)

      if (parsedLeads.length === 0) {
        alert('No valid leads found in CSV')
        setLoading(false)
        return
      }

      // Get campaign details
      const campaign = campaigns.find((c: any) => c.id === campaignId)
      if (!campaign) {
        alert('Invalid campaign')
        setLoading(false)
        return
      }

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      // Import leads in batches
      for (const lead of parsedLeads) {
        try {
          // Map CSV columns to database fields
          const leadData = {
            organization_id: organizationId,
            campaign_id: campaignId,
            client_id: campaign.client_id,
            first_name: lead.first_name || lead.firstname || '',
            last_name: lead.last_name || lead.lastname || '',
            email: lead.email || '',
            phone: lead.phone || lead.telephone || lead.mobile || '',
            company: lead.company || lead.organization || '',
            job_title: lead.job_title || lead.title || lead.position || '',
            status: 'new',
          }

          // Validate required fields
          if (!leadData.first_name || !leadData.last_name || !leadData.phone) {
            failedCount++
            errors.push(`Row ${parsedLeads.indexOf(lead) + 2}: Missing required fields (first_name, last_name, or phone)`)
            continue
          }

          const { error } = await supabase
            .from('leads')
            .insert(leadData)

          if (error) {
            failedCount++
            errors.push(`Row ${parsedLeads.indexOf(lead) + 2}: ${error.message}`)
          } else {
            successCount++
          }
        } catch (err: any) {
          failedCount++
          errors.push(`Row ${parsedLeads.indexOf(lead) + 2}: ${err.message}`)
        }
      }

      setResult({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10), // Show first 10 errors
      })

    } catch (error: any) {
      alert('Error importing leads: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format Requirements</CardTitle>
          <CardDescription>Your CSV file should include these columns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Required columns:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>first_name (or firstname)</li>
              <li>last_name (or lastname)</li>
              <li>phone (or telephone, mobile)</li>
            </ul>
            <p className="mt-4"><strong>Optional columns:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>email</li>
              <li>company (or organization)</li>
              <li>job_title (or title, position)</li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              Example: <code className="bg-muted px-1 py-0.5 rounded">first_name,last_name,email,phone,company,job_title</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Import Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>Select a campaign and upload your leads file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign *</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign: any) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name} ({campaign.clients?.company_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {campaigns.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No active campaigns. <Link href="/dashboard/management/campaigns" className="text-primary hover:underline">Create one first</Link>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">CSV File *</Label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="file"
                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </label>
              <input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleImport}
            disabled={loading || !file || !campaignId || campaigns.length === 0}
            className="w-full"
          >
            {loading ? 'Importing...' : 'Import Leads'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">Successfully Imported</p>
                <p className="text-2xl font-bold text-green-700">{result.success}</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">Failed</p>
                <p className="text-2xl font-bold text-red-700">{result.failed}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Errors:</p>
                <div className="space-y-1 text-sm text-muted-foreground max-h-40 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <p key={index}>• {error}</p>
                  ))}
                  {result.failed > result.errors.length && (
                    <p className="text-xs italic">...and {result.failed - result.errors.length} more errors</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Link href="/dashboard/management/leads" className="flex-1">
                <Button variant="outline" className="w-full">View Leads</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setResult(null)
                  const input = document.getElementById('file') as HTMLInputElement
                  if (input) input.value = ''
                }}
              >
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
