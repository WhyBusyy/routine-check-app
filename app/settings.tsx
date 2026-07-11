import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { useLanguageStore, LanguagePref } from '../store/languageStore'
import { SUPPORTED_LOCALES, SupportedLocale, t } from '../i18n'

const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  'pt-BR': 'Português (BR)',
  ru: 'Русский',
  it: 'Italiano',
  id: 'Bahasa Indonesia',
  vi: 'Tiếng Việt',
}

export default function SettingsScreen() {
  const router = useRouter()
  const language = useLanguageStore((s) => s.language)
  const setLanguage = useLanguageStore((s) => s.setLanguage)

  const options: { key: LanguagePref; label: string }[] = [
    { key: 'system', label: t('settings.systemDefault') },
    ...SUPPORTED_LOCALES.map((l) => ({ key: l as LanguagePref, label: LANGUAGE_NAMES[l] })),
  ]

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        {options.map((opt) => {
          const selected = language === opt.key
          return (
            <TouchableOpacity key={opt.key} style={styles.row} onPress={() => setLanguage(opt.key)}>
              <Text style={styles.rowLabel}>{opt.label}</Text>
              {selected && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  back: { color: '#fff', fontSize: 28, width: 24 },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  content: { padding: 20 },
  sectionTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 16,
    marginBottom: 8,
  },
  rowLabel: { color: '#fff', fontSize: 16 },
  check: { color: '#4ade80', fontSize: 16, fontWeight: '700' },
})
