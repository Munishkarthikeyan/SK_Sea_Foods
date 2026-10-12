import { FormEvent, KeyboardEvent, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

type LoginMethod = 'password' | 'otp'
type OtpPhase = 'enter-email' | 'enter-otp'

const OTP_LENGTH = 6

export default function CustomerAuth() {
  const navigate = useNavigate()

  // Which of the two login types is selected
  const [method, setMethod] = useState<LoginMethod>('password')

  // ---- Email + password state ----
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ---- Email OTP state ----
  const [otpPhase, setOtpPhase] = useState<OtpPhase>('enter-email')
  const [otpEmail, setOtpEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  function switchMethod(next: LoginMethod) {
    setMethod(next)
    setError(null)
    setOtpError(null)
  }

  // ---------------- Email + password ----------------
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

  // ---------------- Email OTP (passwordless) ----------------
  async function sendOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setOtpError(null)

    if (!otpEmail.includes('@')) {
      setOtpError('Enter a valid email address.')
      return
    }

    setOtpLoading(true)
    // shouldCreateUser: true lets a brand-new customer sign up via OTP too,
    // not just log in -- one flow covers both cases.
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail,
      options: { shouldCreateUser: true },
    })
    setOtpLoading(false)

    if (error) {
      setOtpError(error.message)
      return
    }

    setOtp(Array(OTP_LENGTH).fill(''))
    setOtpPhase('enter-otp')
    toast.success('Code sent', { description: `We've emailed a code to ${otpEmail}.` })
    setTimeout(() => otpRefs.current[0]?.focus(), 50)
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    setOtp((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  async function verifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const token = otp.join('')
    if (token.length !== OTP_LENGTH) {
      setOtpError(`Enter the ${OTP_LENGTH}-digit code.`)
      return
    }

    setOtpError(null)
    setOtpLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail,
      token,
      type: 'email',
    })
    setOtpLoading(false)

    if (error) {
      setOtpError(error.message)
      return
    }

    navigate('/shop')
  }

  async function resendOtp() {
    setOtpError(null)
    setOtpLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail,
      options: { shouldCreateUser: true },
    })
    setOtpLoading(false)
    if (error) {
      setOtpError(error.message)
      return
    }
    toast.success('Code resent', { description: `Sent again to ${otpEmail}.` })
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 bg-paper">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-sm text-tide-400 hover:text-tide-900 mb-6 inline-block">
          ← Back
        </Link>
        <h1 className="font-display text-2xl font-semibold mb-6">Customer login</h1>

        {/* ---- Login type selector cards ---- */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => switchMethod('password')}
            className={`flex flex-col items-center gap-2 border rounded-lg px-3 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
              method === 'password'
                ? 'border-tide-900 bg-sea-light/70 shadow-md'
                : 'border-tide-900/10 bg-white/60 hover:border-sea/40'
            }`}
          >
            <svg
              className={`h-6 w-6 ${method === 'password' ? 'text-tide-900' : 'text-tide-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-semibold">Email &amp; Password</span>
          </button>

          <button
            type="button"
            onClick={() => switchMethod('otp')}
            className={`flex flex-col items-center gap-2 border rounded-lg px-3 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
              method === 'otp'
                ? 'border-tide-900 bg-sea-light/70 shadow-md'
                : 'border-tide-900/10 bg-white/60 hover:border-sea/40'
            }`}
          >
            <svg
              className={`h-6 w-6 ${method === 'otp' ? 'text-tide-900' : 'text-tide-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-sm font-semibold">Email OTP</span>
          </button>
        </div>

        {/* ---- Email + password form ---- */}
        {method === 'password' && (
          <>
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
          </>
        )}

        {/* ---- Email OTP form ---- */}
        {method === 'otp' && (
          <>
            {otpPhase === 'enter-email' ? (
              <form onSubmit={sendOtp} className="flex flex-col gap-4">
                <input
                  name="otpEmail"
                  type="email"
                  required
                  placeholder="Email address"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="border border-tide-900/20 px-3 py-2 bg-white"
                />
                {otpError && <p className="text-red-700 text-sm">{otpError}</p>}
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="bg-black text-white py-2.5 rounded-full font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {otpLoading ? 'Sending…' : 'Send code'}
                </button>
                <p className="text-xs text-tide-400 text-center">
                  No password needed — we'll email you a one-time code.
                </p>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="flex flex-col gap-4">
                <p className="text-sm text-tide-600">
                  Enter the {OTP_LENGTH}-digit code sent to{' '}
                  <span className="font-semibold text-tide-900">{otpEmail}</span>
                </p>
                <div className="flex items-center justify-center gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-10 h-12 text-center text-lg font-semibold border border-tide-900/20 bg-white focus:border-tide-900 focus:outline-none transition-colors"
                    />
                  ))}
                </div>
                {otpError && <p className="text-red-700 text-sm text-center">{otpError}</p>}
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="bg-black text-white py-2.5 rounded-full font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {otpLoading ? 'Verifying…' : 'Verify & continue'}
                </button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpPhase('enter-email')
                      setOtpError(null)
                    }}
                    className="text-tide-400 hover:text-tide-900 underline underline-offset-4"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={otpLoading}
                    className="text-tide-400 hover:text-tide-900 underline underline-offset-4 disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  )
}
