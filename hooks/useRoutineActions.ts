import { useCallback } from 'react'
import { useRoutineStore, Routine } from '../store/routineStore'
import { requestPermissions, cancelAllForRoutine } from '../utils/notifications'

export function useRoutineActions() {
  const { addRoutine, updateRoutine, removeRoutine } = useRoutineStore()

  const addRoutineWithNotification = useCallback(
    async (data: Omit<Routine, 'id' | 'createdAt'>) => {
      addRoutine(data)
      if (data.notificationEnabled) await requestPermissions()
      // 실제 예약은 useNotificationSync가 스토어 변경을 감지해 재조정한다.
    },
    [addRoutine],
  )

  const updateRoutineWithNotification = useCallback(
    async (id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => {
      updateRoutine(id, updates)
      if (updates.notificationEnabled) await requestPermissions()
    },
    [updateRoutine],
  )

  const removeRoutineWithNotification = useCallback(
    async (id: string) => {
      await cancelAllForRoutine(id)
      removeRoutine(id)
    },
    [removeRoutine],
  )

  const toggleRoutineNotification = useCallback(
    async (id: string) => {
      const routine = useRoutineStore.getState().routines.find((r) => r.id === id)
      if (!routine) return
      const nextEnabled = !routine.notificationEnabled
      if (nextEnabled) await requestPermissions()
      updateRoutine(id, { notificationEnabled: nextEnabled })
    },
    [updateRoutine],
  )

  return {
    addRoutineWithNotification,
    updateRoutineWithNotification,
    removeRoutineWithNotification,
    toggleRoutineNotification,
  }
}
