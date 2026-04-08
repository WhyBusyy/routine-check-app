import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

const mmkvStorage = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}

export type Routine = {
  id: string
  name: string
  emoji: string
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'anytime'
  color: string
  createdAt: string
}

export type CheckRecord = {
  routineId: string
  date: string  // YYYY-MM-DD
  completedAt: string  // ISO string
}

type RoutineStore = {
  routines: Routine[]
  checkRecords: CheckRecord[]
  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt'>) => void
  removeRoutine: (id: string) => void
  toggleCheck: (routineId: string, date: string) => void
  isChecked: (routineId: string, date: string) => boolean
  getStreak: (routineId: string) => number
  getTodayProgress: () => { completed: number; total: number }
  getHeatmapData: (routineId: string, days?: number) => { date: string; count: number }[]
}

export const useRoutineStore = create<RoutineStore>()(
  persist(
    (set, get) => ({
      routines: [],
      checkRecords: [],

      addRoutine: (routineData) => {
        const routine: Routine = {
          ...routineData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ routines: [...state.routines, routine] }))
      },

      removeRoutine: (id) => {
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== id),
          checkRecords: state.checkRecords.filter((c) => c.routineId !== id),
        }))
      },

      toggleCheck: (routineId, date) => {
        const isAlreadyChecked = get().isChecked(routineId, date)
        if (isAlreadyChecked) {
          set((state) => ({
            checkRecords: state.checkRecords.filter(
              (c) => !(c.routineId === routineId && c.date === date)
            ),
          }))
        } else {
          const record: CheckRecord = {
            routineId,
            date,
            completedAt: new Date().toISOString(),
          }
          set((state) => ({ checkRecords: [...state.checkRecords, record] }))
        }
      },

      isChecked: (routineId, date) => {
        return get().checkRecords.some(
          (c) => c.routineId === routineId && c.date === date
        )
      },

      getStreak: (routineId) => {
        const records = get().checkRecords
          .filter((c) => c.routineId === routineId)
          .map((c) => c.date)
          .sort()
          .reverse()

        if (records.length === 0) return 0

        const today = new Date().toISOString().split('T')[0]
        let streak = 0
        let checkDate = new Date()

        // 오늘 또는 어제부터 연속 체크 카운트
        const todayStr = today
        const yesterdayStr = new Date(Date.now() - 86400000)
          .toISOString()
          .split('T')[0]

        if (!records.includes(todayStr) && !records.includes(yesterdayStr)) {
          return 0
        }

        if (!records.includes(todayStr)) {
          checkDate = new Date(Date.now() - 86400000)
        }

        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0]
          if (records.includes(dateStr)) {
            streak++
            checkDate = new Date(checkDate.getTime() - 86400000)
          } else {
            break
          }
        }

        return streak
      },

      getTodayProgress: () => {
        const today = new Date().toISOString().split('T')[0]
        const total = get().routines.length
        const completed = get().checkRecords.filter((c) => c.date === today).length
        return { completed, total }
      },

      getHeatmapData: (routineId, days = 84) => {
        const data: { date: string; count: number }[] = []
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(Date.now() - i * 86400000)
            .toISOString()
            .split('T')[0]
          const checked = get().isChecked(routineId, date) ? 1 : 0
          data.push({ date, count: checked })
        }
        return data
      },
    }),
    {
      name: 'routine-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
