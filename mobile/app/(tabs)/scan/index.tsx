import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import ScanButton from '../../../components/ScanButton'

export default function ScanScreen() {
  const router = useRouter()

  async function handle(uri: string) {
    router.push({ pathname: '/(tabs)/scan/result', params: { uri } })
  }

  async function openCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return
    const pick = await ImagePicker.launchCameraAsync({ quality: 0.85 })
    if (!pick.canceled) handle(pick.assets[0].uri)
  }

  async function openGallery() {
    const pick = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 })
    if (!pick.canceled) handle(pick.assets[0].uri)
  }

  return (
    <View style={styles.container}>
      <ScanButton onCamera={openCamera} onGallery={openGallery} imageUri={null} />
      <Text style={styles.hint}>Point at a Pakistani or South Asian dish and tap Scan</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', gap: 20 },
  hint:      { textAlign: 'center', opacity: 0.4, fontSize: 13 },
})
