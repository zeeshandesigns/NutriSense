import { ScrollView, StyleSheet, View } from 'react-native'
import { Card, List, Text } from 'react-native-paper'

const ABLATION = [
  { model: 'EfficientNetB0 (ours)', params: '5.3M', top1: '~80%', top3: '~93%' },
  { model: 'MobileNetV2',           params: '3.4M', top1: '~74%', top3: '~89%' },
  { model: 'ResNet50',              params: '25.6M',top1: '~76%', top3: '~90%' },
]

const LIMITATIONS = [
  'Portion size estimation is not supported',
  'Mixed-dish scenes classify the dominant food only',
  'Pakistani dish accuracy is lower than Food-101 due to smaller per-class training data',
  'Not intended for medical or clinical use',
  'Nutritional values are approximate standard-serving figures',
]

export default function AboutModelScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <Card.Title title="Architecture" />
        <Card.Content>
          <List.Item title="Model" description="EfficientNetB0 — ImageNet pretrained, two-phase fine-tuning" />
          <List.Item title="Classes" description="~100 food classes, ~35 South Asian dishes" />
          <List.Item title="Dataset" description="Food-101 + Khana 2025 (131K images) + DeshiFoodBD + self-scraped" />
          <List.Item title="Training" description="Kaggle P100/T4 GPU — free tier" />
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Ablation Study" subtitle="Same dataset, same hyperparameters" />
        <Card.Content>
          {ABLATION.map(r => (
            <View key={r.model} style={styles.row}>
              <Text style={[styles.col, r.model.includes('ours') && styles.bold]}>{r.model}</Text>
              <Text style={styles.col}>{r.params}</Text>
              <Text style={styles.col}>{r.top1}</Text>
              <Text style={styles.col}>{r.top3}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Limitations" />
        <Card.Content>
          {LIMITATIONS.map((l, i) => (
            <List.Item key={i} title={l} titleNumberOfLines={3} titleStyle={{ fontSize: 13 }} />
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  col:       { flex: 1, fontSize: 12 },
  bold:      { fontWeight: '700' },
})
