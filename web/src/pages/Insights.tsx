import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import WeeklyTrendChart from '../components/WeeklyTrendChart'
import MacroChart from '../components/MacroChart'
import { Link } from 'react-router-dom'

export default function Insights() {
  const [scans, setScans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const week = new Date(Date.now() - 7 * 86400000).toISOString()
      const { data } = await supabase.from('scans').select('*')
        .eq('user_id', user.id).gte('created_at', week).order('created_at')
      setScans(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-gray-400">Loading…</p>

  if (!scans.length) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🍽️</div>
      <h2 className="text-xl font-semibold mb-2">No data yet</h2>
      <p className="text-gray-400 mb-6">Scan your meals to start seeing weekly patterns</p>
      <Link to="/dashboard" className="bg-brand-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-800">
        Scan Now
      </Link>
    </div>
  )

  const freq = scans.reduce<Record<string, number>>((a, s) => { a[s.food_label] = (a[s.food_label] ?? 0) + 1; return a }, {})
  const top5 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const avgNutrition = {
    calories: Math.round(scans.reduce((s, x) => s + (x.nutrition?.calories ?? 0), 0) / scans.length),
    protein:  Math.round(scans.reduce((s, x) => s + (x.nutrition?.protein  ?? 0), 0) / scans.length),
    carbs:    Math.round(scans.reduce((s, x) => s + (x.nutrition?.carbs    ?? 0), 0) / scans.length),
    fat:      Math.round(scans.reduce((s, x) => s + (x.nutrition?.fat      ?? 0), 0) / scans.length),
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Weekly Insights</h1>
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(avgNutrition).map(([k, v]) => (
          <div key={k} className="bg-brand-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-brand-700">{v}</p>
            <p className="text-xs text-gray-500 capitalize">{k} avg</p>
          </div>
        ))}
      </div>
      {scans.length < 3
        ? <p className="text-sm text-gray-400 text-center">Scan {3 - scans.length} more meal{3 - scans.length !== 1 ? 's' : ''} to see charts</p>
        : <><WeeklyTrendChart scans={scans} /><MacroChart nutrition={avgNutrition} /></>
      }
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold mb-3">Most Scanned This Week</h3>
        {top5.map(([label, count]) => (
          <div key={label} className="flex justify-between py-1.5 border-b last:border-0">
            <span className="text-sm capitalize">{label.replace(/_/g, ' ')}</span>
            <span className="text-sm text-gray-400">{count}x</span>
          </div>
        ))}
      </div>
    </div>
  )
}
