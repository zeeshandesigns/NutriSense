import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'
import { IconButton, Text, TextInput } from 'react-native-paper'
import { supabase } from '../lib/supabase'

interface Message { role: 'user' | 'model'; text: string }

const SUGGESTED = [
  'Is karahi good for muscle gain?',
  'How much protein is in biryani?',
  'What are lighter desi breakfast options?',
  'Is nihari heavy for dinner?',
]

const GOAL_CONTEXT: Record<string, string> = {
  weight_loss: "The user wants to lose weight — mention calorie density and lightness.",
  muscle_gain: "The user wants to build muscle — focus on protein content.",
  curious:     "The user just wants to understand their food — give a balanced explanation.",
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const listRef = useRef<FlatList>(null)
  const geminiKey = process.env.EXPO_PUBLIC_GEMINI_KEY

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
  }, [])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const newMessages: Message[] = [...messages, { role: 'user', text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const goal = profile?.goal ?? 'curious'
    const restrictions = profile?.restrictions?.join(', ') || 'none'
    const systemPrompt = `You are a friendly South Asian food and nutrition assistant. User's goal: ${goal.replace('_', ' ')}. Dietary restrictions: ${restrictions}. Answer in 2-4 sentences. Focus on Pakistani/desi food. Never be judgmental about food choices.`

    try {
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
      const history = newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
      const { data } = await axios.post(GEMINI_URL, {
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }, ...history],
        generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
      })
      const reply = data.candidates[0].content.parts[0].text
      setMessages(prev => [...prev, { role: 'model', text: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I could not reach the AI right now. Try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyMedium" style={{ opacity: 0.5, marginBottom: 12 }}>Ask me anything about South Asian food</Text>
            {SUGGESTED.map(q => (
              <Text key={q} onPress={() => send(q)} style={styles.suggestion}>{q}</Text>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.modelBubble]}>
            <Text variant="bodyMedium">{item.text}</Text>
          </View>
        )}
      />
      {loading && (
        <View style={[styles.bubble, styles.modelBubble, { margin: 12 }]}>
          <Text variant="bodySmall" style={{ opacity: 0.5 }}>Thinking…</Text>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          value={input} onChangeText={setInput} placeholder="Ask about your food…"
          style={styles.input} onSubmitEditing={() => send(input)} returnKeyType="send"
        />
        <IconButton icon="send" onPress={() => send(input)} disabled={loading || !input.trim()} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  list:        { padding: 16, flexGrow: 1 },
  empty:       { alignItems: 'center', marginTop: 32 },
  suggestion:  { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12,
                 paddingVertical: 8, marginBottom: 8, fontSize: 13, color: '#374151' },
  bubble:      { maxWidth: '80%', padding: 12, borderRadius: 12, marginBottom: 8 },
  userBubble:  { alignSelf: 'flex-end', backgroundColor: '#dcfce7' },
  modelBubble: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6' },
  inputRow:    { flexDirection: 'row', alignItems: 'center', padding: 8,
                 borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb' },
  input:       { flex: 1, height: 44 },
})
