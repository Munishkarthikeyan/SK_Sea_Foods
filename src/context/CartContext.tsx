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

  function addToCart(product: Product, quantity_kg: number) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantity_kg: l.quantity_kg + quantity_kg }
            : l
        )
      }
      return [...prev, { product, quantity_kg }]
    })
  }

  function removeFromCart(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId))
  }

  function updateQuantity(productId: string, quantity_kg: number) {
    setLines((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, quantity_kg } : l))
    )
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
