'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Mail, Building2, Briefcase, Clock, Flame, Snowflake, Wind, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  job_title: string
  status: string
  priority: number
  score: number
  last_contacted_at: string | null
  next_follow_up_at: string | null
  created_at: string
  campaigns: {
    name: string
  } | null
  clients: {
    company_name: string
  } | null
}

interface LeadQueueProps {
  agentId: string
  onLeadSelect: (lead: Lead) => void
  selectedLead: Lead | null
}

export default function LeadQueue({ agentId, onLeadSelect, selectedLead }: LeadQueueProps) {
  const [leads, setLeads] = useState<{
    newToday: Lead[]
    followUps: Lead[]
    callbacks: Lead[]
    unresponsive: Lead[]
  }>({
    newToday: [],
    followUps: [],
    callbacks: [],
    unresponsive: []
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('newToday')

  useEffect(() => {
    fetchLeads()
  }, [agentId])

  async function fetchLeads() {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Fetch all leads assigned to agent
    const { data: allLeads } = await supabase
      .from('leads')
      .select(`
        *,
        campaigns(name),
        clients(company_name)
      `)
      .eq('assigned_agent_id', agentId)
      .not('status', 'in', '(converted,lost,not_interested)')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (!allLeads) {
      setLoading(false)
      return
    }

    // Categorize leads
    const newToday = allLeads.filter(lead =>
      lead.status === 'new' &&
      new Date(lead.created_at).toISOString().split('T')[0] === today
    )

    const callbacks = allLeads.filter(lead =>
      lead.next_follow_up_at &&
      new Date(lead.next_follow_up_at).toISOString().split('T')[0] <= today
    )

    const followUps = allLeads.filter(lead =>
      lead.status === 'contacted' &&
      !lead.next_follow_up_at &&
      lead.last_contacted_at
    )

    const unresponsive = allLeads.filter(lead =>
      lead.status === 'contacted' &&
      lead.last_contacted_at &&
      !lead.next_follow_up_at &&
      new Date(lead.last_contacted_at) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    )

    setLeads({
      newToday: newToday as Lead[],
      followUps: followUps as Lead[],
      callbacks: callbacks as Lead[],
      unresponsive: unresponsive as Lead[]
    })

    // Auto-select first lead if none selected
    if (!selectedLead) {
      const firstLead = newToday[0] || callbacks[0] || followUps[0] || unresponsive[0]
      if (firstLead) {
        onLeadSelect(firstLead as Lead)
      }
    }

    setLoading(false)
  }

  function getHeatIndicator(lead: Lead) {
    // Hot: high score, recent activity
    if (lead.score >= 70 || lead.next_follow_up_at) {
      return { icon: Flame, color: 'text-red-500', label: 'Hot' }
    }
    // Warm: medium score
    if (lead.score >= 40) {
      return { icon: Wind, color: 'text-orange-500', label: 'Warm' }
    }
    // Cold: low score or no recent activity
    return { icon: Snowflake, color: 'text-blue-500', label: 'Cold' }
  }

  function handleNextLead() {
    const allCurrentLeads = leads[activeTab as keyof typeof leads]
    if (!allCurrentLeads.length) return

    const currentIndex = allCurrentLeads.findIndex(l => l.id === selectedLead?.id)
    const nextIndex = (currentIndex + 1) % allCurrentLeads.length
    onLeadSelect(allCurrentLeads[nextIndex])
  }

  function renderLeadCard(lead: Lead) {
    const heat = getHeatIndicator(lead)
    const HeatIcon = heat.icon

    return (
      <div
        key={lead.id}
        onClick={() => onLeadSelect(lead)}
        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
          selectedLead?.id === lead.id
            ? 'border-primary bg-primary/5 shadow-md'
            : 'hover:bg-accent'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">
                {lead.first_name} {lead.last_name}
              </h4>
              <HeatIcon className={`h-4 w-4 ${heat.color}`} />
            </div>
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
          <Badge variant={
            lead.status === 'new' ? 'default' :
            lead.status === 'qualified' ? 'success' :
            lead.status === 'interested' ? 'warning' :
            'secondary'
          }>
            {lead.status}
          </Badge>
        </div>

        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            {lead.phone}
          </span>
          {lead.email && (
            <span className="flex items-center gap-1 text-muted-foreground truncate">
              <Mail className="h-3 w-3" />
              {lead.email}
            </span>
          )}
        </div>

        {lead.last_contacted_at && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last: {formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true })}
          </div>
        )}

        {lead.next_follow_up_at && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              Follow-up: {new Date(lead.next_follow_up_at).toLocaleDateString()}
            </Badge>
          </div>
        )}

        {lead.campaigns && (
          <div className="mt-2 text-xs">
            <Badge variant="outline">{lead.campaigns.name}</Badge>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading leads...</p>
        </CardContent>
      </Card>
    )
  }

  const totalLeads = leads.newToday.length + leads.followUps.length + leads.callbacks.length + leads.unresponsive.length

  if (totalLeads === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Queue</CardTitle>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lead Queue</CardTitle>
            <CardDescription>{totalLeads} leads to contact</CardDescription>
          </div>
          <Button onClick={handleNextLead} variant="outline" size="sm">
            Next Lead <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="newToday" className="relative">
              New Today
              {leads.newToday.length > 0 && (
                <Badge className="ml-2" variant="default">{leads.newToday.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="callbacks" className="relative">
              Callbacks
              {leads.callbacks.length > 0 && (
                <Badge className="ml-2" variant="destructive">{leads.callbacks.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="followUps" className="relative">
              Follow-Ups
              {leads.followUps.length > 0 && (
                <Badge className="ml-2" variant="secondary">{leads.followUps.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unresponsive" className="relative">
              Unresponsive
              {leads.unresponsive.length > 0 && (
                <Badge className="ml-2" variant="outline">{leads.unresponsive.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="newToday" className="space-y-3 mt-4">
            {leads.newToday.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No new leads today
              </p>
            ) : (
              leads.newToday.map(renderLeadCard)
            )}
          </TabsContent>

          <TabsContent value="callbacks" className="space-y-3 mt-4">
            {leads.callbacks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No callbacks scheduled
              </p>
            ) : (
              leads.callbacks.map(renderLeadCard)
            )}
          </TabsContent>

          <TabsContent value="followUps" className="space-y-3 mt-4">
            {leads.followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No follow-ups needed
              </p>
            ) : (
              leads.followUps.map(renderLeadCard)
            )}
          </TabsContent>

          <TabsContent value="unresponsive" className="space-y-3 mt-4">
            {leads.unresponsive.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No unresponsive leads
              </p>
            ) : (
              leads.unresponsive.map(renderLeadCard)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
