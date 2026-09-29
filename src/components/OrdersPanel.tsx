import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { Order, OrderItemRow } from '../types'

export default function OrdersPanel() {
  const queryClient = useQueryClient()
  const [sendingSmsFor, setSendingSmsFor] = useState<string | null>(null)

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Order[]
    },
    refetchInterval: 15000, // check for new orders every 15s
  })

  const { data: items } = useQuery({
    queryKey: ['order_items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('order_items').select('*')
      if (error) throw error
      return data as OrderItemRow[]
    },
  })

  async function updateStatus(order: Order, status: string) {
    await supabase.from('orders').update({ status }).eq('id', order.id)
    queryClient.invalidateQueries({ queryKey: ['orders'] })

    // Email the customer, best effort -- if this fails, the status change
    // above has already gone through, so we don't block on it.
    if (order.customer_id) {
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-customer-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            customer_id: order.customer_id,
            customer_name: order.customer_name,
            status,
            items: order.items,
            total: order.total,
          }),
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Could not notify customer:', err)
      }
    }
  }

  async function sendConfirmationSms(order: Order) {
    setSendingSmsFor(order.id)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${sessionData.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            phone: order.phone,
            message: 'Your order has been confirmed, you will get your order soon!!!',
          }),
        }
      )
      const result = await res.json()
      if (!res.ok) throw new Error(result.error?.message || result.error || 'SMS failed')
      toast.success('Order confirmed', { description: `SMS sent to ${order.phone}.` })
    } catch (err) {
      toast.error('Order confirmed, but SMS could not be sent', {
        description: err instanceof Error ? err.message : 'Check Twilio setup.',
      })
    } finally {
      setSendingSmsFor(null)
    }
  }

  function itemsFor(orderId: string) {
    return items?.filter((i) => i.order_id === orderId) ?? []
  }

  if (isLoading) return <p className="text-tide-400">Loading orders…</p>
  if (error) return <p className="text-red-700 text-sm">Couldn't load orders.</p>
  if (orders && orders.length === 0) {
    return <p className="text-tide-400">No orders yet — they'll show up here as customers check out.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {orders?.map((order) => (
        <div key={order.id} className="border border-tide-900/10 bg-white/60 p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-semibold">{order.customer_name}</p>
              <p className="text-sm text-tide-400">{order.phone}</p>
              <p className="text-sm text-tide-600 mt-1">{order.address}</p>
              {order.notes && (
                <p className="text-sm text-tide-400 mt-1 italic">Note: {order.notes}</p>
              )}
              <p className="text-xs text-tide-400 mt-2">
                {new Date(order.created_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 border whitespace-nowrap ${
                order.status === 'new'
                  ? 'border-catch-dark text-catch-dark'
                  : order.status === 'delivered'
                  ? 'border-tide-900/20 text-tide-400'
                  : 'border-tide-600/40 text-tide-600'
              }`}
            >
              {order.status}
            </span>
          </div>
           <p className="text-xs mb-2">
            {order.payment_method === 'online' ? (
              <span className="text-tide-900">💳 Paid online</span>
            ) : (
              <span className="text-tide-400">💵 Cash/UPI on delivery</span>
            )}
          </p>
          <div className="border-t border-tide-900/10 pt-3 flex flex-col gap-1">
            {itemsFor(order.id).map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.name} — {item.quantity_kg} kg
                </span>
                <span>₹{(item.quantity_kg * item.price_per_kg).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-tide-900/10">
            <span className="font-bold">Total: ₹{order.total.toFixed(0)}</span>
            <div className="flex gap-2">
              {order.status !== 'confirmed' && order.status !== 'delivered' && (
                <button
                  onClick={() => updateStatus(order, 'confirmed')}
                  disabled={sendingSmsFor === order.id}
                  className="text-xs px-3 py-1.5 bg-tide-900 text-paper hover:bg-tide-800 disabled:opacity-50"
                >
                  {sendingSmsFor === order.id ? 'Confirming…' : 'Confirm'}
                </button>
              )}
              {order.status !== 'delivered' && (
                <button
                  onClick={() => updateStatus(order, 'delivered')}
                  className="text-xs px-3 py-1.5 border border-tide-900/20 hover:bg-tide-900/5"
                >
                  Mark delivered
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}