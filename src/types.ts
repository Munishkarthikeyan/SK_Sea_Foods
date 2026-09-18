export interface Product {
  id: string
  name: string
  category: string
  price_per_kg: number
  stock_kg: number
  photo_url: string | null
  available: boolean
  created_at: string
}

export interface CartLine {
  product: Product
  quantity_kg: number
}

export interface Order {
  id: string
  customer_name: string
  phone: string
  address: string
  notes: string | null
  total: number
  status: string
  created_at: string
  items: { name: string; quantity_kg: number; price_per_kg: number }[] | null
}

export interface OrderItemRow {
  id: string
  order_id: string
  product_id: string | null
  name: string
  quantity_kg: number
  price_per_kg: number
}

export interface OrderInput {
  customer_name: string
  phone: string
  address: string
  notes: string
  items: { product_id: string; name: string; quantity_kg: number; price_per_kg: number }[]
  total: number
}
