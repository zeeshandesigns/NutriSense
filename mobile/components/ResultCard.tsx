import { Image, Share, StyleSheet, View } from 'react-native'
import { Button, Card, Divider, Text } from 'react-native-paper'
import { displayLabel, ScanResult } from '../lib/api'
import ConfidenceBar from './ConfidenceBar'
import NutritionGrid from './NutritionGrid'

interface Props { result: ScanResult; imageUri: string; readOnly?: boolean }

export default function ResultCard({ result, imageUri, readOnly }: Props) {
  const label = displayLabel(result.top_prediction.label)

  async function share() {
    await Share.share({ message: `I ate ${label} — ${result.nutrition?.calories ?? '?'} kcal. Tracked with NutriSense AI.` })
  }

  return (
    <Card style={styles.card}>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" /> : null}
      <Card.Content style={styles.content}>
        <Text variant="headlineSmall">{label}</Text>
        <ConfidenceBar confidence={result.top_prediction.confidence} />

        <Divider style={styles.divider} />
        <NutritionGrid nutrition={result.nutrition} />

        {result.insight ? (
          <>
            <Divider style={styles.divider} />
            <Text variant="bodyMedium" style={styles.insight}>{result.insight}</Text>
          </>
        ) : null}

        {result.gradcam_sample_url ? (
          <>
            <Divider style={styles.divider} />
            <Text variant="labelSmall" style={{ opacity: 0.5, marginBottom: 4 }}>Model focus area</Text>
            <Image source={{ uri: result.gradcam_sample_url }} style={styles.gradcam} resizeMode="cover" />
          </>
        ) : null}
      </Card.Content>

      {!readOnly && (
        <Card.Actions>
          <Button onPress={share}>Share</Button>
        </Card.Actions>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card:    { overflow: 'hidden' },
  image:   { width: '100%', height: 200 },
  content: { paddingTop: 12, gap: 8 },
  divider: { marginVertical: 6 },
  insight: { lineHeight: 22, opacity: 0.85 },
  gradcam: { width: '100%', height: 180, borderRadius: 8 },
})
