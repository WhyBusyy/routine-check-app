import * as Notifications from 'expo-notifications'
import { toDateString } from './dateUtils'
import { t } from '../i18n'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const TIME_SLOT_HOURS: Record<string, { hour: number; minute: number }> = {
  morning: { hour: 9, minute: 0 },    // 오전 9시
  afternoon: { hour: 15, minute: 0 }, // 오후 3시
  evening: { hour: 20, minute: 0 },   // 오후 8시
  anytime: { hour: 19, minute: 0 },   // 오후 7시
}

export function getEffectiveTime(
  timeSlot: string,
  customTime?: { hour: number; minute: number },
): { hour: number; minute: number } {
  return customTime ?? TIME_SLOT_HOURS[timeSlot] ?? TIME_SLOT_HOURS.anytime
}

export function formatTime(hour: number, minute: number): string {
  const hh = hour.toString().padStart(2, '0')
  const mm = minute.toString().padStart(2, '0')
  return `${hh}:${mm}`
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  if (existingStatus === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export type NotifRoutine = {
  id: string
  emoji: string
  name: string
  timeSlot: string
  customTime?: { hour: number; minute: number }
  notificationEnabled: boolean
}

const MAX_TOTAL = 60 // iOS 64개 예약 제한 여유
const MAX_DAYS = 14

/** date의 effective time에 단발 알림 예약(발송 시각이 미래일 때만) */
export async function scheduleRoutineDay(
  routine: NotifRoutine,
  date: Date,
): Promise<void> {
  const { hour, minute } = getEffectiveTime(routine.timeSlot, routine.customTime)
  const fireDate = new Date(date)
  fireDate.setHours(hour, minute, 0, 0)
  if (fireDate.getTime() <= Date.now()) return
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t('notification.title'),
      body: t('notification.body', { emoji: routine.emoji, name: routine.name }),
      data: { routineId: routine.id, dateStr: toDateString(fireDate) },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  })
}

async function ourScheduled() {
  const all = await Notifications.getAllScheduledNotificationsAsync()
  return all.filter((s) => (s.content.data as any)?.routineId)
}

export async function cancelRoutineDay(routineId: string, dateStr: string): Promise<void> {
  const list = await ourScheduled()
  await Promise.all(
    list
      .filter((s) => {
        const d = s.content.data as any
        return d.routineId === routineId && d.dateStr === dateStr
      })
      .map((s) => Notifications.cancelScheduledNotificationAsync(s.identifier)),
  )
}

export async function cancelAllForRoutine(routineId: string): Promise<void> {
  const list = await ourScheduled()
  await Promise.all(
    list
      .filter((s) => (s.content.data as any).routineId === routineId)
      .map((s) => Notifications.cancelScheduledNotificationAsync(s.identifier)),
  )
}

/**
 * 전체 재조정: 우리 앱 예약을 모두 취소하고, 활성 루틴에 대해 오늘부터 N일 중
 * 미완료·미래 시각인 날만 재예약한다. N은 iOS 제한을 고려해 적응적으로 정한다.
 */
export async function reconcileNotifications(
  routines: NotifRoutine[],
  isChecked: (routineId: string, dateStr: string) => boolean,
): Promise<void> {
  const list = await ourScheduled()
  await Promise.all(list.map((s) => Notifications.cancelScheduledNotificationAsync(s.identifier)))

  const granted = (await Notifications.getPermissionsAsync()).status === 'granted'
  if (!granted) return

  const enabled = routines.filter((r) => r.notificationEnabled)
  if (enabled.length === 0) return

  const N = Math.max(1, Math.min(MAX_DAYS, Math.floor(MAX_TOTAL / enabled.length)))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const r of enabled) {
    for (let i = 0; i < N; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dateStr = toDateString(d)
      if (isChecked(r.id, dateStr)) continue
      await scheduleRoutineDay(r, d)
    }
  }
}
