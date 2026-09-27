import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { lines, removeFromCart, updateQuantity, total } = useCart()
  const navigate = useNavigate()

  if (lines.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-5 py-12 sm:py-16 text-center">
        <p className="text-tide-400 mb-4">Your cart is empty.</p>
        <Link to="/" className="text-tide-900 underline underline-offset-4">
          Browse today's catch
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-5 py-8 sm:py-10">
      <h1 className="font-display text-xl sm:text-2xl font-bold mb-6">Your cart</h1>
      <div className="flex flex-col divide-y divide-tide-900/10 border border-tide-900/10 bg-white/70 rounded-lg overflow-hidden">
        {lines.map((line) => (
          <div
            key={line.product.id}
            className="px-4 py-4 flex flex-wrap items-center gap-x-4 gap-y-2 transition-colors hover:bg-sea-light"
          >
            <div className="flex-1 min-w-[140px]">
              <p className="font-semibold">{line.product.name}</p>
              <p className="text-sm text-tide-400">₹{line.product.price_per_kg}/kg</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0.5}
                max={line.product.stock_kg}
                step={0.5}
                value={line.quantity_kg}
                onChange={(e) => updateQuantity(line.product.id, Number(e.target.value))}
                className="w-16 border border-tide-900/20 px-2 py-1 text-sm bg-white"
              />
              <span className="text-sm text-tide-400">kg</span>
            </div>
            <p className="w-16 sm:w-20 text-right font-semibold">
              ₹{(line.product.price_per_kg * line.quantity_kg).toFixed(0)}
            </p>
            <button
              onClick={() => removeFromCart(line.product.id)}
              className="text-sm px-3 py-1.5 border border-red-700/30 text-red-700 hover:bg-red-50 transition-colors rounded-[5px]"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6">
        <span className="font-display text-lg sm:text-xl">Total</span>
        <span className="font-display text-lg sm:text-xl font-bold">₹{total.toFixed(0)}</span>
      </div>
      <button
        onClick={() => navigate('/checkout')}
        className="mt-6 w-full bg-tide-900 text-paper py-3 font-semibold hover:bg-tide-800 transition-colors"
      >
        Proceed to checkout
      </button>
    </main>
  )
}