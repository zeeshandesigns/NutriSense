import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ActivityIndicator } from 'react-native-paper'
import { supabase } from '../../../lib/supabase'
import ResultCard from '../../../components/ResultCard'
import { Scan } from './index'

export default function ScanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [scan, setScan] = useState<Scan | null>(null)

  useEffect(() => {
    supabase.from('scans').select('*').eq('id', id).single().then(({ data }) => setScan(data))
  }, [id])

  if (!scan) return <ActivityIndicator style={styles.center} />

  const result = {
    top_prediction: { label: scan.food_label, confidence: scan.confidence },
    top_3: scan.top_3 ?? [{ label: scan.food_label, confidence: scan.confidence }],
    low_confidence: false,
    nutrition: scan.nutrition,
    insight: scan.insight ?? '',
    processing_time_ms: 0,
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ResultCard result={result} imageUri={scan.image_url ?? ''} readOnly />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  center:    { flex: 1 },
})
