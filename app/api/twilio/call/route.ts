import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

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

    // Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      )
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken)

    // Make the call
    const call = await client.calls.create({
      to: phoneNumber,
      from: twilioPhoneNumber,
      // TwiML instructions - you can customize this or point to a TwiML app
      twiml: '<Response><Say>Connecting you now.</Say></Response>',
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/twilio/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    })

    // Log the call initiation in the database
    if (leadId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        await supabase.from('calls').insert({
          organization_id: profile.organization_id,
          lead_id: leadId,
          agent_id: user.id,
          phone_number: phoneNumber,
          direction: 'outbound',
          status: 'initiated',
          twilio_call_sid: call.sid,
        })
      }
    }

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
    })
  } catch (error: any) {
    console.error('Error making call:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate call' },
      { status: 500 }
    )
  }
}
