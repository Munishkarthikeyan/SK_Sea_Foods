import { FormEvent, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Product } from '../types'
import OrdersPanel from '../components/OrdersPanel'
import BulkUpload from '../components/BulkUpload'

export default function Admin() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'catch' | 'bulk' | 'orders'>('catch')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    price_per_kg: '',
    stock_kg: '',
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const { data: products } = useQuery({
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    try {
      const form = new FormData(e.currentTarget)
      const name = String(form.get('name'))
      const category = String(form.get('category'))
      const price_per_kg = Number(form.get('price_per_kg'))
      const stock_kg = Number(form.get('stock_kg'))

      let photo_url: string | null = null
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop()
        const filePath = `${crypto.randomUUID()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('fish-photos')
          .upload(filePath, photoFile)
        if (uploadError) throw uploadError
        const { data: publicUrl } = supabase.storage
          .from('fish-photos')
          .getPublicUrl(filePath)
        photo_url = publicUrl.publicUrl
      }

      const { error: insertError } = await supabase.from('products').insert({
        name,
        category,
        price_per_kg,
        stock_kg,
        photo_url,
        available: true,
      })
      if (insertError) throw insertError

      ;(e.target as HTMLFormElement).reset()
      setPhotoFile(null)
      queryClient.invalidateQueries({ queryKey: ['products'] })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not add item.')
    } finally {
      setSubmitting(false)
    }
  }

  async function uploadPhotoFor(productId: string, file: File) {
    setErrorMsg(null)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${crypto.randomUUID()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('fish-photos')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage.from('fish-photos').getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('products')
        .update({ photo_url: publicUrl.publicUrl })
        .eq('id', productId)
      if (updateError) throw updateError

      queryClient.invalidateQueries({ queryKey: ['products'] })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not upload photo.')
    }
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(`Remove "${product.name}" permanently? This can't be undone.`)
    if (!confirmed) return

    setErrorMsg(null)
    try {
      const { error } = await supabase.from('products').delete().eq('id', product.id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['products'] })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not remove item.')
    }
  }

  function startEdit(product: Product) {
    setErrorMsg(null)
    setEditingId(product.id)
    setEditForm({
      name: product.name,
      category: product.category,
      price_per_kg: String(product.price_per_kg),
      stock_kg: String(product.stock_kg),
    })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(productId: string) {
    setSavingEdit(true)
    setErrorMsg(null)
    try {
      const price_per_kg = Number(editForm.price_per_kg)
      const stock_kg = Number(editForm.stock_kg)
      if (!editForm.name.trim() || !editForm.category.trim()) {
        throw new Error('Name and category are required.')
      }
      if (Number.isNaN(price_per_kg) || price_per_kg < 0) {
        throw new Error('Price must be a valid, non-negative number.')
      }
      if (Number.isNaN(stock_kg) || stock_kg < 0) {
        throw new Error('Stock must be a valid, non-negative number.')
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: editForm.name.trim(),
          category: editForm.category.trim(),
          price_per_kg,
          stock_kg,
        })
        .eq('id', productId)
      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['products'] })
      setEditingId(null)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save changes.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function toggleAvailable(product: Product) {
    await supabase
      .from('products')
      .update({ available: !product.available })
      .eq('id', product.id)
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  async function markAllSoldOut() {
    if (!products) return
    await supabase.from('products').update({ available: false }).in(
      'id',
      products.map((p) => p.id)
    )
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <main className="max-w-3xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Shop dashboard</h1>
        <button onClick={signOut} className="text-sm text-tide-400 hover:text-tide-900">
          Sign out
        </button>
      </div>

      <div className="flex gap-6 border-b border-tide-900/10 mb-8">
        <button
          onClick={() => setTab('catch')}
          className={`pb-3 text-sm font-semibold border-b-2 -mb-px ${
            tab === 'catch'
              ? 'border-tide-900 text-tide-900'
              : 'border-transparent text-tide-400 hover:text-tide-600'
          }`}
        >
          Today's catch
        </button>
        <button
          onClick={() => setTab('bulk')}
          className={`pb-3 text-sm font-semibold border-b-2 -mb-px ${
            tab === 'bulk'
              ? 'border-tide-900 text-tide-900'
              : 'border-transparent text-tide-400 hover:text-tide-600'
          }`}
        >
          Bulk upload
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`pb-3 text-sm font-semibold border-b-2 -mb-px ${
            tab === 'orders'
              ? 'border-tide-900 text-tide-900'
              : 'border-transparent text-tide-400 hover:text-tide-600'
          }`}
        >
          Orders
        </button>
      </div>

      {tab === 'orders' && <OrdersPanel />}
      {tab === 'bulk' && <BulkUpload />}

      {tab === 'catch' && (
        <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-12">
        <input
          name="name"
          required
          placeholder="Fish name (e.g. Seer fish)"
          className="border border-tide-900/20 px-3 py-2 bg-white"
        />
        <input
          name="category"
          required
          placeholder="Category (e.g. Sea fish)"
          className="border border-tide-900/20 px-3 py-2 bg-white"
        />
        <div className="flex gap-4">
          <input
            name="price_per_kg"
            type="number"
            step="1"
            min="0"
            required
            placeholder="Price per kg (₹)"
            className="border border-tide-900/20 px-3 py-2 bg-white flex-1"
          />
          <input
            name="stock_kg"
            type="number"
            step="0.5"
            min="0"
            required
            placeholder="Stock (kg)"
            className="border border-tide-900/20 px-3 py-2 bg-white flex-1"
          />
        </div>
        <div>
          <label className="block text-sm text-tide-600 mb-1">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>
        {errorMsg && <p className="text-red-700 text-sm">{errorMsg}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-tide-900 text-paper py-2.5 font-semibold hover:bg-tide-800 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add item'}
        </button>
      </form>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold">Current listings</h2>
        <button onClick={markAllSoldOut} className="text-sm text-tide-400 hover:text-red-700">
          Mark all sold out
        </button>
      </div>
      {errorMsg && <p className="text-red-700 text-sm mb-3">{errorMsg}</p>}
      <div className="flex flex-col divide-y divide-tide-900/10 border-y border-tide-900/10">
        {products?.map((p) =>
          editingId === p.id ? (
            <div key={p.id} className="py-3 flex flex-col gap-3 bg-sea-light/60 px-3 -mx-3">
              <div className="flex gap-3">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Fish name"
                  className="border border-tide-900/20 px-2 py-1.5 bg-white text-sm flex-1"
                />
                <input
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Category"
                  className="border border-tide-900/20 px-2 py-1.5 bg-white text-sm flex-1"
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editForm.price_per_kg}
                  onChange={(e) => setEditForm((f) => ({ ...f, price_per_kg: e.target.value }))}
                  placeholder="Price per kg (₹)"
                  className="border border-tide-900/20 px-2 py-1.5 bg-white text-sm flex-1"
                />
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editForm.stock_kg}
                  onChange={(e) => setEditForm((f) => ({ ...f, stock_kg: e.target.value }))}
                  placeholder="Stock (kg)"
                  className="border border-tide-900/20 px-2 py-1.5 bg-white text-sm flex-1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(p.id)}
                  disabled={savingEdit}
                  className="text-sm px-3 py-1.5 bg-tide-900 text-paper font-semibold hover:bg-tide-800 disabled:opacity-50"
                >
                  {savingEdit ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={savingEdit}
                  className="text-sm px-3 py-1.5 border border-tide-900/20 text-tide-600 hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={p.id}
              className="py-3 flex items-center gap-4 transition-colors hover:bg-sea-light/60 px-3 -mx-3"
            >
              <div className="w-14 h-14 bg-tide-900/5 flex-shrink-0 overflow-hidden rounded">
                {p.photo_url && (
                  <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-tide-400">
                  ₹{p.price_per_kg}/kg · {p.stock_kg} kg
                </p>
                <label className="text-xs text-tide-900 underline underline-offset-2 cursor-pointer">
                  {p.photo_url ? 'Change photo' : 'Add photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadPhotoFor(p.id, file)
                    }}
                  />
                </label>
              </div>
              <button
                onClick={() => toggleAvailable(p)}
                className={`text-sm px-3 py-1 border ${
                  p.available
                    ? 'border-tide-900/20 text-tide-900'
                    : 'border-red-700/30 text-red-700'
                }`}
              >
                {p.available ? 'Available' : 'Sold out'}
              </button>
              <button
                onClick={() => startEdit(p)}
                className="text-sm px-3 py-1 border border-tide-900/20 text-tide-900 hover:bg-white"
              >
                Edit
              </button>
              <button
                onClick={() => deleteProduct(p)}
                className="text-sm px-3 py-1 border border-red-700/30 text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          )
        )}
      </div>
        </>
      )}
    </main>
  )
}