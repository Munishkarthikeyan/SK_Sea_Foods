import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Splash from './Splash'

export default function CustomerProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) return <Splash />
  if (!session) return <Navigate to="/customer-auth" replace />
  return <>{children}</>
}
