import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Login from './pages/Login'
import DashboardLayout from './pages/DashboardLayout'
import Today from './pages/Today'
import History from './pages/History'
import Insights from './pages/Insights'
import Chatbot from './pages/Chatbot'
import Profile from './pages/Profile'

function Guard({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={<Guard session={session}><DashboardLayout /></Guard>}>
        <Route path="/dashboard" element={<Today />} />
        <Route path="/history"   element={<History />} />
        <Route path="/insights"  element={<Insights />} />
        <Route path="/chatbot"   element={<Chatbot />} />
        <Route path="/profile"   element={<Profile />} />
      </Route>
    </Routes>
  )
}
