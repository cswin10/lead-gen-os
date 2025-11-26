'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Mail, Building2, Briefcase, Clock, Flame, Snowflake, Wind, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
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

type TabKey = 'newToday' | 'callbacks' | 'followUps' | 'unresponsive'

const LEADS_PER_PAGE = 10

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
  const [activeTab, setActiveTab] = useState<TabKey>('newToday')
  const [visibleCounts, setVisibleCounts] = useState<Record<TabKey, number>>({
    newToday: LEADS_PER_PAGE,
    callbacks: LEADS_PER_PAGE,
    followUps: LEADS_PER_PAGE,
    unresponsive: LEADS_PER_PAGE
  })

  useEffect(() => {
    fetchLeads()
  }, [agentId])

  async function fetchLeads() {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Fetch all leads assigned to agent (showing ALL statuses for now)
    const { data: allLeads, error } = await supabase
      .from('leads')
      .select(`
        *,
        campaigns(name),
        clients(company_name)
      `)
      .eq('assigned_agent_id', agentId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching leads:', error)
      setLoading(false)
      return
    }

    if (!allLeads) {
      setLoading(false)
      return
    }

    // Categorize leads
    const newToday = allLeads.filter(lead =>
      lead.status === 'new'  // Show ALL new leads, not just today
    )

    const callbacks = allLeads.filter(lead =>
      lead.next_follow_up_at &&
      new Date(lead.next_follow_up_at).toISOString().split('T')[0] <= today
    )

    const followUps = allLeads.filter(lead =>
      (lead.status === 'contacted' || lead.status === 'interested' || lead.status === 'qualified') &&
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
    const allCurrentLeads = leads[activeTab]
    if (!allCurrentLeads.length) return

    const currentIndex = allCurrentLeads.findIndex(l => l.id === selectedLead?.id)
    const nextIndex = (currentIndex + 1) % allCurrentLeads.length
    onLeadSelect(allCurrentLeads[nextIndex])
  }

  function handleShowMore(tab: TabKey) {
    setVisibleCounts(prev => ({
      ...prev,
      [tab]: prev[tab] + LEADS_PER_PAGE
    }))
  }

  function handleShowLess(tab: TabKey) {
    setVisibleCounts(prev => ({
      ...prev,
      [tab]: LEADS_PER_PAGE
    }))
  }

  function renderLeadCard(lead: Lead) {
    const heat = getHeatIndicator(lead)
    const HeatIcon = heat.icon

    return (
      <div
        key={lead.id}
        onClick={() => onLeadSelect(lead)}
        className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
          selectedLead?.id === lead.id
            ? 'border-primary bg-primary/5 shadow-md'
            : 'hover:bg-accent'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold truncate">
                {lead.first_name} {lead.last_name}
              </h4>
              <HeatIcon className={`h-4 w-4 flex-shrink-0 ${heat.color}`} />
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
              {lead.company && (
                <span className="flex items-center gap-1 truncate max-w-[120px]">
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{lead.company}</span>
                </span>
              )}
              {lead.job_title && (
                <span className="flex items-center gap-1 truncate max-w-[120px] hidden sm:flex">
                  <Briefcase className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{lead.job_title}</span>
                </span>
              )}
            </div>
          </div>
          <Badge
            className="flex-shrink-0 ml-2 text-xs"
            variant={
              lead.status === 'new' ? 'default' :
              lead.status === 'qualified' ? 'default' :
              lead.status === 'interested' ? 'secondary' :
              'secondary'
            }
          >
            {lead.status}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </span>
          {lead.email && (
            <span className="flex items-center gap-1 text-muted-foreground truncate hidden sm:flex">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </span>
          )}
        </div>

        {lead.last_contacted_at && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 flex-shrink-0" />
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
            <Badge variant="outline" className="truncate max-w-full">{lead.campaigns.name}</Badge>
          </div>
        )}
      </div>
    )
  }

  function renderLeadList(tabLeads: Lead[], tabKey: TabKey, emptyMessage: string) {
    if (tabLeads.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-8">
          {emptyMessage}
        </p>
      )
    }

    const visibleLeads = tabLeads.slice(0, visibleCounts[tabKey])
    const hasMore = tabLeads.length > visibleCounts[tabKey]
    const isExpanded = visibleCounts[tabKey] > LEADS_PER_PAGE

    return (
      <>
        <div className="space-y-3">
          {visibleLeads.map(renderLeadCard)}
        </div>
        {(hasMore || isExpanded) && (
          <div className="flex justify-center gap-2 mt-4">
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShowMore(tabKey)}
                className="flex items-center gap-1"
              >
                <ChevronDown className="h-4 w-4" />
                Show more ({tabLeads.length - visibleCounts[tabKey]} remaining)
              </Button>
            )}
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShowLess(tabKey)}
                className="flex items-center gap-1"
              >
                <ChevronUp className="h-4 w-4" />
                Show less
              </Button>
            )}
          </div>
        )}
      </>
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

  const tabs: { key: TabKey; label: string; shortLabel: string; count: number; variant: 'default' | 'destructive' | 'secondary' | 'outline' }[] = [
    { key: 'newToday', label: 'New Leads', shortLabel: 'New', count: leads.newToday.length, variant: 'default' },
    { key: 'callbacks', label: 'Callbacks', shortLabel: 'Callback', count: leads.callbacks.length, variant: 'destructive' },
    { key: 'followUps', label: 'Follow-Ups', shortLabel: 'Follow', count: leads.followUps.length, variant: 'secondary' },
    { key: 'unresponsive', label: 'Unresponsive', shortLabel: 'Unresp.', count: leads.unresponsive.length, variant: 'outline' },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Lead Queue</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{totalLeads} leads to contact</CardDescription>
          </div>
          <Button onClick={handleNextLead} variant="outline" size="sm" className="hidden sm:flex">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button onClick={handleNextLead} variant="outline" size="icon" className="sm:hidden h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Tab buttons - responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-all ${
                activeTab === tab.key
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              }`}
            >
              <span className="text-xs sm:text-sm font-medium truncate w-full text-center">
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </span>
              {tab.count > 0 && (
                <Badge variant={tab.variant} className="mt-1 text-xs">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {activeTab === 'newToday' && renderLeadList(leads.newToday, 'newToday', 'No new leads')}
          {activeTab === 'callbacks' && renderLeadList(leads.callbacks, 'callbacks', 'No callbacks scheduled')}
          {activeTab === 'followUps' && renderLeadList(leads.followUps, 'followUps', 'No follow-ups needed')}
          {activeTab === 'unresponsive' && renderLeadList(leads.unresponsive, 'unresponsive', 'No unresponsive leads')}
        </div>
      </CardContent>
    </Card>
  )
}
