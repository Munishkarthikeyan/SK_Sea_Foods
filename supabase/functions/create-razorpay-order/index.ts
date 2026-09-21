// Supabase Edge Function: create-razorpay-order
// Called from the checkout page before opening the Razorpay payment popup.
// Creates an order on Razorpay's side (server-to-server, using the secret key)
// and returns just the order id/amount the client needs -- the secret key
// never touches the browser.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { amount } = await req.json() // amount in rupees

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: 'Razorpay keys not configured' }), {
        status: 500,
        headers: CORS_HEADERS,
      })
    }

    const auth = btoa(`${keyId}:${keySecret}`)
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Razorpay wants paise, not rupees
        currency: 'INR',
        receipt: `order_${Date.now()}`,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 500, headers: CORS_HEADERS })
    }

    return new Response(
      JSON.stringify({ id: data.id, amount: data.amount, currency: data.currency }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
})
