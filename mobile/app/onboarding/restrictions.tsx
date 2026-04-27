import { useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, Chip, Text } from 'react-native-paper'
import { supabase } from '../../lib/supabase'

const OPTIONS = [
  { key: 'halal',       label: 'Halal' },
  { key: 'vegetarian',  label: 'Vegetarian' },
  { key: 'gluten_free', label: 'Gluten-Free' },
  { key: 'dairy_free',  label: 'Dairy-Free' },
]

export default function RestrictionsScreen() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])

  function toggle(key: string) {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  async function save() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ restrictions: selected }).eq('id', user.id)
    router.push('/onboarding/intro')
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.heading}>Any dietary restrictions?</Text>
      <Text variant="bodyMedium" style={styles.sub}>Select all that apply</Text>
      <View style={styles.chips}>
        {OPTIONS.map(o => (
          <Chip key={o.key} selected={selected.includes(o.key)} onPress={() => toggle(o.key)}>
            {o.label}
          </Chip>
        ))}
      </View>
      <Button mode="contained" onPress={save} style={styles.btn}>Continue</Button>
      <Button mode="text" onPress={() => router.push('/onboarding/intro')}>Skip for now</Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  heading:   { textAlign: 'center', marginBottom: 4 },
  sub:       { textAlign: 'center', opacity: 0.55, marginBottom: 24 },
  chips:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  btn:       { marginBottom: 8 },
})
