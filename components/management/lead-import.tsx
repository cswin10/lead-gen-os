'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Download, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { validateLeadCSV, importLeads } from '@/app/actions/import'
import { useRouter } from 'next/navigation'

interface LeadImportProps {
  organizationId: string
  campaigns: Array<{ id: string; name: string }>
  clients: Array<{ id: string; company_name: string }>
  agents: Array<{ id: string; first_name: string; last_name: string }>
  defaultCampaignId?: string
}

export default function LeadImport({ organizationId, campaigns, clients, agents, defaultCampaignId }: LeadImportProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string>('')
  const [validatedLeads, setValidatedLeads] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>(defaultCampaignId || '')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setImportResult(null)

    // Read file content
    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      setCsvData(content)

      // Validate CSV
      setIsValidating(true)
      const result = await validateLeadCSV(content)
      setIsValidating(false)

      if (result.success && result.leads) {
        setValidatedLeads(result.leads)
        setValidationErrors(result.errors || [])
        setStep('preview')
      } else {
        alert('CSV validation failed: ' + result.error)
        setFile(null)
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleImport = async () => {
    if (!selectedCampaign) {
      alert('Please select a campaign')
      return
    }

    if (validatedLeads.length === 0) {
      alert('No valid leads to import')
      return
    }

    setIsImporting(true)

    const result = await importLeads(
      validatedLeads,
      selectedCampaign,
      organizationId,
      selectedClient || undefined,
      selectedAgent || undefined
    )

    setIsImporting(false)

    if (result.success) {
      setImportResult(result)
      setStep('complete')
      router.refresh()
    } else {
      alert('Import failed: ' + result.error)
    }
  }

  const handleReset = () => {
    setFile(null)
    setCsvData('')
    setValidatedLeads([])
    setValidationErrors([])
    setSelectedCampaign('')
    setSelectedClient('')
    setSelectedAgent('')
    setImportResult(null)
    setStep('upload')
  }

  const downloadTemplate = () => {
    const template = `first_name,last_name,phone,email,company,job_title,source,priority
John,Doe,+1234567890,john@example.com,Acme Corp,CEO,referral,50
Jane,Smith,+0987654321,jane@example.com,Tech Inc,CTO,website,75`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lead-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (step === 'complete' && importResult) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <CardTitle>Import Complete!</CardTitle>
          </div>
          <CardDescription>Your leads have been successfully imported</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Leads:</span>
              <span className="text-2xl font-bold text-green-600">{importResult.imported}</span>
            </div>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm text-orange-600">
                  {importResult.errors.length} rows had errors and were skipped
                </p>
              </div>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Leads have been added to the selected campaign and will appear in the lead queue.
              {selectedAgent && ' They have been assigned to the selected agent.'}
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={handleReset} className="flex-1">
              Import More Leads
            </Button>
            <Button
              onClick={() => router.push('/dashboard/management/leads')}
              variant="outline"
              className="flex-1"
            >
              View Leads
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Leads from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file to bulk import leads into your campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Need a template?</p>
              <p className="text-sm text-blue-700">Download our CSV template to get started</p>
            </div>
          </div>
          <Button onClick={downloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {step === 'upload' && (
          <>
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="csv-upload">Upload CSV File</Label>
              <div className="flex items-center gap-4">
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  onClick={() => document.getElementById('csv-upload')?.click()}
                  variant="outline"
                  className="w-full"
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {file ? file.name : 'Choose CSV File'}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Required columns: first_name, last_name, phone
              </p>
            </div>

            {/* CSV Format Guide */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">CSV Format Requirements:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>Required:</strong> first_name, last_name, phone</li>
                <li><strong>Optional:</strong> email, company, job_title, source, priority</li>
                <li>Phone numbers should include country code (e.g., +1234567890)</li>
                <li>Priority should be a number (0-100)</li>
                <li>Use pipe | to separate multiple tags</li>
              </ul>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            {/* Validation Results */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Found {validationErrors.length} errors:</p>
                  <ul className="text-xs list-disc list-inside">
                    {validationErrors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li>...and {validationErrors.length - 5} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Found {validatedLeads.length} valid leads ready to import
                {validationErrors.length > 0 && ` (${validationErrors.length} rows skipped due to errors)`}
              </AlertDescription>
            </Alert>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview (First 5 leads)</Label>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Phone</th>
                        <th className="px-4 py-2 text-left">Company</th>
                        <th className="px-4 py-2 text-left">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validatedLeads.slice(0, 5).map((lead, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2">{lead.first_name} {lead.last_name}</td>
                          <td className="px-4 py-2">{lead.phone}</td>
                          <td className="px-4 py-2">{lead.company || '-'}</td>
                          <td className="px-4 py-2">{lead.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {validatedLeads.length > 5 && (
                  <div className="px-4 py-2 bg-slate-50 border-t text-sm text-muted-foreground">
                    ...and {validatedLeads.length - 5} more leads
                  </div>
                )}
              </div>
            </div>

            {/* Import Configuration */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Import Configuration</h4>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign *</Label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map(campaign => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client (Optional)</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent">Assign to Agent (Optional)</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger id="agent">
                    <SelectValue placeholder="Auto-distribute or select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto-distribute later</SelectItem>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.first_name} {agent.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedCampaign || isImporting}
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {validatedLeads.length} Leads
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
