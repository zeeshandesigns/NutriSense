import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { ActivityIndicator, Text } from 'react-native-paper'
import { supabase } from '../../../lib/supabase'
import HistoryItem from '../../../components/HistoryItem'

export interface Scan {
  id: string; user_id: string; food_label: string; confidence: number
  top_3: any; nutrition: any; insight: string | null; image_url: string | null; created_at: string
}

function groupByDate(scans: Scan[]) {
  const map = new Map<string, Scan[]>()
  for (const s of scans) {
    const d = new Date(s.created_at).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(s)
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
}

export default function HistoryScreen() {
  const router = useRouter()
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('scans').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(100)
      setScans(data ?? [])
      setLoading(false)
    }
    load()
  }, []))

  if (loading) return <ActivityIndicator style={styles.center} />
  if (!scans.length) return <Text style={styles.empty}>No scans yet — try scanning your next meal!</Text>

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={groupByDate(scans)}
      keyExtractor={g => g.date}
      renderItem={({ item: group }) => (
        <View>
          <Text variant="labelLarge" style={styles.dateHeader}>{group.date}</Text>
          {group.items.map(scan => (
            <HistoryItem
              key={scan.id} scan={scan}
              onPress={() => router.push({ pathname: '/(tabs)/history/[id]', params: { id: scan.id } })}
            />
          ))}
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  list:       { padding: 16 },
  center:     { flex: 1 },
  empty:      { textAlign: 'center', marginTop: 64, opacity: 0.5, padding: 24 },
  dateHeader: { opacity: 0.5, marginTop: 16, marginBottom: 4 },
})
