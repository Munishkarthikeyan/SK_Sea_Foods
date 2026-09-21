// Supabase Edge Function: verify-razorpay-payment
// Called from the checkout page right after the customer completes payment
// in the Razorpay popup. Verifies the payment signature server-side (so a
// customer can't fake a "successful payment"), then saves the order using
// the service role key -- this is the ONE place it's safe to bypass RLS,
// because we've just cryptographically confirmed real money was received.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hmacSha256Hex(secret: string, message: string) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order, // { id, customer_name, phone, address, notes, total, items }
    } = body

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const expectedSignature = await hmacSha256Hex(
      keySecret,
      `${razorpay_order_id}|${razorpay_payment_id}`
    )

    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Payment signature verification failed' }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: orderError } = await supabase.from('orders').insert({
      id: order.id,
      customer_name: order.customer_name,
      phone: order.phone,
      address: order.address,
      notes: order.notes,
      total: order.total,
      status: 'new',
      items: order.items,
      payment_method: 'online',
      payment_status: 'paid',
      razorpay_order_id,
      razorpay_payment_id,
    })
    if (orderError) throw orderError

    const orderItems = order.items.map((i: { name: string; quantity_kg: number; price_per_kg: number }) => ({
      order_id: order.id,
      product_id: null,
      name: i.name,
      quantity_kg: i.quantity_kg,
      price_per_kg: i.price_per_kg,
    }))
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) throw itemsError

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
})
