import { I18n } from 'i18n-js'
import * as Localization from 'expo-localization'
import ko from './locales/ko'
import en from './locales/en'
import ja from './locales/ja'
import zhHans from './locales/zh-Hans'
import zhHant from './locales/zh-Hant'
import es from './locales/es'
import fr from './locales/fr'
import de from './locales/de'
import ptBR from './locales/pt-BR'
import ru from './locales/ru'
import it from './locales/it'
import id from './locales/id'
import vi from './locales/vi'

export const SUPPORTED_LOCALES = [
  'ko', 'en', 'ja', 'zh-Hans', 'zh-Hant', 'es', 'fr', 'de', 'pt-BR', 'ru', 'it', 'id', 'vi',
] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const i18n = new I18n({
  ko,
  en,
  ja,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  es,
  fr,
  de,
  'pt-BR': ptBR,
  ru,
  it,
  id,
  vi,
})
i18n.enableFallback = true
i18n.defaultLocale = 'en'

// i18n-js는 기본으로 영어 복수 규칙(one/other)만 쓴다. 러시아어는 CLDR 규칙
// (one/few/many/other)을 등록해야 ru.ts의 few/many 형태가 실제로 선택된다.
i18n.pluralization.register('ru', (_i18n, count) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return ['one']
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return ['few']
  if (mod10 === 0 || (mod10 >= 5 && mod10 <= 9) || (mod100 >= 11 && mod100 <= 14))
    return ['many']
  return ['other']
})

export function resolveDeviceLocale(): SupportedLocale {
  const first = Localization.getLocales()[0]
  if (!first) return 'en'
  const lang = (first.languageCode ?? 'en').toLowerCase()
  const region = (first.regionCode ?? '').toUpperCase()
  const tag = (first.languageTag ?? '').toLowerCase()

  if (lang === 'zh') {
    if (tag.includes('hant') || ['TW', 'HK', 'MO'].includes(region)) return 'zh-Hant'
    return 'zh-Hans'
  }
  // pt-PT 미지원 — 'pt-BR'로 fallback (추후 pt-PT 추가 시 regionCode 분기 필요)
  if (lang === 'pt') return 'pt-BR'

  const direct = SUPPORTED_LOCALES.find((l) => l === lang)
  return direct ?? 'en'
}

// 첫 페인트부터 기기 언어로 표시되도록 모듈 로드 시 초기화한다.
i18n.locale = resolveDeviceLocale()

export function setI18nLocale(locale: SupportedLocale): void {
  i18n.locale = locale
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options)
}
