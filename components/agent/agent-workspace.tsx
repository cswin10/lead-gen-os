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
    <div className="space-y-4 lg:space-y-0 lg:grid lg:gap-6 lg:grid-cols-12">
      {/* Call Panel - First on mobile (most important action) */}
      <div className="lg:col-span-4 lg:order-3">
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

      {/* Lead Details - Second on mobile */}
      <div className="lg:col-span-4 lg:order-2">
        <LeadDetailPanel
          lead={selectedLead}
          agentId={agentId}
          organizationId={organizationId}
        />
      </div>

      {/* Lead Queue - Last on mobile (can scroll to find leads) */}
      <div className="lg:col-span-4 lg:order-1">
        <LeadQueue
          agentId={agentId}
          onLeadSelect={setSelectedLead}
          selectedLead={selectedLead}
        />
      </div>
    </div>
  )
}
