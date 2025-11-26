'use client'

import { useState } from 'react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Download,
  Calendar,
  Trash2,
  RefreshCw,
  TrendingUp,
  Users,
  Phone,
  Target,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Report {
  id: string
  name: string
  report_type: 'weekly' | 'monthly' | 'custom'
  period_start: string
  period_end: string
  data: any
  created_at: string
  created_by_profile?: {
    full_name: string
  }
}

interface ReportsClientProps {
  initialReports: Report[]
}

export default function ReportsClient({ initialReports }: ReportsClientProps) {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [generating, setGenerating] = useState<'weekly' | 'monthly' | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function generateReport(type: 'weekly' | 'monthly') {
    setGenerating(type)

    try {
      let periodStart: Date
      let periodEnd: Date

      if (type === 'weekly') {
        // Last complete week (Monday to Sunday)
        const lastWeek = subDays(new Date(), 7)
        periodStart = startOfWeek(lastWeek, { weekStartsOn: 1 })
        periodEnd = endOfWeek(lastWeek, { weekStartsOn: 1 })
      } else {
        // Last complete month
        const lastMonth = subMonths(new Date(), 1)
        periodStart = startOfMonth(lastMonth)
        periodEnd = endOfMonth(lastMonth)
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: type,
          periodStart: format(periodStart, 'yyyy-MM-dd'),
          periodEnd: format(periodEnd, 'yyyy-MM-dd')
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate report')
      }

      const { report } = await response.json()
      setReports([report, ...reports])
      setSelectedReport(report)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setGenerating(null)
    }
  }

  async function downloadReport(reportId: string, reportName: string, format: 'csv' | 'json' = 'csv') {
    try {
      const response = await fetch(`/api/reports/${reportId}/download?format=${format}`)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportName.replace(/\s+/g, '_')}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Failed to download report')
    }
  }

  async function deleteReport(reportId: string) {
    if (!confirm('Are you sure you want to delete this report?')) return

    setDeleting(reportId)
    try {
      const response = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Delete failed')

      setReports(reports.filter(r => r.id !== reportId))
      if (selectedReport?.id === reportId) setSelectedReport(null)
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('Failed to delete report')
    } finally {
      setDeleting(null)
    }
  }

  function getReportTypeBadge(type: string) {
    const colors: Record<string, string> = {
      weekly: 'bg-blue-500/10 text-blue-700 border-blue-200',
      monthly: 'bg-purple-500/10 text-purple-700 border-purple-200',
      custom: 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
    return colors[type] || colors.custom
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and view weekly/monthly performance reports
          </p>
        </div>
      </div>

      {/* Generate Report Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-0 shadow-premium hover:shadow-premium-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <Badge className={getReportTypeBadge('weekly')}>Weekly</Badge>
            </div>
            <CardTitle className="mt-3">Weekly Report</CardTitle>
            <CardDescription>
              Performance summary for the last complete week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => generateReport('weekly')}
              disabled={generating !== null}
              className="w-full"
            >
              {generating === 'weekly' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Weekly Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-premium hover:shadow-premium-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <Badge className={getReportTypeBadge('monthly')}>Monthly</Badge>
            </div>
            <CardTitle className="mt-3">Monthly Report</CardTitle>
            <CardDescription>
              Comprehensive summary for the last complete month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => generateReport('monthly')}
              disabled={generating !== null}
              className="w-full"
              variant="secondary"
            >
              {generating === 'monthly' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Monthly Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Report History */}
      <Card className="border-0 shadow-premium">
        <CardHeader>
          <CardTitle className="text-xl">Report History</CardTitle>
          <CardDescription>
            Previously generated reports - click to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports generated yet</p>
              <p className="text-sm mt-1">Generate your first weekly or monthly report above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg overflow-hidden transition-all hover:border-primary/30"
                >
                  {/* Report Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedReportId(
                      expandedReportId === report.id ? null : report.id
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{report.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.created_at), 'dd MMM yyyy, HH:mm')}
                          {report.created_by_profile?.full_name &&
                            ` • ${report.created_by_profile.full_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={getReportTypeBadge(report.report_type)}>
                        {report.report_type}
                      </Badge>
                      {expandedReportId === report.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedReportId === report.id && (
                    <div className="border-t bg-gray-50/50 p-4 space-y-4">
                      {/* Summary Stats */}
                      {report.data?.summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                              <Phone className="h-3 w-3" />
                              Calls
                            </div>
                            <p className="text-lg font-bold">{report.data.summary.totalCalls}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                              <Users className="h-3 w-3" />
                              Leads
                            </div>
                            <p className="text-lg font-bold">{report.data.summary.totalLeads}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                              <Target className="h-3 w-3" />
                              Qualified
                            </div>
                            <p className="text-lg font-bold">{report.data.summary.qualifiedLeads}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                              <TrendingUp className="h-3 w-3" />
                              Closed Won
                            </div>
                            <p className="text-lg font-bold">{report.data.summary.closedWon}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                              £ Revenue
                            </div>
                            <p className="text-lg font-bold">
                              £{report.data.summary.revenue?.toLocaleString() || 0}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                              % Conversion
                            </div>
                            <p className="text-lg font-bold">{report.data.summary.conversionRate}%</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadReport(report.id, report.name, 'csv')
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download CSV
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadReport(report.id, report.name, 'json')
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download JSON
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedReport(report)
                          }}
                        >
                          View Full Report
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteReport(report.id)
                          }}
                          disabled={deleting === report.id}
                        >
                          {deleting === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedReport.name}</DialogTitle>
                <DialogDescription>
                  Period: {format(new Date(selectedReport.period_start), 'dd MMM yyyy')} -{' '}
                  {format(new Date(selectedReport.period_end), 'dd MMM yyyy')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Summary */}
                {selectedReport.data?.summary && (
                  <div>
                    <h3 className="font-semibold mb-3">Summary</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Calls</p>
                        <p className="text-2xl font-bold">{selectedReport.data.summary.totalCalls}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Leads</p>
                        <p className="text-2xl font-bold">{selectedReport.data.summary.totalLeads}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Qualified Leads</p>
                        <p className="text-2xl font-bold">{selectedReport.data.summary.qualifiedLeads}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Closed Won</p>
                        <p className="text-2xl font-bold">{selectedReport.data.summary.closedWon}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-2xl font-bold">
                          £{selectedReport.data.summary.revenue?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                        <p className="text-2xl font-bold">{selectedReport.data.summary.conversionRate}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campaign Performance */}
                {selectedReport.data?.campaigns?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Campaign Performance</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-medium">Campaign</th>
                            <th className="text-left p-3 font-medium">Client</th>
                            <th className="text-right p-3 font-medium">Leads</th>
                            <th className="text-right p-3 font-medium">Qualified</th>
                            <th className="text-center p-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.data.campaigns.map((campaign: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="p-3">{campaign.name}</td>
                              <td className="p-3 text-muted-foreground">{campaign.client}</td>
                              <td className="p-3 text-right">{campaign.leadsGenerated}</td>
                              <td className="p-3 text-right">{campaign.qualifiedLeads}</td>
                              <td className="p-3 text-center">
                                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                                  {campaign.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Agent Performance */}
                {selectedReport.data?.agents?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Agent Performance</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-medium">Agent</th>
                            <th className="text-right p-3 font-medium">Calls</th>
                            <th className="text-right p-3 font-medium">Leads Converted</th>
                            <th className="text-right p-3 font-medium">Avg Call Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.data.agents.map((agent: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="p-3">{agent.name}</td>
                              <td className="p-3 text-right">{agent.calls}</td>
                              <td className="p-3 text-right">{agent.leadsConverted}</td>
                              <td className="p-3 text-right">
                                {Math.floor(agent.avgCallDuration / 60)}m {agent.avgCallDuration % 60}s
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Download Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => downloadReport(selectedReport.id, selectedReport.name, 'csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                  <Button variant="outline" onClick={() => downloadReport(selectedReport.id, selectedReport.name, 'json')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
