import { CSSProperties, useState } from 'react'
import { Product } from '../types'
import { useCart } from '../context/CartContext'

export default function ProductCard({
  product,
  style,
}: {
  product: Product
  style?: CSSProperties
}) {
  const { addToCart } = useCart()
  const [qty, setQty] = useState(1)
  const soldOut = !product.available || product.stock_kg <= 0

  return (
    <div
      style={style}
      className="product-card-enter border border-tide-900/10 bg-white/70 flex flex-col rounded-[10px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-sea/40"
    >
      <div className="aspect-[4/3] bg-tide-900/5 overflow-hidden relative">
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-tide-400 text-sm">
            No photo yet
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 bg-tide-900/60 flex items-center justify-center">
            <span className="text-paper font-display text-lg tracking-wide">Sold out</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-lg leading-tight">{product.name}</h3>
          <span className="text-catch-dark font-bold whitespace-nowrap">
            ₹{product.price_per_kg}/kg
          </span>
        </div>
        <p className="text-xs uppercase tracking-wide text-tide-400">{product.category}</p>
        {!soldOut && (
          <p className="text-xs text-tide-600">{product.stock_kg} kg left today</p>
        )}
        <div className="mt-auto pt-2 flex items-center gap-2">
          <input
            type="number"
            min={0.5}
            max={product.stock_kg}
            step={0.5}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            disabled={soldOut}
            className="w-16 border border-tide-900/20 px-2 py-1 text-sm bg-white disabled:opacity-40"
          />
          <span className="text-xs text-tide-400">kg</span>
          <button
            onClick={() => addToCart(product, qty)}
            disabled={soldOut}
            className="ml-auto bg-tide-900 text-paper text-sm px-3 py-1.5 hover:bg-tide-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  )
}