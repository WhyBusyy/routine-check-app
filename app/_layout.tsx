import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useLanguageStore } from '../store/languageStore'
import { resolveDeviceLocale, setI18nLocale } from '../i18n'
import { useNotificationSync } from '../hooks/useNotificationSync'

export default function RootLayout() {
  const language = useLanguageStore((s) => s.language)
  const effectiveLocale = language === 'system' ? resolveDeviceLocale() : language
  // 렌더 전에 동기 설정 — 하위 트리는 key로 리마운트되어 새 언어로 렌더된다.
  setI18nLocale(effectiveLocale)
  useNotificationSync()

  return (
    <GestureHandlerRootView style={{ flex: 1 }} key={effectiveLocale}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#111' },
          animation: 'slide_from_right',
        }}
      />
    </GestureHandlerRootView>
  )
}
