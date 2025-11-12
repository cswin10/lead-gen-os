'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Target, Pause, Play } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  description: string
  status: string
  target_leads: number
  budget: number
  start_date: string
  end_date: string
  clients: { id: string, company_name: string }
  leads: { count: number }[]
}

interface Client {
  id: string
  company_name: string
}

export default function CampaignList({ 
  campaigns: initialCampaigns, 
  clients,
  organizationId,
  userId
}: { 
  campaigns: Campaign[]
  clients: Client[]
  organizationId: string
  userId: string
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [isOpen, setIsOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    description: '',
    target_leads: '',
    budget: '',
    start_date: '',
    end_date: '',
  })

  const supabase = createClient()

  const resetForm = () => {
    setFormData({
      client_id: '',
      name: '',
      description: '',
      target_leads: '',
      budget: '',
      start_date: '',
      end_date: '',
    })
    setEditingCampaign(null)
  }

  const handleAdd = () => {
    resetForm()
    setIsOpen(true)
  }

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setFormData({
      client_id: campaign.clients.id,
      name: campaign.name,
      description: campaign.description || '',
      target_leads: campaign.target_leads?.toString() || '',
      budget: campaign.budget?.toString() || '',
      start_date: campaign.start_date || '',
      end_date: campaign.end_date || '',
    })
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const campaignData = {
        client_id: formData.client_id,
        name: formData.name,
        description: formData.description,
        target_leads: parseInt(formData.target_leads),
        budget: parseFloat(formData.budget),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      }

      if (editingCampaign) {
        // Update
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id)

        if (error) throw error

        // Refresh the list
        window.location.reload()
      } else {
        // Create
        const { error } = await supabase
          .from('campaigns')
          .insert({
            ...campaignData,
            organization_id: organizationId,
            status: 'draft',
            created_by: userId,
          })

        if (error) throw error

        // Refresh the list
        window.location.reload()
      }

      setIsOpen(false)
      resetForm()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCampaigns(campaigns.filter(c => c.id !== id))
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleToggleStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaign.id)

      if (error) throw error

      setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c))
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'paused':
        return 'warning'
      case 'completed':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{campaigns.length} campaigns total</p>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
                <DialogDescription>
                  {editingCampaign ? 'Update campaign details' : 'Set up a new lead generation campaign'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clients.length === 0 && (
                    <p className="text-xs text-muted-foreground">No clients available. Add a client first.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Q1 2025 Outreach"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the campaign goals..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_leads">Target Leads</Label>
                    <Input
                      id="target_leads"
                      type="number"
                      value={formData.target_leads}
                      onChange={(e) => setFormData({ ...formData, target_leads: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (£)</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="5000.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || clients.length === 0}>
                  {loading ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first campaign to start generating leads</p>
            <Button onClick={handleAdd} disabled={clients.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
            {clients.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Add a client first before creating campaigns</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {campaign.name}
                      <Badge variant={getStatusColor(campaign.status) as any}>
                        {campaign.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {campaign.clients?.company_name} {campaign.description && `• ${campaign.description}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(campaign)}
                    >
                      {campaign.status === 'active' ? (
                        <><Pause className="h-3 w-3 mr-1" /> Pause</>
                      ) : (
                        <><Play className="h-3 w-3 mr-1" /> Activate</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(campaign)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Leads</p>
                    <p className="text-2xl font-bold">
                      {campaign.leads?.[0]?.count || 0}
                      {campaign.target_leads && (
                        <span className="text-sm text-muted-foreground font-normal"> / {campaign.target_leads}</span>
                      )}
                    </p>
                  </div>
                  {campaign.budget && (
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="text-lg font-semibold">{formatCurrency(campaign.budget)}</p>
                    </div>
                  )}
                  {campaign.start_date && (
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium">{formatDate(campaign.start_date)}</p>
                    </div>
                  )}
                  {campaign.end_date && (
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p className="font-medium">{formatDate(campaign.end_date)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
