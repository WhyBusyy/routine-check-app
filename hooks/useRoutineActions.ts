import { useCallback } from 'react'
import { useRoutineStore, Routine } from '../store/routineStore'
import {
  requestPermissions,
  scheduleRoutineNotification,
  cancelRoutineNotification,
} from '../utils/notifications'

export function useRoutineActions() {
  const { addRoutine, updateRoutine, removeRoutine, routines } = useRoutineStore()

  const addRoutineWithNotification = useCallback(
    async (data: Omit<Routine, 'id' | 'createdAt' | 'notificationId'>) => {
      const granted = await requestPermissions()

      addRoutine(data)

      const newRoutines = useRoutineStore.getState().routines
      const newRoutine = newRoutines[newRoutines.length - 1]

      if (granted && newRoutine) {
        const notificationId = await scheduleRoutineNotification(
          newRoutine.id,
          newRoutine.emoji,
          newRoutine.name,
          newRoutine.timeSlot,
        )
        updateRoutine(newRoutine.id, { notificationId })
      }
    },
    [addRoutine, updateRoutine],
  )

  const updateRoutineWithNotification = useCallback(
    async (id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => {
      const routine = routines.find((r) => r.id === id)

      if (routine?.notificationId) {
        await cancelRoutineNotification(routine.notificationId)
      }

      const granted = await requestPermissions()
      let notificationId: string | undefined
      if (granted) {
        notificationId = await scheduleRoutineNotification(
          id,
          updates.emoji ?? routine?.emoji ?? '',
          updates.name ?? routine?.name ?? '',
          updates.timeSlot ?? routine?.timeSlot ?? 'anytime',
        )
      }

      updateRoutine(id, { ...updates, notificationId })
    },
    [updateRoutine, routines],
  )

  const removeRoutineWithNotification = useCallback(
    async (id: string) => {
      const routine = routines.find((r) => r.id === id)
      if (routine?.notificationId) {
        await cancelRoutineNotification(routine.notificationId)
      }
      removeRoutine(id)
    },
    [removeRoutine, routines],
  )

  return {
    addRoutineWithNotification,
    updateRoutineWithNotification,
    removeRoutineWithNotification,
  }
}
