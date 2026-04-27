import * as ImageManipulator from 'expo-image-manipulator'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { ActivityIndicator, Text } from 'react-native-paper'
import { predictImage } from '../../../lib/api'
import { supabase } from '../../../lib/supabase'
import ResultCard from '../../../components/ResultCard'
import { ScanResult } from '../../../lib/api'

export default function ScanResultScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>()
  const router = useRouter()
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (uri) run() }, [uri])

  async function run() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles').select('goal').eq('id', user?.id ?? '').single()
      const goal = (profile?.goal as string) ?? 'curious'

      const data = await predictImage(uri, goal)

      if (data.low_confidence) {
        router.replace({ pathname: '/(tabs)/scan/confirm', params: { uri, result: JSON.stringify(data) } })
        return
      }

      setResult(data)
      await saveScan(data, uri, user?.id)
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not reach the server')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text style={{ opacity: 0.6, marginTop: 12 }}>Analysing your food…</Text>
        </View>
      )}
      {result && <ResultCard result={result} imageUri={uri} />}
    </ScrollView>
  )
}

async function saveScan(data: ScanResult, uri: string, userId?: string) {
  if (!userId) return

  let image_url: string | null = null
  try {
    const compressed = await ImageManipulator.manipulateAsync(
      uri, [{ resize: { width: 600 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
    )
    const fileName = `${userId}/${Date.now()}.jpg`
    const response = await fetch(compressed.uri)
    const blob = await response.blob()
    const { error } = await supabase.storage.from('scan-images').upload(fileName, blob)
    if (!error) {
      const { data: urlData } = supabase.storage.from('scan-images').getPublicUrl(fileName)
      image_url = urlData.publicUrl
    }
  } catch (_) {}

  await supabase.from('scans').insert({
    user_id: userId,
    food_label: data.top_prediction.label,
    confidence: data.top_prediction.confidence,
    top_3: data.top_3,
    nutrition: data.nutrition,
    insight: data.insight,
    image_url,
  })
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  loading:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
})
