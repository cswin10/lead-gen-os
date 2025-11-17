'use client'

import { useEffect, useState, memo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Mail, Building2, Briefcase, Clock } from 'lucide-react'
import { formatPhoneNumber, formatDateTime } from '@/lib/utils'

export interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  job_title: string
  status: string
  last_contacted_at: string
  next_follow_up_at: string
  campaigns: {
    name: string
  }
}

interface LeadsListProps {
  agentId: string
  onLeadSelect?: (lead: Lead | null) => void
}

function LeadsList({ agentId, onLeadSelect }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    async function fetchLeads() {
      const supabase = createClient()

      const { data } = await supabase
        .from('leads')
        .select(`
          *,
          campaigns(name)
        `)
        .eq('assigned_agent_id', agentId)
        .in('status', ['new', 'contacted', 'qualified', 'interested'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(20)

      if (data) {
        setLeads(data as any)
        if (data.length > 0 && !selectedLead) {
          setSelectedLead(data[0] as any)
        }
      }

      setLoading(false)
    }

    fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'default'
      case 'contacted':
        return 'secondary'
      case 'qualified':
        return 'success'
      case 'interested':
        return 'warning'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Leads</CardTitle>
          <CardDescription>No leads assigned yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Check back later for new leads to contact
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Leads Queue</CardTitle>
        <CardDescription>
          {leads.length} leads waiting for contact
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => {
                setSelectedLead(lead)
                onLeadSelect?.(lead)
              }}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedLead?.id === lead.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-accent'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">
                    {lead.first_name} {lead.last_name}
                  </h4>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                    {lead.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {lead.company}
                      </span>
                    )}
                    {lead.job_title && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {lead.job_title}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={getStatusColor(lead.status) as any}>
                  {lead.status}
                </Badge>
              </div>
              
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {formatPhoneNumber(lead.phone)}
                </span>
                {lead.email && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {lead.email}
                  </span>
                )}
              </div>
              
              {lead.last_contacted_at && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last contacted: {formatDateTime(lead.last_contacted_at)}
                </div>
              )}
              
              {lead.campaigns && (
                <div className="mt-2 text-xs">
                  <Badge variant="outline">{lead.campaigns.name}</Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default memo(LeadsList)
