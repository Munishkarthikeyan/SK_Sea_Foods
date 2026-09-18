import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/admin')
  }

  return (
    <main className="max-w-sm mx-auto px-5 py-20">
      <h1 className="font-display text-2xl font-semibold mb-6">Shop login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="border border-tide-900/20 px-3 py-2 bg-white"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="border border-tide-900/20 px-3 py-2 bg-white"
        />
        {error && <p className="text-red-700 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-tide-900 text-paper py-2.5 font-medium hover:bg-tide-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
