// Supabase Edge Function: send-order-sms
// Called from the shop dashboard (Orders tab) when the shop owner clicks
// "Confirm" on an order. Sends a plain SMS to the customer's phone number
// via Twilio, letting them know their order is confirmed.
//
// This is intentionally a separate, general-purpose SMS function -- it does
// NOT reuse Supabase Auth's phone-login Twilio config (that one is internal
// to GoTrue and isn't callable from Edge Functions). You need your own
// Twilio Account SID / Auth Token / From-number (or Messaging Service SID)
// set as secrets for this function specifically -- see README for setup.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Best-effort normalize to E.164. Assumes India (+91) for bare 10-digit
// numbers, since the rest of the storefront is India-only (₹, Razorpay).
function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (raw.trim().startsWith('+')) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return `+91${digits}`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { phone, message } = await req.json()
    if (!phone || !message) {
      return new Response(JSON.stringify({ error: 'phone and message are required' }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    // Either a From number (E.164, e.g. +14155550123) or a Messaging Service SID works.
    const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER')
    const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID')

    if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
      return new Response(
        JSON.stringify({
          error:
            'Twilio secrets not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and either TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID.',
        }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    const to = toE164(String(phone))
    const auth = btoa(`${accountSid}:${authToken}`)

    const body = new URLSearchParams({ To: to, Body: String(message) })
    if (messagingServiceSid) {
      body.set('MessagingServiceSid', messagingServiceSid)
    } else {
      body.set('From', fromNumber!)
    }

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }
    )

    const data = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 500, headers: CORS_HEADERS })
    }

    return new Response(JSON.stringify({ ok: true, sid: data.sid }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
})