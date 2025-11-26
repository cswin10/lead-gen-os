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
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
    const apiKey = process.env.TWILIO_API_KEY?.trim()
    const apiSecret = process.env.TWILIO_API_SECRET?.trim()
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID?.trim()

    // Validate credential formats
    const validationErrors: string[] = []

    if (!accountSid) {
      validationErrors.push('TWILIO_ACCOUNT_SID is missing')
    } else if (!accountSid.startsWith('AC')) {
      validationErrors.push(`TWILIO_ACCOUNT_SID should start with 'AC', got '${accountSid.substring(0, 2)}...'`)
    }

    if (!apiKey) {
      validationErrors.push('TWILIO_API_KEY is missing')
    } else if (!apiKey.startsWith('SK')) {
      validationErrors.push(`TWILIO_API_KEY should start with 'SK', got '${apiKey.substring(0, 2)}...' - Make sure you're using an API Key, not Account SID`)
    }

    if (!apiSecret) {
      validationErrors.push('TWILIO_API_SECRET is missing')
    }

    if (!twimlAppSid) {
      validationErrors.push('TWILIO_TWIML_APP_SID is missing')
    } else if (!twimlAppSid.startsWith('AP')) {
      validationErrors.push(`TWILIO_TWIML_APP_SID should start with 'AP', got '${twimlAppSid.substring(0, 2)}...'`)
    }

    // Debug logging
    console.log('Twilio Token Generation:', {
      accountSid: accountSid ? `${accountSid.substring(0, 6)}...` : 'missing',
      apiKey: apiKey ? `${apiKey.substring(0, 6)}...` : 'missing',
      apiSecret: apiSecret ? `set (${apiSecret.length} chars)` : 'missing',
      twimlAppSid: twimlAppSid ? `${twimlAppSid.substring(0, 6)}...` : 'missing',
      identity: profile.id,
      validationErrors
    })

    if (validationErrors.length > 0) {
      console.error('Twilio credential validation failed:', validationErrors)
      return NextResponse.json(
        { error: 'Twilio configuration error', details: validationErrors },
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
