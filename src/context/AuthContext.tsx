import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  role: 'owner' | 'customer' | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ session: null, role: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<'owner' | 'customer' | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadRole(userId: string) {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    setRole((data?.role as 'owner' | 'customer') ?? 'customer')
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadRole(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        await loadRole(newSession.user.id)
      } else {
        setRole(null)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, role, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
