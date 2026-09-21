import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

export default function CustomerAuth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))

    if (mode === 'signup') {
      const full_name = String(form.get('full_name') || '')
      const phone = String(form.get('phone') || '')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}#/email-confirmed`,
        },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      if (data.user) {
        await supabase.from('profiles').update({ full_name, phone }).eq('id', data.user.id)
      }

      toast.success('Please verify your email to continue', {
        description: `We've sent a confirmation link to ${email}.`,
      })
      setMode('login')
      setLoading(false)
      return
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    navigate('/shop')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-sm text-tide-400 hover:text-tide-900 mb-6 inline-block">
          ← Back
        </Link>
        <h1 className="font-display text-2xl font-semibold mb-6">
          {mode === 'login' ? 'Customer login' : 'Create your account'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <>
              <input
                name="full_name"
                required
                placeholder="Full name"
                className="border border-tide-900/20 px-3 py-2 bg-white"
              />
              <input
                name="phone"
                required
                placeholder="Phone number"
                className="border border-tide-900/20 px-3 py-2 bg-white"
              />
            </>
          )}
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
            minLength={6}
            placeholder="Password"
            className="border border-tide-900/20 px-3 py-2 bg-white"
          />
          {error && <p className="text-red-700 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white py-2.5 rounded-full font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError(null)
          }}
          className="text-sm text-tide-400 hover:text-tide-900 mt-4 underline underline-offset-4"
        >
          {mode === 'login' ? "New here? Create an account" : 'Already have an account? Log in'}
        </button>
      </div>
    </main>
  )
}