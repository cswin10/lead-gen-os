'use client'

import { useState, useRef, useEffect, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneOff, Mic, MicOff, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { updateLeadStatus, logCall } from '@/app/actions/leads'
import { useRouter } from 'next/navigation'

interface CallPanelProps {
  agentId: string
  organizationId: string
  selectedLead?: {
    id: string
    first_name: string
    last_name: string
    phone: string
  } | null
}

function CallPanel({ agentId, organizationId, selectedLead }: CallPanelProps) {
  const router = useRouter()
  const [isInCall, setIsInCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [notes, setNotes] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // In a real implementation, this would integrate with Twilio
  const handleStartCall = () => {
    setIsInCall(true)
    // Start call timer
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }

  const handleEndCall = async () => {
    if (!selectedLead) return

    setIsInCall(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Log the call in database
    await logCall(
      selectedLead.id,
      agentId,
      organizationId,
      callDuration,
      'completed',
      notes
    )

    setCallDuration(0)
    setIsMuted(false)
    setNotes('')
    router.refresh()
  }

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleQuickAction = async (outcome: string) => {
    if (!selectedLead) return

    let status = 'contacted'

    // Map outcomes to statuses
    switch (outcome) {
      case 'interested':
        status = 'interested'
        break
      case 'not_interested':
        status = 'not_interested'
        break
      case 'callback':
        status = 'callback'
        break
      case 'voicemail':
        status = 'contacted'
        break
      case 'qualified':
        status = 'qualified'
        break
    }

    // Update lead status
    const result = await updateLeadStatus(selectedLead.id, status, notes)

    if (result.success) {
      // Log the call
      await logCall(
        selectedLead.id,
        agentId,
        organizationId,
        callDuration,
        outcome,
        notes
      )

      // End the call and refresh
      setIsInCall(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setCallDuration(0)
      setIsMuted(false)
      setNotes('')
      router.refresh()
    }
  }

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Call Panel</CardTitle>
        <CardDescription>
          {isInCall ? 'Call in progress' : selectedLead ? `Ready to call ${selectedLead.first_name}` : 'Select a lead to start calling'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Lead Info */}
        {selectedLead && !isInCall && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-semibold">{selectedLead.first_name} {selectedLead.last_name}</p>
            <p className="text-sm text-muted-foreground">{selectedLead.phone}</p>
          </div>
        )}

        {/* Call Status */}
        <div className="text-center py-6">
          {isInCall ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4 animate-pulse">
                <Phone className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-2xl font-bold mb-2">{formatCallDuration(callDuration)}</div>
              <Badge variant="success">Active Call</Badge>
              {selectedLead && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Calling {selectedLead.first_name} {selectedLead.last_name}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <Phone className="h-10 w-10 text-gray-400" />
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedLead ? 'Ready to call' : 'Select a lead from the list'}
              </div>
            </>
          )}
        </div>

        {/* Call Controls */}
        {isInCall ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                End Call
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAction('interested')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Interested
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAction('not_interested')}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Not Interested
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAction('callback')}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Callback
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAction('voicemail')}
                >
                  Voicemail
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1 block">Call Notes</label>
              <Textarea
                placeholder="Type notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-20"
              />
            </div>
          </div>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleStartCall}
            disabled={!selectedLead}
          >
            <Phone className="h-5 w-5 mr-2" />
            Start Call
          </Button>
        )}

        {/* Performance Reminder */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: Aim for 50+ calls per day for best results
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default memo(CallPanel)
