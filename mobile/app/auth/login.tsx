import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'
import { Button, Text, TextInput, useTheme } from 'react-native-paper'
import { supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const { colors } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password'); return }
    setLoading(true)
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) Alert.alert('Error', error.message)
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text variant="headlineMedium" style={[styles.title, { color: colors.primary }]}>
          NutriSense AI
        </Text>
        <Text variant="bodyMedium" style={styles.sub}>
          Understand what you eat — one photo at a time
        </Text>

        <TextInput
          label="Email" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" style={styles.input}
        />
        <TextInput
          label="Password" value={password} onChangeText={setPassword}
          secureTextEntry style={styles.input}
        />

        <Button mode="contained" onPress={submit} loading={loading} style={styles.btn}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Button>
        <Button mode="text" onPress={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner:     { flex: 1, justifyContent: 'center', padding: 24 },
  title:     { textAlign: 'center', marginBottom: 6 },
  sub:       { textAlign: 'center', opacity: 0.55, marginBottom: 32 },
  input:     { marginBottom: 12 },
  btn:       { marginTop: 8, marginBottom: 4 },
})
