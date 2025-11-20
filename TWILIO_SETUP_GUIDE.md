# Twilio Integration Setup Guide

This guide will walk you through setting up Twilio calling features in LeadGen OS.

## Prerequisites

- A Twilio account (sign up at https://www.twilio.com/try-twilio)
- A Twilio phone number

## Step 1: Get Your Twilio Credentials

1. Log in to the [Twilio Console](https://console.twilio.com)
2. From the dashboard, copy your **Account SID** and **Auth Token**
3. Add these to your `.env.local` file:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
```

## Step 2: Get a Twilio Phone Number

1. Go to **Phone Numbers** > **Manage** > **Buy a number**
2. Choose a phone number (voice-enabled)
3. Purchase the number
4. Add it to your `.env.local`:

```env
TWILIO_PHONE_NUMBER=+15551234567
```

## Step 3: Create a TwiML Application

A TwiML Application is required for browser-based calling:

1. Go to **Voice** > **TwiML** > **TwiML Apps** in the Twilio Console
2. Click **Create new TwiML App**
3. Set the following:
   - **Friendly Name**: "LeadGen OS Calling"
   - **Voice Request URL**: `https://your-domain.com/api/twilio/voice` (or `http://localhost:3000/api/twilio/voice` for development)
   - **Voice Method**: POST
4. Save the application
5. Copy the **TwiML App SID** (starts with `AP...`)
6. Add it to your `.env.local`:

```env
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 4: Configure Webhook URLs

For call status updates, Twilio needs to send webhooks to your application:

1. Make sure your application is accessible from the internet (use ngrok for local development)
2. Update your `.env.local` with your public URL:

```env
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
```

For local development with ngrok:
```bash
ngrok http 3000
# Copy the https URL from ngrok
```

Then update `.env.local`:
```env
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io
```

## Step 5: (Optional) Create API Keys

For better security, you can use API Keys instead of your Auth Token:

1. Go to **Account** > **API Keys & Tokens**
2. Create a new **Standard** API Key
3. Copy the **SID** and **Secret**
4. Add them to your `.env.local`:

```env
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret_here
```

## Step 6: Update Database Schema

Run the migration to add Twilio-specific fields to your database:

```sql
-- In your Supabase SQL Editor, run:
-- File: add-twilio-fields.sql
```

Copy and paste the contents of `add-twilio-fields.sql` into your Supabase SQL Editor and execute.

## Step 7: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Log in as an agent
3. Select a lead from the lead queue
4. Click "Start Call"
5. You should see "Connecting..." then "Start Call"
6. When you click Start Call, it should dial the lead's phone number

## Troubleshooting

### "Failed to get Twilio token"

- Check that `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set correctly
- Verify the values are from the correct Twilio account

### "Device error occurred"

- Check browser console for detailed error messages
- Ensure your browser allows microphone access
- Try using Chrome or Firefox (best supported)

### "Failed to initiate call"

- Verify `TWILIO_PHONE_NUMBER` is set and in E.164 format (+15551234567)
- Check that your Twilio account has sufficient credits
- Ensure the phone number you're calling is valid

### Calls not connecting

- Verify your TwiML App SID is correct
- Check that webhook URLs are accessible from the internet
- Review Twilio debugger logs: https://console.twilio.com/monitor/logs/debugger

### No call status updates

- Ensure `NEXT_PUBLIC_APP_URL` is set to your public URL
- For local dev, make sure ngrok is running and the URL is current
- Check that `/api/twilio/status` endpoint is accessible

## Call Flow

Here's what happens when an agent makes a call:

1. Agent clicks "Start Call"
2. Frontend requests access token from `/api/twilio/token`
3. Twilio Device SDK connects using the token
4. Frontend makes call through `/api/twilio/call` API
5. API initiates call via Twilio and logs it in database
6. Twilio connects the call
7. As call progresses, Twilio sends status updates to `/api/twilio/status`
8. Status updates are saved to the database
9. When call ends, duration and outcome are logged

## Security Notes

- **Never commit** your Auth Token or API Secret to git
- Use API Keys instead of Auth Token in production
- Set up proper CORS and authentication on webhook endpoints in production
- Rotate your credentials periodically
- Use environment variables for all sensitive data

## Cost Considerations

Twilio charges for:
- **Phone numbers**: ~$1/month per number
- **Outbound calls**: ~$0.013/min to US numbers (varies by destination)
- **Voice SDK usage**: Included with call minutes

Check current pricing: https://www.twilio.com/voice/pricing

## Production Checklist

Before going live:

- [ ] Use API Keys instead of Auth Token
- [ ] Set up proper webhook URL (HTTPS required)
- [ ] Add sufficient credits to Twilio account
- [ ] Set up usage alerts in Twilio Console
- [ ] Test calling to various phone numbers
- [ ] Configure call recording (if needed)
- [ ] Set up monitoring for failed calls
- [ ] Review Twilio's best practices: https://www.twilio.com/docs/voice/best-practices

## Additional Features

You can enhance the integration with:

- **Call Recording**: Enable in Twilio Console or via API
- **Call Transcription**: Use Twilio's transcription services
- **SMS Fallback**: Send SMS if call fails
- **Voicemail Detection**: Use Twilio's answering machine detection
- **Call Queue**: Implement automatic call distribution
- **Call Analytics**: Track call metrics and quality

## Support Resources

- Twilio Documentation: https://www.twilio.com/docs/voice
- Voice SDK Guide: https://www.twilio.com/docs/voice/sdks/javascript
- Community Forum: https://www.twilio.com/community
- Support: https://support.twilio.com
