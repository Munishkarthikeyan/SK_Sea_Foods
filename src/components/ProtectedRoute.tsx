import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loading) return <p className="p-8 text-center text-tide-400">Checking login…</p>
  if (!session) return <Navigate to="/shop-login" replace />
  return <>{children}</>
}
