import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import HistoryTable from '../components/HistoryTable'

export default function History() {
  const [scans, setScans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('scans').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(200)
      setScans(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">History</h1>
      {loading ? <p className="text-gray-400">Loading…</p>
        : !scans.length ? <p className="text-gray-400">No scans yet. Upload a food photo to get started.</p>
        : <HistoryTable scans={scans} />
      }
    </div>
  )
}
