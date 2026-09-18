import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Product } from '../types'
import ProductCard from '../components/ProductCard'

export default function Home() {
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

  return (
    <main className="max-w-10xl px-5 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-catch-dark font-medium mb-1">
          Fresh in today
        </p>
        <h1 className="font-display text-3xl font-semibold text-tide-900">
          Today's catch, straight from the boat to your kitchen
        </h1>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {data?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  )
}
