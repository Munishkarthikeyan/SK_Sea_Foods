import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Order } from '../types'

export default function MyOrders() {
  const { session } = useAuth()

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['my-orders', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', session!.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Order[]
    },
  })

  return (
    <main className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display text-2xl font-semibold mb-6">My orders</h1>

      {isLoading && <p className="text-tide-400">Loading…</p>}
      {error && <p className="text-red-700 text-sm">Couldn't load your orders.</p>}
      {orders && orders.length === 0 && (
        <p className="text-tide-400">You haven't placed any orders yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {orders?.map((order) => (
          <div key={order.id} className="border border-tide-900/10 bg-white/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-tide-400">
                {new Date(order.created_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
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
            <div className="flex flex-col gap-1 mb-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {item.name} — {item.quantity_kg} kg
                  </span>
                  <span>₹{(item.quantity_kg * item.price_per_kg).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-tide-900/10">
              <span className="text-xs text-tide-400">
                {order.payment_method === 'online' ? '💳 Paid online' : '💵 Cash/UPI on delivery'}
              </span>
              <span className="font-semibold">₹{order.total.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
