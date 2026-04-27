import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Card, Text, useTheme } from 'react-native-paper'
import { supabase } from '../../lib/supabase'

const GOALS = [
  { key: 'weight_loss', icon: '⚖️', label: 'Lose Weight',   desc: 'Track calories and make mindful food choices' },
  { key: 'muscle_gain', icon: '💪', label: 'Build Muscle',  desc: 'Focus on protein-rich South Asian dishes' },
  { key: 'curious',     icon: '🍽️', label: 'Just Curious', desc: 'Understand what you eat, no pressure' },
]

export default function GoalScreen() {
  const router = useRouter()
  const { colors } = useTheme()

  async function select(goal: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ goal }).eq('id', user.id)
    router.push('/onboarding/restrictions')
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.heading}>What's your goal?</Text>
      <Text variant="bodyMedium" style={styles.sub}>We'll personalise your food insights</Text>
      {GOALS.map(g => (
        <Card key={g.key} style={styles.card} onPress={() => select(g.key)}>
          <Card.Title
            title={`${g.icon}  ${g.label}`}
            titleVariant="titleMedium"
            subtitle={g.desc}
            subtitleVariant="bodySmall"
          />
        </Card>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  heading:   { textAlign: 'center', marginBottom: 4 },
  sub:       { textAlign: 'center', opacity: 0.55, marginBottom: 12 },
  card:      {},
})
