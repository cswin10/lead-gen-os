'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Phone, PhoneOff, Mic, MicOff,
  PhoneMissed, UserX, Clock,
  CheckCircle2, XCircle, Calendar, Award,
  MessageSquare, ArrowRight, AlertCircle
} from 'lucide-react'
import { handleCallOutcome } from '@/app/actions/leads'
import { useRouter } from 'next/navigation'
import { Lead } from './lead-queue'
import { Device, Call } from '@twilio/voice-sdk'

interface EnhancedCallPanelProps {
  agentId: string
  organizationId: string
  selectedLead: Lead | null
  onCallComplete?: () => void
}

export default function EnhancedCallPanel({
  agentId,
  organizationId,
  selectedLead,
  onCallComplete
}: EnhancedCallPanelProps) {
  const router = useRouter()
  const [isInCall, setIsInCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [notes, setNotes] = useState('')
  const [showCallbackPicker, setShowCallbackPicker] = useState(false)
  const [callbackDate, setCallbackDate] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
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
          const errorData = await response.json()
          console.error('Token fetch failed:', errorData)
          throw new Error(errorData.error || 'Failed to get Twilio token')
        }

        const data = await response.json()
        console.log('Token response:', { hasToken: !!data.token, identity: data.identity })

        if (!data.token) {
          throw new Error('No token returned from server')
        }

        const { token } = data

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
        const errorMsg = err?.message || err?.toString() || 'Failed to initialize calling'
        setError(errorMsg)
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
      setNotes('')
      setCallbackDate('')
      setShowCallbackPicker(false)

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

  const handleOutcome = async (outcome: string) => {
    if (!selectedLead || isProcessing) return

    // If callback or appointment, require date
    if ((outcome === 'callback' || outcome === 'appointment_set') && !callbackDate) {
      setShowCallbackPicker(true)
      return
    }

    setIsProcessing(true)

    // Disconnect Twilio call first
    if (currentCall) {
      currentCall.disconnect()
    }

    const result = await handleCallOutcome(
      selectedLead.id,
      agentId,
      organizationId,
      outcome,
      callDuration,
      notes,
      callbackDate || undefined
    )

    if (result.success) {
      // End call
      setIsInCall(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setCallDuration(0)
      setIsMuted(false)
      setNotes('')
      setCallbackDate('')
      setShowCallbackPicker(false)
      setCurrentCall(null)
      setIsProcessing(false)

      // Refresh and notify parent
      router.refresh()
      onCallComplete?.()
    } else {
      alert('Error: ' + result.error)
      setIsProcessing(false)
    }
  }

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    return tomorrow.toISOString().slice(0, 16)
  }

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Call Panel</CardTitle>
        <CardDescription>
          {isInCall
            ? 'Call in progress - Select an outcome'
            : selectedLead
              ? `Ready to call ${selectedLead.first_name}`
              : 'Select a lead to start calling'
          }
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
          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-lg">{selectedLead.first_name} {selectedLead.last_name}</p>
                <p className="text-sm text-muted-foreground">{selectedLead.phone}</p>
              </div>
              <Badge variant="outline">{selectedLead.company || 'No company'}</Badge>
            </div>
            {selectedLead.job_title && (
              <p className="text-sm text-muted-foreground">{selectedLead.job_title}</p>
            )}
          </div>
        )}

        {/* Call Status */}
        <div className="text-center py-6 bg-slate-50 rounded-lg">
          {isInCall ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4 animate-pulse">
                <Phone className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-3xl font-bold mb-2">{formatCallDuration(callDuration)}</div>
              <Badge variant="default" className="bg-green-600">Live Call</Badge>
              {selectedLead && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {selectedLead.first_name} {selectedLead.last_name}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <Phone className="h-10 w-10 text-gray-400" />
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedLead ? 'Ready to dial' : 'Select a lead from the queue'}
              </div>
            </>
          )}
        </div>

        {/* Call Controls */}
        {isInCall ? (
          <div className="space-y-4">
            {/* Basic Controls */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleToggleMute}
                disabled={isProcessing}
              >
                {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleOutcome('no_answer')}
                disabled={isProcessing}
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                End Call
              </Button>
            </div>

            {/* Call Notes */}
            <div>
              <Label className="text-sm font-medium mb-1">Call Notes</Label>
              <Textarea
                placeholder="What happened on this call?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-24 resize-none"
                disabled={isProcessing}
              />
            </div>

            {/* Callback Date Picker */}
            {showCallbackPicker && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-sm font-medium mb-2 block">Schedule Callback</Label>
                <Input
                  type="datetime-local"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                  min={getTomorrowDate()}
                  className="mb-2"
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (callbackDate) {
                      handleOutcome(showCallbackPicker ? 'callback' : 'appointment_set')
                    }
                  }}
                  disabled={!callbackDate || isProcessing}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Schedule
                </Button>
              </div>
            )}

            {/* Outcome Buttons */}
            {!showCallbackPicker && (
              <>
                <div className="pt-3 border-t">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                    ❌ No Contact Outcomes
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOutcome('no_answer')}
                      disabled={isProcessing}
                      className="justify-start"
                    >
                      <PhoneMissed className="h-4 w-4 mr-2" />
                      No Answer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOutcome('voicemail')}
                      disabled={isProcessing}
                      className="justify-start"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Voicemail
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOutcome('busy')}
                      disabled={isProcessing}
                      className="justify-start"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Busy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOutcome('wrong_number')}
                      disabled={isProcessing}
                      className="justify-start"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Wrong #
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOutcome('gatekeeper')}
                      disabled={isProcessing}
                      className="col-span-2 justify-start"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Gatekeeper
                    </Button>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                    ✅ Contacted Outcomes
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOutcome('connected')}
                      disabled={isProcessing}
                      className="justify-start border-blue-200 hover:bg-blue-50"
                    >
                      <Phone className="h-4 w-4 mr-2 text-blue-600" />
                      Connected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOutcome('interested')}
                      disabled={isProcessing}
                      className="justify-start border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      Interested
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOutcome('qualified')}
                      disabled={isProcessing}
                      className="justify-start border-emerald-200 hover:bg-emerald-50"
                    >
                      <Award className="h-4 w-4 mr-2 text-emerald-600" />
                      Qualified
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOutcome('not_interested')}
                      disabled={isProcessing}
                      className="justify-start border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2 text-red-600" />
                      Not Interested
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCallbackPicker(true)
                      }}
                      disabled={isProcessing}
                      className="justify-start border-purple-200 hover:bg-purple-50"
                    >
                      <Clock className="h-4 w-4 mr-2 text-purple-600" />
                      Callback
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCallbackPicker(true)
                      }}
                      disabled={isProcessing}
                      className="justify-start border-yellow-200 hover:bg-yellow-50"
                    >
                      <Calendar className="h-4 w-4 mr-2 text-yellow-600" />
                      Appointment
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <Button
              className="w-full"
              size="lg"
              onClick={handleStartCall}
              disabled={!selectedLead || !deviceReady}
            >
              <Phone className="h-5 w-5 mr-2" />
              {deviceReady ? 'Start Call' : 'Connecting...'}
            </Button>
            {selectedLead && deviceReady && (
              <p className="text-xs text-center text-muted-foreground">
                Click to dial {selectedLead.phone}
              </p>
            )}
          </>
        )}

        {/* Performance Tip */}
        <div className="pt-4 border-t">
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900">
              <strong>Pro Tip:</strong> Log every call with an outcome to build your pipeline and track progress
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
