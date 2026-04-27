import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const GOALS = [{ k: 'weight_loss', v: 'Lose Weight' }, { k: 'muscle_gain', v: 'Build Muscle' }, { k: 'curious', v: 'Just Curious' }]
const RESTRICTIONS = ['halal', 'vegetarian', 'gluten_free', 'dairy_free']
const ABLATION = [
  { model: 'EfficientNetB0 (ours)', params: '5.3M', top1: '~80%', top3: '~93%', highlight: true },
  { model: 'MobileNetV2', params: '3.4M', top1: '~74%', top3: '~89%', highlight: false },
  { model: 'ResNet50', params: '25.6M', top1: '~76%', top3: '~90%', highlight: false },
]

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [showModel, setShowModel] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setEmail(user.email ?? '')
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
  }, [])

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ goal: profile.goal, restrictions: profile.restrictions }).eq('id', user.id)
    setSaving(false)
  }

  function toggleR(r: string) {
    if (!profile) return
    const has = profile.restrictions?.includes(r)
    setProfile({ ...profile, restrictions: has ? profile.restrictions.filter((x: string) => x !== r) : [...(profile.restrictions ?? []), r] })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="bg-white rounded-xl border p-6 space-y-5">
        <p className="text-sm text-gray-400">{email}</p>
        <div>
          <label className="text-sm font-medium block mb-2">Health Goal</label>
          <div className="flex gap-2 flex-wrap">
            {GOALS.map(({ k, v }) => (
              <button key={k} onClick={() => profile && setProfile({ ...profile, goal: k })}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${profile?.goal === k ? 'bg-brand-700 text-white border-brand-700' : 'hover:bg-brand-50'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Dietary Restrictions</label>
          <div className="flex gap-2 flex-wrap">
            {RESTRICTIONS.map(r => (
              <button key={r} onClick={() => toggleR(r)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${profile?.restrictions?.includes(r) ? 'bg-brand-700 text-white border-brand-700' : 'hover:bg-brand-50'}`}>
                {r.replace('_', '-')}
              </button>
            ))}
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="bg-brand-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-brand-800 transition-colors">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <button onClick={() => setShowModel(!showModel)} className="flex items-center justify-between w-full">
          <h2 className="font-semibold text-lg">About the Model</h2>
          <span className="text-gray-400">{showModel ? '▲' : '▼'}</span>
        </button>
        {showModel && (
          <div className="mt-4 space-y-4">
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Architecture:</strong> EfficientNetB0 — two-phase transfer learning</p>
              <p><strong>Dataset:</strong> Food-101 + Khana 2025 (131K) + DeshiFoodBD + self-scraped Pakistani classes</p>
              <p><strong>Classes:</strong> ~100 food classes, ~35 South Asian dishes</p>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-brand-50 text-left">
                <th className="p-2 border">Model</th><th className="p-2 border">Params</th>
                <th className="p-2 border">Top-1</th><th className="p-2 border">Top-3</th>
              </tr></thead>
              <tbody>
                {ABLATION.map(r => (
                  <tr key={r.model} className={r.highlight ? 'font-semibold bg-brand-50' : ''}>
                    <td className="p-2 border">{r.model}</td><td className="p-2 border">{r.params}</td>
                    <td className="p-2 border">{r.top1}</td><td className="p-2 border">{r.top3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Portion size estimation not supported.</p>
              <p>Mixed-dish scenes classify the dominant food only.</p>
              <p>Not intended for medical or clinical use.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
