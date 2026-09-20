import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import { CartLine, Product } from '../types'

interface CartContextValue {
  lines: CartLine[]
  addToCart: (product: Product, quantity_kg: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity_kg: number) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])

  // Keeps quantity between 0.5kg and whatever stock is left for that product,
  // so cart lines can never exceed today's available stock.
  function clampQuantity(quantity_kg: number, stock_kg: number) {
    const safe = Number.isFinite(quantity_kg) ? quantity_kg : 0.5
    return Math.min(Math.max(safe, 0.5), Math.max(stock_kg, 0.5))
  }

  function addToCart(product: Product, quantity_kg: number) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        const combined = existing.quantity_kg + quantity_kg
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantity_kg: clampQuantity(combined, product.stock_kg) }
            : l
        )
      }
      return [...prev, { product, quantity_kg: clampQuantity(quantity_kg, product.stock_kg) }]
    })
  }

  function removeFromCart(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId))
  }

  function updateQuantity(productId: string, quantity_kg: number) {
    setLines((prev) => {
      // Typing 0 or a negative number removes the line instead of leaving a
      // zero/negative-quantity item sitting in the cart.
      if (!Number.isFinite(quantity_kg) || quantity_kg <= 0) {
        return prev.filter((l) => l.product.id !== productId)
      }
      return prev.map((l) =>
        l.product.id === productId
          ? { ...l, quantity_kg: clampQuantity(quantity_kg, l.product.stock_kg) }
          : l
      )
    })
  }

  function clearCart() {
    setLines([])
  }

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + l.product.price_per_kg * l.quantity_kg, 0),
    [lines]
  )

  return (
    <CartContext.Provider
      value={{ lines, addToCart, removeFromCart, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}