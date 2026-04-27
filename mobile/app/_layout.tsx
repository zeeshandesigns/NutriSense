import { useEffect, useState } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { Session } from '@supabase/supabase-js'
import { MD3LightTheme, PaperProvider } from 'react-native-paper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { supabase } from '../lib/supabase'

const theme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: '#2E7D32', secondaryContainer: '#dcfce7' },
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return // still loading
    const inAuth = segments[0] === 'auth'
    const inOnboarding = segments[0] === 'onboarding'
    if (!session && !inAuth) { router.replace('/auth/login'); return }
    if (session && inAuth) router.replace('/(tabs)/scan')
  }, [session, segments])

  if (session === undefined) return null // loading splash

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <Slot />
      </PaperProvider>
    </GestureHandlerRootView>
  )
}
