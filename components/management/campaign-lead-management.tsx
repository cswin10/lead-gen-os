'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users, UserCheck, UserX, TrendingUp, Shuffle, Upload,
  Search, Filter, Eye, RefreshCw, CheckSquare, Square,
  Phone, MessageSquare, Clock, AlertCircle, Loader2
} from 'lucide-react'
import { batchAssignLeads, autoDistributeLeads, reassignLead, bulkReassignLeads } from '@/app/actions/lead-assignment'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string
  company: string | null
  job_title: string | null
  status: string
  priority: number
  score: number
  source: string
  assigned_agent_id: string | null
  last_contacted_at: string | null
  next_follow_up_at: string | null
  created_at: string
  profiles: { id: string; full_name: string; email: string } | null
  calls: any[]
  activities: any[]
}

interface Agent {
  id: string
  full_name: string
  email: string
  first_name: string
  last_name: string
}

interface Campaign {
  id: string
  name: string
  description: string
  status: string
  clients: { company_name: string }
}

export default function CampaignLeadManagement({
  campaign,
  leads: initialLeads,
  agents,
  agentLeadCounts,
  organizationId
}: {
  campaign: Campaign
  leads: Lead[]
  agents: Agent[]
  agentLeadCounts: Record<string, number>
  organizationId: string
}) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [assignCount, setAssignCount] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignResult, setAssignResult] = useState<{ success: boolean; message?: string; error?: string; count?: number } | null>(null)

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')

  // Selection
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [showReassignDialog, setShowReassignDialog] = useState(false)
  const [reassignToAgent, setReassignToAgent] = useState('')

  // Lead detail modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Calculate stats
  const stats = useMemo(() => {
    const total = leads.length
    const unassigned = leads.filter(l => !l.assigned_agent_id).length
    const assigned = total - unassigned

    const byStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const contacted = leads.filter(l => l.last_contacted_at).length
    const callsMade = leads.reduce((sum, lead) => sum + (lead.calls?.length || 0), 0)

    return {
      total,
      unassigned,
      assigned,
      byStatus,
      contacted,
      callsMade,
      contactRate: total > 0 ? Math.round((contacted / total) * 100) : 0
    }
  }, [leads])

  // Filtered and sorted leads
  const filteredLeads = useMemo(() => {
    let filtered = leads

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        lead =>
          lead.first_name.toLowerCase().includes(query) ||
          lead.last_name.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.company?.toLowerCase().includes(query)
      )
    }

    // Filter by agent
    if (filterAgent !== 'all') {
      if (filterAgent === 'unassigned') {
        filtered = filtered.filter(l => !l.assigned_agent_id)
      } else {
        filtered = filtered.filter(l => l.assigned_agent_id === filterAgent)
      }
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(l => l.status === filterStatus)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'last_contact':
          const aTime = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : 0
          const bTime = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : 0
          return bTime - aTime
        case 'score':
          return b.score - a.score
        case 'name':
          return a.first_name.localeCompare(b.first_name)
        default:
          return 0
      }
    })

    return filtered
  }, [leads, searchQuery, filterAgent, filterStatus, sortBy])

  const handleBatchAssign = async () => {
    if (!selectedAgent) {
      setAssignResult({ success: false, error: 'Please select an agent' })
      return
    }

    const count = assignCount === '' ? 'all' : parseInt(assignCount)

    if (count !== 'all' && (isNaN(count as number) || (count as number) <= 0)) {
      setAssignResult({ success: false, error: 'Please enter a valid number' })
      return
    }

    setIsAssigning(true)
    setAssignResult(null)

    const result = await batchAssignLeads(campaign.id, selectedAgent, organizationId, count)

    setIsAssigning(false)
    setAssignResult(result)

    if (result.success) {
      router.refresh()
      setSelectedAgent('')
      setAssignCount('')
    }
  }

  const handleAutoDistribute = async () => {
    if (!confirm('Auto-distribute all unassigned leads evenly across all agents?')) {
      return
    }

    setIsAssigning(true)
    setAssignResult(null)

    const result = await autoDistributeLeads(campaign.id, organizationId)

    setIsAssigning(false)
    setAssignResult(result)

    if (result.success) {
      router.refresh()
    }
  }

  const handleReassignSingle = async (leadId: string, newAgentId: string) => {
    const result = await reassignLead(leadId, newAgentId, organizationId)

    if (result.success) {
      router.refresh()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleBulkReassign = async () => {
    if (selectedLeads.size === 0) {
      alert('Please select leads to reassign')
      return
    }

    if (!reassignToAgent) {
      alert('Please select an agent')
      return
    }

    const result = await bulkReassignLeads(
      Array.from(selectedLeads),
      reassignToAgent,
      organizationId
    )

    if (result.success) {
      setShowReassignDialog(false)
      setSelectedLeads(new Set())
      setReassignToAgent('')
      router.refresh()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeads)
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId)
    } else {
      newSelection.add(leadId)
    }
    setSelectedLeads(newSelection)
  }

  const toggleAllLeads = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)))
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-purple-100 text-purple-800',
      interested: 'bg-green-100 text-green-800',
      qualified: 'bg-emerald-100 text-emerald-800',
      not_interested: 'bg-red-100 text-red-800',
      converted: 'bg-yellow-100 text-yellow-800',
      lost: 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getLastNote = (lead: Lead) => {
    const noteActivity = lead.activities
      ?.filter(a => a.type === 'note')
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    if (!noteActivity) return null

    return noteActivity.content.length > 50
      ? noteActivity.content.substring(0, 50) + '...'
      : noteActivity.content
  }

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead)
    setShowDetailModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.assigned} assigned • {stats.unassigned} unassigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unassigned}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.unassigned / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact Rate</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contactRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.contacted} of {stats.total} contacted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.callsMade}</div>
            <p className="text-xs text-muted-foreground">
              Avg {stats.total > 0 ? (stats.callsMade / stats.total).toFixed(1) : 0} per lead
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Assignment Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Assignment</CardTitle>
          <CardDescription>
            Assign unassigned leads to agents in bulk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Select Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.full_name} ({agentLeadCounts[agent.id] || 0} leads)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of Leads</Label>
              <Input
                type="number"
                placeholder="Leave empty for all"
                value={assignCount}
                onChange={(e) => setAssignCount(e.target.value)}
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                {stats.unassigned} unassigned available
              </p>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={handleBatchAssign}
                disabled={isAssigning || !selectedAgent}
                className="w-full"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign Leads
                  </>
                )}
              </Button>
            </div>
          </div>

          {assignResult && (
            <Alert variant={assignResult.success ? 'default' : 'destructive'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{assignResult.message || assignResult.error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={handleAutoDistribute}
              disabled={isAssigning || stats.unassigned === 0}
              className="flex-1"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Auto-Distribute All
            </Button>

            <Link href={`/dashboard/management/leads/import?campaign=${campaign.id}`}>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import Leads
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Lead Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>
            View and manage all leads in this campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedLeads.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {selectedLeads.size} lead(s) selected
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReassignDialog(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reassign Selected
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedLeads(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Label className="text-sm">Sort by:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Added</SelectItem>
                <SelectItem value="last_contact">Last Contact</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleAllLeads}
                    >
                      {selectedLeads.size === filteredLeads.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLeadSelection(lead.id)}
                        >
                          {selectedLeads.has(lead.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {lead.first_name} {lead.last_name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{lead.phone}</div>
                          {lead.email && (
                            <div className="text-muted-foreground">{lead.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{lead.company || '-'}</div>
                          {lead.job_title && (
                            <div className="text-muted-foreground">{lead.job_title}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.profiles ? (
                          <div className="text-sm">{lead.profiles.full_name}</div>
                        ) : (
                          <Badge variant="outline">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>
                        {lead.last_contacted_at ? (
                          <div className="text-sm">
                            {formatDate(lead.last_contacted_at)}
                            <div className="text-muted-foreground">
                              {lead.calls?.length || 0} calls
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-[150px] truncate">
                          {getLastNote(lead) || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openLeadDetail(lead)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Reassign Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Selected Leads</DialogTitle>
            <DialogDescription>
              Reassign {selectedLeads.size} lead(s) to a new agent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Agent</Label>
              <Select value={reassignToAgent} onValueChange={setReassignToAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.full_name} ({agentLeadCounts[agent.id] || 0} leads)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReassignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkReassign} disabled={!reassignToAgent}>
              Reassign Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLead.first_name} {selectedLead.last_name}
              </DialogTitle>
              <DialogDescription>
                Lead Details and Activity History
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-sm">{selectedLead.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm">{selectedLead.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                  <p className="text-sm">{selectedLead.company || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Job Title</Label>
                  <p className="text-sm">{selectedLead.job_title || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Score</Label>
                  <p className="text-sm font-bold">{selectedLead.score}</p>
                </div>
              </div>

              {/* Assignment */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assigned Agent</Label>
                <div className="flex items-center gap-2">
                  {selectedLead.profiles ? (
                    <>
                      <p className="text-sm flex-1">{selectedLead.profiles.full_name}</p>
                      <Select
                        value=""
                        onValueChange={(value) => {
                          handleReassignSingle(selectedLead.id, value)
                          setShowDetailModal(false)
                        }}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Reassign" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents
                            .filter(a => a.id !== selectedLead.assigned_agent_id)
                            .map(agent => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.full_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <Badge variant="outline">Unassigned</Badge>
                  )}
                </div>
              </div>

              {/* Call History */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Call History ({selectedLead.calls?.length || 0})</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedLead.calls && selectedLead.calls.length > 0 ? (
                    selectedLead.calls
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((call) => (
                        <div key={call.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">
                            {call.outcome?.replace('_', ' ') || 'No outcome'}
                          </span>
                          <span className="text-muted-foreground">
                            {formatDate(call.created_at)}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No calls yet</p>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Activity Timeline ({selectedLead.activities?.length || 0})</Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {selectedLead.activities && selectedLead.activities.length > 0 ? (
                    selectedLead.activities
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                          <div className="mt-1">
                            {activity.type === 'call' && <Phone className="h-4 w-4 text-blue-600" />}
                            {activity.type === 'note' && <MessageSquare className="h-4 w-4 text-purple-600" />}
                            {activity.type === 'assignment' && <UserCheck className="h-4 w-4 text-green-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.content}</p>
                            {activity.metadata?.outcome && (
                              <Badge variant="outline" className="mt-1">
                                {activity.metadata.outcome}
                              </Badge>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No activity yet</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
