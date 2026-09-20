import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'

export default function Checkout() {
  const { lines, total, clearCart } = useCart()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    const form = new FormData(e.currentTarget)
    const customer_name = String(form.get('name') || '')
    const phone = String(form.get('phone') || '')
    const address = String(form.get('address') || '')
    const notes = String(form.get('notes') || '')

    try {
      // Generate the order's id ourselves so we never need the database to hand
      // a row back after insert (anonymous customers aren't allowed to SELECT
      // from orders, so .select() after insert would get blocked by RLS).
      const orderId = crypto.randomUUID()

      // Items summary embedded directly on the order row, so the webhook
      // notification has everything it needs in one insert (no race condition).
      const itemsSummary = lines.map((l) => ({
        name: l.product.name,
        quantity_kg: l.quantity_kg,
        price_per_kg: l.product.price_per_kg,
      }))

      // 1. Create the order (with items embedded)
      const { error: orderError } = await supabase.from('orders').insert({
        id: orderId,
        customer_name,
        phone,
        address,
        notes,
        total,
        status: 'new',
        items: itemsSummary,
      })
      if (orderError) throw orderError

      // 2. Also record detailed order_items rows (used by the admin Orders view)
      const items = lines.map((l) => ({
        order_id: orderId,
        product_id: l.product.id,
        name: l.product.name,
        quantity_kg: l.quantity_kg,
        price_per_kg: l.product.price_per_kg,
      }))
      const { error: itemsError } = await supabase.from('order_items').insert(items)
      if (itemsError) throw itemsError

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
      <h1 className="font-display text-2xl font-semibold mb-2">Delivery details</h1>
      <p className="text-sm text-tide-400 mb-6">
        Pay cash or UPI on delivery. Total: ₹{total.toFixed(0)}
      </p>
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
        {errorMsg && <p className="text-red-700 text-sm">{errorMsg}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-catch text-tide-900 font-medium py-3 hover:bg-catch-dark transition-colors disabled:opacity-50"
        >
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </form>
    </main>
  )
}