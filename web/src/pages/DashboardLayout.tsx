import { Link, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/dashboard', label: 'Scan' },
  { to: '/history',   label: 'History' },
  { to: '/insights',  label: 'Insights' },
  { to: '/chatbot',   label: 'Ask AI' },
  { to: '/profile',   label: 'Profile' },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-brand-700 text-white px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-lg tracking-tight">NutriSense AI</span>
        <div className="flex gap-4 ml-4">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} className="text-sm hover:text-brand-100 transition-colors">
              {n.label}
            </Link>
          ))}
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate('/') }}
          className="ml-auto text-sm opacity-70 hover:opacity-100"
        >
          Sign out
        </button>
      </nav>
      <main className="max-w-4xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
