'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Phone, Mail, Building2, Briefcase, Clock,
  MessageSquare, User, Award, Calendar,
  Flame, Snowflake, Wind, StickyNote
} from 'lucide-react'
import { addLeadNote } from '@/app/actions/leads'
import { formatDistanceToNow } from 'date-fns'
import { Lead } from './lead-queue'

interface Activity {
  id: string
  type: string
  content: string
  created_at: string
  metadata?: any
  profiles?: {
    first_name: string
    last_name: string
  }
}

interface LeadDetailPanelProps {
  lead: Lead | null
  agentId: string
  organizationId: string
}

export default function LeadDetailPanel({ lead, agentId, organizationId }: LeadDetailPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (lead) {
      fetchActivities()
    }
  }, [lead?.id])

  async function fetchActivities() {
    if (!lead) return

    setLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('activities')
      .select(`
        *,
        profiles(first_name, last_name)
      `)
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setActivities(data as Activity[])
    }
    setLoading(false)
  }

  async function handleAddNote() {
    if (!lead || !note.trim() || saving) return

    setSaving(true)
    const result = await addLeadNote(lead.id, agentId, organizationId, note)

    if (result.success) {
      setNote('')
      fetchActivities()
    } else {
      alert('Error adding note: ' + result.error)
    }
    setSaving(false)
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'note':
        return <StickyNote className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'meeting':
        return <Calendar className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  function getHeatIndicator(lead: Lead) {
    if (lead.score >= 70) {
      return { icon: Flame, color: 'text-red-500 bg-red-100', label: 'Hot Lead' }
    }
    if (lead.score >= 40) {
      return { icon: Wind, color: 'text-orange-500 bg-orange-100', label: 'Warm Lead' }
    }
    return { icon: Snowflake, color: 'text-blue-500 bg-blue-100', label: 'Cold Lead' }
  }

  if (!lead) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Details</CardTitle>
          <CardDescription>Select a lead to view details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lead selected</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const heat = getHeatIndicator(lead)
  const HeatIcon = heat.icon

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">
              {lead.first_name} {lead.last_name}
            </CardTitle>
            <CardDescription className="mt-1">
              Lead Details & Activity
            </CardDescription>
          </div>
          <div className={`p-2 rounded-lg ${heat.color}`}>
            <HeatIcon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Lead Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{lead.company || 'No company'}</span>
          </div>
          {lead.job_title && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{lead.job_title}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{lead.phone}</span>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Status & Score */}
        <div className="flex gap-2 pb-3 border-b">
          <Badge variant={
            lead.status === 'new' ? 'default' :
            lead.status === 'qualified' ? 'success' :
            lead.status === 'interested' ? 'warning' :
            'secondary'
          }>
            {lead.status}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            Score: {lead.score || 0}
          </Badge>
          <Badge variant="outline">{heat.label}</Badge>
        </div>

        {/* Campaign & Client */}
        {(lead.campaigns || lead.clients) && (
          <div className="text-sm space-y-1 pb-3 border-b">
            {lead.campaigns && (
              <div className="text-muted-foreground">
                Campaign: <span className="font-medium text-foreground">{lead.campaigns.name}</span>
              </div>
            )}
            {lead.clients && (
              <div className="text-muted-foreground">
                Client: <span className="font-medium text-foreground">{lead.clients.company_name}</span>
              </div>
            )}
          </div>
        )}

        {/* Last Contacted */}
        {lead.last_contacted_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pb-3 border-b">
            <Clock className="h-4 w-4" />
            Last contacted {formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true })}
          </div>
        )}

        {/* Next Follow-up */}
        {lead.next_follow_up_at && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-900">
              <Calendar className="h-4 w-4" />
              Follow-up scheduled
            </div>
            <div className="text-sm text-yellow-700 mt-1">
              {new Date(lead.next_follow_up_at).toLocaleString()}
            </div>
          </div>
        )}

        {/* Add Note */}
        <div className="space-y-2 pb-3 border-b">
          <label className="text-sm font-medium">Add Quick Note</label>
          <Textarea
            placeholder="Type a note about this lead..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-20 resize-none"
            disabled={saving}
          />
          <Button
            size="sm"
            onClick={handleAddNote}
            disabled={!note.trim() || saving}
            className="w-full"
          >
            <StickyNote className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Add Note'}
          </Button>
        </div>

        {/* Activity Timeline */}
        <div className="flex-1 flex flex-col min-h-0">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Timeline
          </h4>
          <ScrollArea className="flex-1 pr-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading activity...</p>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm break-words">{activity.content}</p>
                      {activity.metadata?.outcome && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Outcome: {activity.metadata.outcome}
                          </Badge>
                        </div>
                      )}
                      {activity.metadata?.duration && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Duration: {Math.floor(activity.metadata.duration / 60)}m {activity.metadata.duration % 60}s
                        </p>
                      )}
                      {activity.profiles && (
                        <p className="text-xs text-muted-foreground mt-1">
                          by {activity.profiles.first_name} {activity.profiles.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
