import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function Checkout() {
  const { lines, total, clearCart } = useCart()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')

  async function decrementStock() {
    // Best effort -- the order itself is already safely recorded by this
    // point, so a stock-sync hiccup here shouldn't stop the customer's order
    // from going through. We just log it for the shop owner to notice.
    const stockResults = await Promise.all(
      lines.map((l) =>
        supabase.rpc('decrement_product_stock', {
          p_product_id: l.product.id,
          p_quantity_kg: l.quantity_kg,
        })
      )
    )
    const stockError = stockResults.find((r) => r.error)?.error
    if (stockError) {
      // eslint-disable-next-line no-console
      console.error('Order placed, but stock update failed:', stockError.message)
    }
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  async function placeCodOrder(details: {
    customer_name: string
    phone: string
    address: string
    notes: string
  }) {
    const orderId = crypto.randomUUID()
    const itemsSummary = lines.map((l) => ({
      name: l.product.name,
      quantity_kg: l.quantity_kg,
      price_per_kg: l.product.price_per_kg,
    }))

    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      customer_id: session!.user.id,
      ...details,
      total,
      status: 'new',
      items: itemsSummary,
      payment_method: 'cod',
      payment_status: 'pending',
    })
    if (orderError) throw orderError

    const items = lines.map((l) => ({
      order_id: orderId,
      product_id: l.product.id,
      name: l.product.name,
      quantity_kg: l.quantity_kg,
      price_per_kg: l.product.price_per_kg,
    }))
    const { error: itemsError } = await supabase.from('order_items').insert(items)
    if (itemsError) throw itemsError

    await decrementStock()
  }

  async function placeOnlineOrder(details: {
    customer_name: string
    phone: string
    address: string
    notes: string
  }) {
    // 1. Ask our Edge Function to create a Razorpay order (server-side, keeps
    // the secret key off the browser)
    const { data: sessionData } = await supabase.auth.getSession()
    const createRes = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${sessionData.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ amount: total }),
      }
    )
    const razorpayOrder = await createRes.json()
    if (!createRes.ok) throw new Error(razorpayOrder.error || 'Could not start payment')

    const orderId = crypto.randomUUID()
    const itemsSummary = lines.map((l) => ({
      name: l.product.name,
      quantity_kg: l.quantity_kg,
      price_per_kg: l.product.price_per_kg,
    }))

    // 2. Open the Razorpay popup (covers UPI apps like Google Pay/PhonePe, cards, netbanking)
    await new Promise<void>((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Kadal Fresh',
        description: 'Fish order payment',
        order_id: razorpayOrder.id,
        prefill: {
          name: details.customer_name,
          contact: details.phone,
        },
        theme: { color: '#0F2A3D' },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            // 3. Verify the payment server-side and save the order
            const verifyRes = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-razorpay-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                  ...response,
                  order: { id: orderId, customer_id: session!.user.id, ...details, total, items: itemsSummary },
                }),
              }
            )
            const verifyResult = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verifyResult.error || 'Payment verification failed')
            resolve()
          } catch (err) {
            reject(err)
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
      })
      rzp.open()
    })

    await decrementStock()
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    const form = new FormData(e.currentTarget)
    const details = {
      customer_name: String(form.get('name') || ''),
      phone: String(form.get('phone') || ''),
      address: String(form.get('address') || ''),
      notes: String(form.get('notes') || ''),
    }

    try {
      if (paymentMethod === 'online') {
        await placeOnlineOrder(details)
      } else {
        await placeCodOrder(details)
      }
      clearCart()
      navigate('/order-confirmed')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong placing the order.')
    } finally {
      setSubmitting(false)
    }
  }

  if (lines.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-5 py-16 text-center text-tide-400">
        Your cart is empty.
      </main>
    )
  }

  return (
    <main className="max-w-lg mx-auto px-5 py-10">
      <h1 className="font-display text-2xl font-bold mb-2">Delivery details</h1>
      <p className="text-sm text-tide-400 mb-6">Total: ₹{total.toFixed(0)}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="name"
          required
          placeholder="Your name"
          className="border border-tide-900/20 px-3 py-2 bg-white"
        />
        <input
          name="phone"
          required
          placeholder="Phone number"
          className="border border-tide-900/20 px-3 py-2 bg-white"
        />
        <textarea
          name="address"
          required
          placeholder="Delivery address"
          rows={3}
          className="border border-tide-900/20 px-3 py-2 bg-white"
        />
        <textarea
          name="notes"
          placeholder="Notes (e.g. scale and clean the fish)"
          rows={2}
          className="border border-tide-900/20 px-3 py-2 bg-white"
        />

        <div className="flex flex-col gap-2 border border-tide-900/10 p-3">
          <p className="text-sm font-medium mb-1">How would you like to pay?</p>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'cod'}
              onChange={() => setPaymentMethod('cod')}
            />
            Cash / UPI on delivery
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'online'}
              onChange={() => setPaymentMethod('online')}
            />
            Pay online now (Google Pay, PhonePe, cards & more)
          </label>
        </div>

        {errorMsg && <p className="text-red-700 text-sm">{errorMsg}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-catch text-tide-900 font-semibold py-3 hover:bg-catch-dark transition-colors disabled:opacity-50"
        >
          {submitting
            ? 'Processing…'
            : paymentMethod === 'online'
            ? `Pay ₹${total.toFixed(0)} now`
            : 'Place order'}
        </button>
      </form>
    </main>
  )
}