import { useState } from 'react'
import { displayLabel } from '../lib/api'

interface Props { scans: any[] }

export default function HistoryTable({ scans }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sort, setSort] = useState<'date' | 'calories'>('date')

  const sorted = [...scans].sort((a, b) =>
    sort === 'calories'
      ? (b.nutrition?.calories ?? 0) - (a.nutrition?.calories ?? 0)
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="flex gap-3 p-3 border-b bg-gray-50 text-sm">
        <span className="text-gray-500">Sort:</span>
        {(['date', 'calories'] as const).map(s => (
          <button key={s} onClick={() => setSort(s)}
            className={sort === s ? 'font-semibold text-brand-700' : 'text-gray-400'}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-gray-400 border-b">
          {['Food', 'Cal', 'Protein', 'Carbs', 'Fat', 'Time'].map(h => (
            <th key={h} className="p-3">{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {sorted.map(scan => (
            <>
              <tr key={scan.id} onClick={() => setExpanded(expanded === scan.id ? null : scan.id)}
                className="border-b hover:bg-gray-50 cursor-pointer">
                <td className="p-3 font-medium">{displayLabel(scan.food_label)}</td>
                <td className="p-3">{scan.nutrition?.calories ?? '—'}</td>
                <td className="p-3">{scan.nutrition?.protein ?? '—'}g</td>
                <td className="p-3">{scan.nutrition?.carbs ?? '—'}g</td>
                <td className="p-3">{scan.nutrition?.fat ?? '—'}g</td>
                <td className="p-3 text-gray-400">
                  {new Date(scan.created_at).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
              {expanded === scan.id && scan.insight && (
                <tr key={`${scan.id}-exp`} className="bg-brand-50">
                  <td colSpan={6} className="px-4 py-3 text-sm text-gray-600 italic">{scan.insight}</td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
