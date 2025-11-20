'use client'

import { useState, useRef, useEffect, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneOff, Mic, MicOff, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { updateLeadStatus, logCall } from '@/app/actions/leads'
import { useRouter } from 'next/navigation'
import { Device, Call } from '@twilio/voice-sdk'

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
  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null)
  const [currentCall, setCurrentCall] = useState<Call | null>(null)
  const [deviceReady, setDeviceReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Twilio Device
  useEffect(() => {
    let device: Device | null = null

    const initTwilio = async () => {
      try {
        // Get Twilio token from API
        const response = await fetch('/api/twilio/token')
        if (!response.ok) {
          throw new Error('Failed to get Twilio token')
        }

        const { token } = await response.json()

        // Create and setup Twilio Device
        device = new Device(token, {
          logLevel: 1,
          codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        })

        // Device event listeners
        device.on('registered', () => {
          console.log('Twilio Device Ready')
          setDeviceReady(true)
          setError(null)
        })

        device.on('error', (error) => {
          console.error('Twilio Device Error:', error)
          setError(error.message || 'Device error occurred')
          setDeviceReady(false)
        })

        device.on('incoming', (call) => {
          console.log('Incoming call:', call)
          // Handle incoming calls if needed
        })

        // Register the device
        await device.register()
        setTwilioDevice(device)
      } catch (err: any) {
        console.error('Failed to initialize Twilio:', err)
        setError(err.message || 'Failed to initialize calling')
        setDeviceReady(false)
      }
    }

    initTwilio()

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (device) {
        device.destroy()
      }
    }
  }, [])

  const handleStartCall = async () => {
    if (!selectedLead || !twilioDevice) return

    try {
      setError(null)

      // Make the call through API to track it
      const callResponse = await fetch('/api/twilio/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: selectedLead.phone,
          leadId: selectedLead.id,
        }),
      })

      if (!callResponse.ok) {
        throw new Error('Failed to initiate call')
      }

      const { callSid } = await callResponse.json()

      // Connect using Twilio Device
      const call = await twilioDevice.connect({
        params: {
          To: selectedLead.phone,
          CallSid: callSid,
        },
      })

      setCurrentCall(call)
      setIsInCall(true)

      // Start call timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)

      // Call event listeners
      call.on('accept', () => {
        console.log('Call accepted')
      })

      call.on('disconnect', () => {
        console.log('Call disconnected')
        handleCallDisconnected()
      })

      call.on('cancel', () => {
        console.log('Call cancelled')
        handleCallDisconnected()
      })
    } catch (err: any) {
      console.error('Failed to start call:', err)
      setError(err.message || 'Failed to start call')
      setIsInCall(false)
    }
  }

  const handleCallDisconnected = () => {
    setIsInCall(false)
    setCurrentCall(null)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleEndCall = async () => {
    if (!selectedLead) return

    // Disconnect Twilio call
    if (currentCall) {
      currentCall.disconnect()
    }

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
    setCurrentCall(null)
    router.refresh()
  }

  const handleToggleMute = () => {
    if (currentCall) {
      if (isMuted) {
        currentCall.mute(false)
        setIsMuted(false)
      } else {
        currentCall.mute(true)
        setIsMuted(true)
      }
    }
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
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Call Error</p>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {!deviceReady && !error && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">Connecting to phone system...</p>
          </div>
        )}

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
                onClick={handleToggleMute}
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
            disabled={!selectedLead || !deviceReady}
          >
            <Phone className="h-5 w-5 mr-2" />
            {deviceReady ? 'Start Call' : 'Connecting...'}
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
