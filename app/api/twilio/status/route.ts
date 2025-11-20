import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const callSid = formData.get('CallSid') as string
    const callStatus = formData.get('CallStatus') as string
    const callDuration = formData.get('CallDuration') as string

    if (!callSid) {
      return NextResponse.json(
        { error: 'CallSid is required' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient()

    // Update the call status in the database
    const updateData: any = {
      status: callStatus,
    }

    if (callDuration) {
      updateData.duration_seconds = parseInt(callDuration, 10)
    }

    if (callStatus === 'completed') {
      updateData.outcome = 'completed'
    }

    await supabase
      .from('calls')
      .update(updateData)
      .eq('twilio_call_sid', callSid)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating call status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update call status' },
      { status: 500 }
    )
  }
}
