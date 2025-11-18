'use client'

import { useState } from 'react'
import LeadQueue, { type Lead } from './lead-queue'
import EnhancedCallPanel from './enhanced-call-panel'
import LeadDetailPanel from './lead-detail-panel'

interface AgentWorkspaceProps {
  agentId: string
  organizationId: string
}

export default function AgentWorkspace({ agentId, organizationId }: AgentWorkspaceProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
      {/* Lead Queue - Left Side */}
      <div className="lg:col-span-4">
        <LeadQueue
          agentId={agentId}
          onLeadSelect={setSelectedLead}
          selectedLead={selectedLead}
        />
      </div>

      {/* Lead Details - Middle */}
      <div className="lg:col-span-4">
        <LeadDetailPanel
          lead={selectedLead}
          agentId={agentId}
          organizationId={organizationId}
        />
      </div>

      {/* Call Panel - Right Side */}
      <div className="lg:col-span-4">
        <EnhancedCallPanel
          agentId={agentId}
          organizationId={organizationId}
          selectedLead={selectedLead}
          onCallComplete={() => {
            // Refresh lead queue after call
            window.location.reload()
          }}
        />
      </div>
    </div>
  )
}
