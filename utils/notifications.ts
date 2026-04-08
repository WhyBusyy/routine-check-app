import * as Notifications from 'expo-notifications'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const TIME_SLOT_HOURS: Record<string, { hour: number; minute: number }> = {
  morning: { hour: 7, minute: 0 },
  afternoon: { hour: 12, minute: 0 },
  evening: { hour: 18, minute: 0 },
  anytime: { hour: 9, minute: 0 },
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
  timeSlot: string,
): Promise<string> {
  const time = TIME_SLOT_HOURS[timeSlot] ?? TIME_SLOT_HOURS.anytime

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '루틴 체크',
      body: `${emoji} ${name} 할 시간이에요!`,
      data: { routineId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
    },
  })

  return id
}

export async function cancelRoutineNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId)
}
