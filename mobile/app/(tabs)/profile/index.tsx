import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Button, Card, Chip, Divider, Text } from 'react-native-paper'
import { supabase } from '../../../lib/supabase'

const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Lose Weight', muscle_gain: 'Build Muscle', curious: 'Just Curious',
}

export default function ProfileScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <Card.Title title={email} subtitle={profile ? GOAL_LABELS[profile.goal] : ''} />
        <Card.Content>
          <Text variant="labelMedium" style={styles.label}>Restrictions</Text>
          {profile?.restrictions?.length
            ? <>{profile.restrictions.map((r: string) => <Chip key={r} style={styles.chip}>{r.replace('_', '-')}</Chip>)}</>
            : <Text variant="bodySmall" style={{ opacity: 0.5 }}>None selected</Text>
          }
        </Card.Content>
      </Card>

      <Button mode="contained-tonal" onPress={() => router.push('/(tabs)/profile/model')}>
        About the Model
      </Button>

      <Divider style={styles.divider} />
      <Button mode="outlined" onPress={() => supabase.auth.signOut()}>Sign Out</Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  label:     { marginBottom: 8, opacity: 0.6 },
  chip:      { alignSelf: 'flex-start', marginBottom: 4 },
  divider:   { marginVertical: 8 },
})
