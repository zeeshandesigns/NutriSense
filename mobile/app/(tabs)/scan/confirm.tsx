import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image, StyleSheet, View } from 'react-native'
import { Button, Card, Text } from 'react-native-paper'
import { displayLabel, FoodPrediction, ScanResult } from '../../../lib/api'

export default function ConfirmScreen() {
  const { uri, result: resultJson } = useLocalSearchParams<{ uri: string; result: string }>()
  const router = useRouter()
  const result: ScanResult = JSON.parse(resultJson)

  function select(choice: FoodPrediction) {
    const confirmed: ScanResult = { ...result, top_prediction: choice, low_confidence: false }
    router.replace({ pathname: '/(tabs)/scan/result', params: { uri, result: JSON.stringify(confirmed) } })
  }

  return (
    <View style={styles.container}>
      {uri ? <Image source={{ uri }} style={styles.image} resizeMode="cover" /> : null}
      <Text variant="titleMedium" style={styles.heading}>We're not sure — which one is it?</Text>
      {result.top_3.map(choice => (
        <Card key={choice.label} style={styles.card} onPress={() => select(choice)}>
          <Card.Title
            title={displayLabel(choice.label)}
            subtitle={`${Math.round(choice.confidence * 100)}% confidence`}
          />
        </Card>
      ))}
      <Button mode="text" onPress={() => router.back()}>None of these — go back</Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  image:     { width: '100%', height: 180, borderRadius: 12 },
  heading:   { textAlign: 'center' },
  card:      {},
})
