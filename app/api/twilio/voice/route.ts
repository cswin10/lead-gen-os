import { NextResponse } from 'next/server'
import twilio from 'twilio'

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const to = formData.get('To') as string

    // Create TwiML response
    const response = new VoiceResponse()

    if (to) {
      // Dial the number
      const dial = response.dial({
        callerId: process.env.TWILIO_PHONE_NUMBER,
        timeout: 30,
        record: 'record-from-answer-dual', // Optional: record calls
      })
      dial.number(to)
    } else {
      // No number provided
      response.say('No number provided. Please try again.')
    }

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
    response.say('An error occurred. Please try again.')

    return new NextResponse(response.toString(), {
      status: 500,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}
