import { NextResponse } from 'next/server'
import twilio from 'twilio'

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const to = formData.get('To') as string
    const callRecordId = formData.get('CallRecordId') as string

    console.log('Voice webhook received:', {
      to,
      callRecordId,
      allParams: Object.fromEntries(formData.entries())
    })

    // Create TwiML response
    const response = new VoiceResponse()

    if (to) {
      // Get the app URL for status callbacks
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      // Dial the number with status callback
      const dial = response.dial({
        callerId: process.env.TWILIO_PHONE_NUMBER,
        timeout: 30,
        action: `${appUrl}/api/twilio/status`,
        method: 'POST',
      })
      dial.number({
        statusCallback: `${appUrl}/api/twilio/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
      }, to)
    } else {
      // No number provided
      response.say('No phone number provided. Please try again.')
    }

    console.log('TwiML response:', response.toString())

    // Return TwiML XML
    return new NextResponse(response.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('Error generating TwiML:', error)

    // Return error TwiML
    const response = new VoiceResponse()
    response.say('An error occurred while connecting your call. Please try again.')

    return new NextResponse(response.toString(), {
      status: 500,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}
