import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phoneNumber, leadId } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify Twilio is configured
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
    if (!twilioPhoneNumber) {
      return NextResponse.json(
        { error: 'Twilio phone number not configured' },
        { status: 500 }
      )
    }

    // Create a pending call record in the database
    // The actual call will be initiated by the browser via Device.connect()
    // which goes through the TwiML App (/api/twilio/voice)
    let callId: string | null = null

    if (leadId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        const { data: callRecord, error: insertError } = await supabase
          .from('calls')
          .insert({
            organization_id: profile.organization_id,
            lead_id: leadId,
            agent_id: user.id,
            phone_number: phoneNumber,
            direction: 'outbound',
            status: 'pending',
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('Error creating call record:', insertError)
        } else {
          callId = callRecord?.id
        }
      }
    }

    // Return success - the browser will initiate the actual call
    // via Device.connect() which uses the TwiML App
    return NextResponse.json({
      success: true,
      callId,
      phoneNumber,
    })
  } catch (error: any) {
    console.error('Error preparing call:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to prepare call' },
      { status: 500 }
    )
  }
}

// Update call record with Twilio CallSid after browser connects
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { callId, twilioCallSid } = body

    if (!callId || !twilioCallSid) {
      return NextResponse.json(
        { error: 'callId and twilioCallSid are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update the call record with the Twilio CallSid
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        twilio_call_sid: twilioCallSid,
        status: 'initiated',
      })
      .eq('id', callId)
      .eq('agent_id', user.id)

    if (updateError) {
      console.error('Error updating call record:', updateError)
      return NextResponse.json(
        { error: 'Failed to update call record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating call:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update call' },
      { status: 500 }
    )
  }
}
