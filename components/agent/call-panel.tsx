'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneOff, Mic, MicOff, Clock, CheckCircle2, XCircle } from 'lucide-react'

export default function CallPanel({ agentId }: { agentId: string }) {
  const [isInCall, setIsInCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [notes, setNotes] = useState('')

  // In a real implementation, this would integrate with Twilio
  const handleStartCall = () => {
    setIsInCall(true)
    // Start call timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
    
    // Store timer ID for cleanup
    ;(window as any).callTimer = timer
  }

  const handleEndCall = () => {
    setIsInCall(false)
    clearInterval((window as any).callTimer)
    setCallDuration(0)
    setIsMuted(false)
  }

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleQuickAction = async (outcome: string) => {
    // In a real implementation, this would update the lead status
    console.log('Quick action:', outcome)
    alert(`Lead marked as: ${outcome}`)
  }

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Call Panel</CardTitle>
        <CardDescription>
          {isInCall ? 'Call in progress' : 'Ready to call'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Call Status */}
        <div className="text-center py-6">
          {isInCall ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4 animate-pulse">
                <Phone className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-2xl font-bold mb-2">{formatCallDuration(callDuration)}</div>
              <Badge variant="success">Active Call</Badge>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <Phone className="h-10 w-10 text-gray-400" />
              </div>
              <div className="text-sm text-muted-foreground">Click a lead to start calling</div>
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
              <Input
                placeholder="Type notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-20"
                as="textarea"
              />
            </div>
          </div>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleStartCall}
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
