import { NativeModules, Platform } from 'react-native'
import type { Routine, CheckRecord } from '../store/routineStore'

const { WidgetKitBridge } = NativeModules

export function syncWidgetData(
  routines: Routine[],
  checkRecords: CheckRecord[],
) {
  if (Platform.OS !== 'ios') return

  const today = new Date().toISOString().split('T')[0]
  const todayChecks = new Set(
    checkRecords.filter((c) => c.date === today).map((c) => c.routineId)
  )

  const payload = {
    routines: routines.map((r) => ({
      id: r.id,
      name: r.name,
      emoji: r.emoji,
      color: r.color,
      checked: todayChecks.has(r.id),
    })),
    completed: todayChecks.size,
    total: routines.length,
    date: today,
  }

  try {
    WidgetKitBridge?.saveData(JSON.stringify(payload))
  } catch {
    // Widget extension may not be installed yet
  }
}
