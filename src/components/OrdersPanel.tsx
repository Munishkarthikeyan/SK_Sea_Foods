import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Order, OrderItemRow } from '../types'

export default function OrdersPanel() {
  const queryClient = useQueryClient()

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

  async function updateStatus(orderId: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    queryClient.invalidateQueries({ queryKey: ['orders'] })
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
        <div key={order.id} className="border border-tide-900/10 bg-white/60 p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
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

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-tide-900/10">
            <span className="font-bold">Total: ₹{order.total.toFixed(0)}</span>
            <div className="flex gap-2">
              {order.status !== 'confirmed' && order.status !== 'delivered' && (
                <button
                  onClick={() => updateStatus(order.id, 'confirmed')}
                  className="text-xs px-3 py-1.5 bg-tide-900 text-paper hover:bg-tide-800"
                >
                  Confirm
                </button>
              )}
              {order.status !== 'delivered' && (
                <button
                  onClick={() => updateStatus(order.id, 'delivered')}
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