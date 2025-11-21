import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

const AccessToken = twilio.jwt.AccessToken
const VoiceGrant = AccessToken.VoiceGrant

export async function GET(request: Request) {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Twilio credentials from environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const apiKey = process.env.TWILIO_API_KEY || accountSid
    const apiSecret = process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_TOKEN
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID

    // Debug logging (remove in production)
    console.log('Twilio Token Generation:', {
      accountSid: accountSid ? `${accountSid.substring(0, 10)}...` : 'missing',
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'missing',
      apiSecret: apiSecret ? 'set' : 'missing',
      twimlAppSid: twimlAppSid ? `${twimlAppSid.substring(0, 10)}...` : 'missing',
      identity: profile.id
    })

    if (!accountSid || !apiKey || !apiSecret) {
      console.error('Missing Twilio credentials:', { accountSid: !!accountSid, apiKey: !!apiKey, apiSecret: !!apiSecret })
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      )
    }

    if (!twimlAppSid) {
      console.error('TWILIO_TWIML_APP_SID not configured')
      return NextResponse.json(
        { error: 'Twilio TwiML App not configured' },
        { status: 500 }
      )
    }

    // Create an access token
    const token = new AccessToken(
      accountSid,
      apiKey,
      apiSecret,
      { identity: profile.id }
    )

    // Create a Voice grant
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    })

    // Add the grant to the token
    token.addGrant(voiceGrant)

    // Serialize the token to a JWT string
    const jwt = token.toJwt()

    console.log('Token generated successfully:', {
      identity: profile.id,
      tokenLength: jwt.length,
      tokenPrefix: jwt.substring(0, 20) + '...'
    })

    return NextResponse.json({
      token: jwt,
      identity: profile.id,
    })
  } catch (error: any) {
    console.error('Error generating Twilio token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token', details: error.message },
      { status: 500 }
    )
  }
}
