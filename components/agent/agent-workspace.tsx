'use client'

import { useState } from 'react'
import LeadsList, { type Lead } from './leads-list'
import CallPanel from './call-panel'

interface AgentWorkspaceProps {
  agentId: string
  organizationId: string
}

export default function AgentWorkspace({ agentId, organizationId }: AgentWorkspaceProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <LeadsList agentId={agentId} onLeadSelect={setSelectedLead} />
      </div>

      <div>
        <CallPanel
          agentId={agentId}
          organizationId={organizationId}
          selectedLead={selectedLead}
        />
      </div>
    </div>
  )
}
