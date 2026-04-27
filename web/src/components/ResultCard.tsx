import { displayLabel } from '../lib/api'
import type { ScanResult } from '../lib/api'

interface Props { result: ScanResult }

const CELLS = [
  { key: 'calories' as const, label: 'Calories', unit: 'kcal' },
  { key: 'protein'  as const, label: 'Protein',  unit: 'g' },
  { key: 'carbs'    as const, label: 'Carbs',     unit: 'g' },
  { key: 'fat'      as const, label: 'Fat',        unit: 'g' },
]

export default function ResultCard({ result }: Props) {
  const label = displayLabel(result.top_prediction.label)
  const pct = Math.round(result.top_prediction.confidence * 100)
  const barColor = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{label}</h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm text-gray-500">{pct}% confident</span>
        </div>
      </div>

      {result.low_confidence && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          Low confidence — alternatives: {result.top_3.slice(1).map(t => displayLabel(t.label)).join(', ')}
        </div>
      )}

      {result.nutrition && typeof result.nutrition.calories === 'number' ? (
        <div className="grid grid-cols-4 gap-3">
          {CELLS.map(({ key, label, unit }) => (
            <div key={key} className="bg-brand-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-brand-700">
                {result.nutrition[key]}<span className="text-xs font-normal">{unit}</span>
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Nutrition data not available for this dish</p>
      )}

      {result.insight && (
        <p className="text-sm text-gray-600 leading-relaxed border-t pt-4">{result.insight}</p>
      )}

      {result.gradcam_sample_url && (
        <div className="border-t pt-4">
          <p className="text-xs text-gray-400 mb-2">Model focus area (Grad-CAM)</p>
          <img src={result.gradcam_sample_url} alt="Grad-CAM" className="rounded-lg w-full max-h-48 object-cover" />
        </div>
      )}
    </div>
  )
}
