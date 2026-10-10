// Supabase Edge Function: notify-customer-status
// Called from the shop dashboard (OrdersPanel) whenever the owner changes an
// order's status. Emails the customer via Resend.
//
// Security: the caller must be signed in AND have role = 'owner' in `profiles`.
// (A plain anon-key call is rejected, so strangers can't email your customers.)
//
// Secrets needed (Supabase > Edge Functions > Secrets):
//   RESEND_API_KEY  -> from resend.com
//   FROM_EMAIL      -> e.g. "SK Sea Foods <orders@yourdomain.com>"
//                      (optional; defaults to Resend's test sender, which can
//                       only deliver to your own Resend account email)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// Escape user-provided text before putting it in HTML.
function esc(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  )
}

const STATUS_COPY: Record<string, { subject: string; headline: string; message: string }> = {
  confirmed: {
    subject: 'Your SK Sea Foods order is confirmed',
    headline: 'Order confirmed ✅',
    message: "Good news! We've confirmed your order and are getting your fresh catch ready.",
  },
  delivered: {
    subject: 'Your SK Sea Foods order was delivered',
    headline: 'Order delivered 🐟',
    message: 'Your order has been delivered. Thank you for shopping with us — enjoy your fresh catch!',
  },
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) return json({ error: 'RESEND_API_KEY not configured' }, 500)
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'SK Sea Foods <onboarding@resend.dev>'

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Only the signed-in shop owner may call this.
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) return json({ error: 'Not signed in' }, 401)

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()
    if (profile?.role !== 'owner') {
      return json({ error: 'Only the shop owner can send status emails' }, 403)
    }

    // 2. Read the request.
    const { customer_id, customer_name, status, items, total } = await req.json()
    const copy = STATUS_COPY[status]
    if (!customer_id || !copy) {
      return json({ ok: true, skipped: 'nothing to send for this status' })
    }

    // 3. Look up the customer's email (phone-OTP customers may not have one).
    const { data: customerData, error: customerError } = await admin.auth.admin.getUserById(customer_id)
    if (customerError) throw customerError
    const email = customerData.user?.email
    if (!email) return json({ ok: true, skipped: 'customer has no email' })

    // 4. Build the email.
    const itemRows = (Array.isArray(items) ? items : [])
      .map(
        (i: { name: string; quantity_kg: number; price_per_kg: number }) =>
          `<tr>
            <td style="padding:4px 0">${esc(i.name)} — ${esc(i.quantity_kg)} kg</td>
            <td style="padding:4px 0;text-align:right">₹${(Number(i.quantity_kg) * Number(i.price_per_kg)).toFixed(0)}</td>
          </tr>`
      )
      .join('')

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0F2A3D">
        <h2 style="margin-bottom:4px">${copy.headline}</h2>
        <p>Hi ${esc(customer_name)},</p>
        <p>${copy.message}</p>
        ${itemRows ? `<table style="width:100%;border-top:1px solid #ddd;margin-top:12px">${itemRows}</table>` : ''}
        <p style="border-top:1px solid #ddd;padding-top:8px;font-weight:bold">
          Total: ₹${Number(total ?? 0).toFixed(0)}
        </p>
        <p style="font-size:12px;color:#6A8FA0">SK Sea Foods — fresh catch, straight to your door</p>
      </div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromEmail, to: [email], subject: copy.subject, html }),
    })
    const result = await res.json()
    if (!res.ok) return json({ error: result }, 500)

    return json({ ok: true, id: result.id })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})