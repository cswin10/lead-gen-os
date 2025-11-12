'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Client {
  id: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  industry: string
  cost_per_lead: number
  is_active: boolean
}

export default function ClientList({ clients: initialClients, organizationId }: { clients: Client[], organizationId: string }) {
  const [clients, setClients] = useState(initialClients)
  const [isOpen, setIsOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    industry: '',
    cost_per_lead: '',
  })

  const supabase = createClient()

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      industry: '',
      cost_per_lead: '',
    })
    setEditingClient(null)
  }

  const handleAdd = () => {
    resetForm()
    setIsOpen(true)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      company_name: client.company_name,
      contact_name: client.contact_name || '',
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      industry: client.industry || '',
      cost_per_lead: client.cost_per_lead?.toString() || '',
    })
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingClient) {
        // Update
        const { error } = await supabase
          .from('clients')
          .update({
            company_name: formData.company_name,
            contact_name: formData.contact_name,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            industry: formData.industry,
            cost_per_lead: parseFloat(formData.cost_per_lead),
          })
          .eq('id', editingClient.id)

        if (error) throw error

        setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...formData, cost_per_lead: parseFloat(formData.cost_per_lead) } : c))
      } else {
        // Create
        const { data, error } = await supabase
          .from('clients')
          .insert({
            organization_id: organizationId,
            company_name: formData.company_name,
            contact_name: formData.contact_name,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            industry: formData.industry,
            cost_per_lead: parseFloat(formData.cost_per_lead),
            is_active: true,
          })
          .select()
          .single()

        if (error) throw error

        setClients([data, ...clients])
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
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated campaigns and leads.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error

      setClients(clients.filter(c => c.id !== id))
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleToggleActive = async (client: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: !client.is_active })
        .eq('id', client.id)

      if (error) throw error

      setClients(clients.map(c => c.id === client.id ? { ...c, is_active: !c.is_active } : c))
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{clients.length} clients total</p>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                <DialogDescription>
                  {editingClient ? 'Update client information' : 'Add a new company to generate leads for'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                      placeholder="Acme Corporation"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="Technology"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="john@acme.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="+44 20 7123 4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cost_per_lead">Cost Per Lead (£)</Label>
                    <Input
                      id="cost_per_lead"
                      type="number"
                      step="0.01"
                      value={formData.cost_per_lead}
                      onChange={(e) => setFormData({ ...formData, cost_per_lead: e.target.value })}
                      placeholder="25.00"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Get started by adding your first client</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {client.company_name}
                      {!client.is_active && <Badge variant="outline">Inactive</Badge>}
                    </CardTitle>
                    {client.industry && (
                      <CardDescription>{client.industry}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {client.contact_name && (
                    <p><span className="font-medium">Contact:</span> {client.contact_name}</p>
                  )}
                  {client.contact_email && (
                    <p className="text-muted-foreground">{client.contact_email}</p>
                  )}
                  {client.contact_phone && (
                    <p className="text-muted-foreground">{client.contact_phone}</p>
                  )}
                  {client.cost_per_lead && (
                    <p className="font-medium text-primary">
                      {formatCurrency(client.cost_per_lead)} per lead
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(client)}
                    className="flex-1"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(client)}
                  >
                    {client.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(client.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
