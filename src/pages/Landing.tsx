import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { session, role, loading } = useAuth()
  const navigate = useNavigate()

  // If already logged in, skip the choice screen and go straight in
  useEffect(() => {
    if (!loading && session) {
      navigate(role === 'owner' ? '/admin' : '/shop', { replace: true })
    }
  }, [loading, session, role, navigate])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-5">
      <div className="text-center">
        <img
          src={`${import.meta.env.BASE_URL}Logo.png`}
          alt="SK Sea Foods"
          className="h-16 w-16 object-contain mx-auto mb-3"
        />
        <h1 className="font-display text-3xl font-semibold text-tide-900">
          SK Sea Foods
        </h1>
        <p className="text-tide-400 text-sm mt-1">
          Fresh catch, straight to your door
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate('/customer-auth')}
          className="bg-black text-white py-3 rounded-full font-semibold hover:bg-neutral-800 hover:scale-105 transition-all duration-150"
        >
          I'm a customer
        </button>

        <button
          onClick={() => navigate('/shop-login')}
          className="border border-tide-900/20 text-tide-900 py-3 rounded-full font-semibold hover:bg-tide-900/5 transition-colors"
        >
          Shop login
        </button>
      </div>
    </main>
  )
}