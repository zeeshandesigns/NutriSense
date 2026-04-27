import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

export interface FoodPrediction { label: string; confidence: number }
export interface Nutrition { calories: number; protein: number; carbs: number; fat: number; note?: string }
export interface ScanResult {
  top_prediction: FoodPrediction
  top_3: FoodPrediction[]
  low_confidence: boolean
  nutrition: Nutrition
  insight: string
  gradcam_sample_url?: string
  processing_time_ms: number
}

export async function predictFile(file: File, userGoal = 'curious'): Promise<ScanResult> {
  const form = new FormData()
  form.append('image', file)
  form.append('user_goal', userGoal)
  const { data } = await axios.post<ScanResult>(`${BASE}/predict`, form, { timeout: 20000 })
  return data
}

export const displayLabel = (label: string) =>
  label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
