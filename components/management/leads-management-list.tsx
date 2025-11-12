'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Users, Search } from 'lucide-react'
import { formatPhoneNumber, formatDateTime } from '@/lib/utils'

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  job_title: string
  status: string
  campaigns: { name: string }
  clients: { company_name: string }
  profiles: { full_name: string }
}

export default function LeadsManagementList({ leads: initialLeads, campaigns, agents, organizationId }: any) {
  const [leads, setLeads] = useState(initialLeads)
  const [filteredLeads, setFilteredLeads] = useState(initialLeads)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isOpen, setIsOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    campaign_id: '',
    assigned_agent_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    status: 'new',
  })

  const supabase = createClient()

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    filterLeads(value, statusFilter)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    filterLeads(searchTerm, value)
  }

  const filterLeads = (search: string, status: string) => {
    let filtered = leads

    if (search) {
      filtered = filtered.filter((lead: Lead) =>
        lead.first_name.toLowerCase().includes(search.toLowerCase()) ||
        lead.last_name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.company?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status !== 'all') {
      filtered = filtered.filter((lead: Lead) => lead.status === status)
    }

    setFilteredLeads(filtered)
  }

  const resetForm = () => {
    setFormData({
      campaign_id: '',
      assigned_agent_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      job_title: '',
      status: 'new',
    })
    setEditingLead(null)
  }

  const handleAdd = () => {
    resetForm()
    setIsOpen(true)
  }

  const handleEdit = (lead: any) => {
    setEditingLead(lead)
    setFormData({
      campaign_id: lead.campaign_id || '',
      assigned_agent_id: lead.assigned_agent_id || '',
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email || '',
      phone: lead.phone,
      company: lead.company || '',
      job_title: lead.job_title || '',
      status: lead.status,
    })
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.campaign_id) {
        alert('Please select a campaign')
        setLoading(false)
        return
      }

      // Get client_id from campaign
      const campaign = campaigns.find((c: any) => c.id === formData.campaign_id)
      if (!campaign) {
        alert('Invalid campaign selected')
        setLoading(false)
        return
      }

      const leadData = {
        campaign_id: formData.campaign_id,
        client_id: campaign.client_id,
        assigned_agent_id: formData.assigned_agent_id || null,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        job_title: formData.job_title,
        status: formData.status,
      }

      if (editingLead) {
        // Update
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editingLead.id)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('leads')
          .insert({
            ...leadData,
            organization_id: organizationId,
          })

        if (error) throw error
      }

      setIsOpen(false)
      resetForm()
      window.location.reload()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (error) throw error

      setLeads(leads.filter((l: Lead) => l.id !== id))
      setFilteredLeads(filteredLeads.filter((l: Lead) => l.id !== id))
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'default'
      case 'contacted': return 'secondary'
      case 'qualified': return 'success'
      case 'interested': return 'warning'
      case 'closed_won': return 'success'
      case 'closed_lost': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="not_interested">Not Interested</SelectItem>
            <SelectItem value="closed_won">Closed Won</SelectItem>
            <SelectItem value="closed_lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
                <DialogDescription>
                  {editingLead ? 'Update lead information' : 'Manually add a new lead'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign_id">Campaign *</Label>
                    <Select
                      value={formData.campaign_id}
                      onValueChange={(value) => setFormData({ ...formData, campaign_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((campaign: any) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name} ({campaign.clients?.company_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_agent_id">Assign to Agent</Label>
                    <Select
                      value={formData.assigned_agent_id}
                      onValueChange={(value) => setFormData({ ...formData, assigned_agent_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {agents.map((agent: any) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.full_name || agent.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="interested">Interested</SelectItem>
                      <SelectItem value="not_interested">Not Interested</SelectItem>
                      <SelectItem value="closed_won">Closed Won</SelectItem>
                      <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingLead ? 'Update Lead' : 'Add Lead'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredLeads.length} of {leads.length} leads
      </p>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No leads found</h3>
            <p className="text-sm text-muted-foreground mb-4">Add leads manually or import from CSV</p>
            <Button onClick={handleAdd} disabled={campaigns.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLeads.map((lead: any) => (
            <Card key={lead.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-5 gap-4">
                    <div>
                      <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                      {lead.company && <p className="text-sm text-muted-foreground">{lead.company}</p>}
                    </div>
                    <div>
                      <p className="text-sm">{formatPhoneNumber(lead.phone)}</p>
                      {lead.email && <p className="text-sm text-muted-foreground">{lead.email}</p>}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Campaign</p>
                      <p className="text-sm font-medium">{lead.campaigns?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Agent</p>
                      <p className="text-sm font-medium">{lead.profiles?.full_name || 'Unassigned'}</p>
                    </div>
                    <div>
                      <Badge variant={getStatusColor(lead.status) as any}>
                        {lead.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(lead)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(lead.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
