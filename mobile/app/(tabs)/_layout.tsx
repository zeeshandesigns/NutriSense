import { Tabs } from 'expo-router'
import { useTheme } from 'react-native-paper'

export default function TabLayout() {
  const { colors } = useTheme()
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.primary,
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
    }}>
      <Tabs.Screen name="scan"     options={{ title: 'Scan',    tabBarLabel: 'Scan' }} />
      <Tabs.Screen name="history"  options={{ title: 'History', tabBarLabel: 'History' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights',tabBarLabel: 'Insights' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
    </Tabs>
  )
}
