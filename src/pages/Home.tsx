import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Product } from '../types'
import ProductCard from '../components/ProductCard'

// Matches a product's free-text category against one of the four fixed
// filters used in the navbar. Substring-based, so it copes with category
// text like "Sea fish" or "Shellfish" without requiring exact matches.
function matchesFilter(product: Product, filter: string) {
  const text = `${product.category} ${product.name}`.toLowerCase()
  if (filter === 'fish') return text.includes('fish') && !text.includes('shell')
  if (filter === 'crab') return text.includes('crab')
  if (filter === 'prawn') return text.includes('prawn') || text.includes('shrimp')
  return true
}

export default function Home() {
  const [searchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') // 'fish' | 'crab' | 'prawn' | null

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Product[]
    },
  })

  const filtered = useMemo(() => {
    if (!data) return []
    if (!selectedCategory) return data
    return data.filter((p) => matchesFilter(p, selectedCategory))
  }, [data, selectedCategory])

  return (
    <main className="max-w-10xl px-5 py-10">
      <div className="mb-8">
        <center>
          <p className="text-xs uppercase tracking-wide text-catch-dark font-semibold mb-1">
            Fresh in today
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-tide-900">
            Today's catch, straight from the boat to your kitchen
          </h1>
        </center>
      </div>

      {isLoading && <p className="text-tide-400">Loading today's catch…</p>}
      {error && (
        <p className="text-red-700">
          Couldn't load products. Check your Supabase connection in .env.
        </p>
      )}
      {data && data.length === 0 && (
        <p className="text-tide-400">Nothing listed yet — check back soon.</p>
      )}
      {data && data.length > 0 && filtered.length === 0 && (
        <p className="text-tide-400">No items in this category right now.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            style={{ animationDelay: `${idx * 0.08}s` }}
          />
        ))}
      </div>
    </main>
  )
}