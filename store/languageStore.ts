import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'
import { SupportedLocale } from '../i18n'

const storage = new MMKV({ id: 'language-store' })

const mmkvStorage = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}

export type LanguagePref = 'system' | SupportedLocale

type LanguageStore = {
  language: LanguagePref
  setLanguage: (value: LanguagePref) => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'system',
      setLanguage: (value) => set({ language: value }),
    }),
    {
      name: 'language-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
)
