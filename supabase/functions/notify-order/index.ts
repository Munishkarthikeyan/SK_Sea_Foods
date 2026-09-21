// Supabase Edge Function: notify-order
// Triggered by a Database Webhook whenever a new row is inserted into "orders".
// Sends a Telegram message to the shop owner via a Telegram bot.

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json()
    const order = payload.record

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID')

    if (!botToken || !chatId) {
      return new Response(
        JSON.stringify({ error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID secret' }),
        { status: 500 }
      )
    }

    const itemLines = Array.isArray(order.items)
      ? order.items
          .map((i: { name: string; quantity_kg: number }) => `• ${i.name} — ${i.quantity_kg} kg`)
          .join('\n')
      : ''

    const paymentLine =
      order.payment_method === 'online'
        ? `💳 Paid online (₹${order.total})`
        : `💵 Cash/UPI on delivery`

    const message =
      `🐟 New order!\n` +
      `From: ${order.customer_name} (${order.phone})\n` +
      `Address: ${order.address}\n` +
      (itemLines ? `\nItems:\n${itemLines}\n` : '') +
      `\nTotal: ₹${order.total}\n` +
      `${paymentLine}\n` +
      (order.notes ? `Notes: ${order.notes}\n` : '') +
      `\nCheck /admin to confirm.`

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    })
    const result = await res.json()

    return new Response(JSON.stringify({ ok: true, telegram: result }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
