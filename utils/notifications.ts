import * as Notifications from 'expo-notifications'

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

export async function scheduleRoutineNotification(
  routineId: string,
  emoji: string,
  name: string,
  hour: number,
  minute: number,
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '루틴 체크',
      body: `${emoji} ${name} 할 시간이에요!`,
      data: { routineId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })

  return id
}

export async function cancelRoutineNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId)
}
