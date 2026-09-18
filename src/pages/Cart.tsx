import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { lines, removeFromCart, updateQuantity, total } = useCart()
  const navigate = useNavigate()

  if (lines.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-5 py-16 text-center">
        <p className="text-tide-400 mb-4">Your cart is empty.</p>
        <Link to="/" className="text-tide-900 underline underline-offset-4">
          Browse today's catch
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display text-2xl font-semibold mb-6">Your cart</h1>
      <div className="flex flex-col divide-y divide-tide-900/10 border-y border-tide-900/10">
        {lines.map((line) => (
          <div key={line.product.id} className="py-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-medium">{line.product.name}</p>
              <p className="text-sm text-tide-400">₹{line.product.price_per_kg}/kg</p>
            </div>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={line.quantity_kg}
              onChange={(e) => updateQuantity(line.product.id, Number(e.target.value))}
              className="w-16 border border-tide-900/20 px-2 py-1 text-sm bg-white"
            />
            <span className="text-sm text-tide-400">kg</span>
            <p className="w-20 text-right font-medium">
              ₹{(line.product.price_per_kg * line.quantity_kg).toFixed(0)}
            </p>
            <button
              onClick={() => removeFromCart(line.product.id)}
              className="text-tide-400 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6">
        <span className="font-display text-xl">Total</span>
        <span className="font-display text-xl font-semibold">₹{total.toFixed(0)}</span>
      </div>
      <button
        onClick={() => navigate('/checkout')}
        className="mt-6 w-full bg-tide-900 text-paper py-3 font-medium hover:bg-tide-800 transition-colors"
      >
        Proceed to checkout
      </button>
    </main>
  )
}
