import { useCallback } from 'react'
import { useRoutineStore, Routine } from '../store/routineStore'
import {
  requestPermissions,
  scheduleRoutineNotification,
  cancelRoutineNotification,
  getEffectiveTime,
} from '../utils/notifications'

export function useRoutineActions() {
  const { addRoutine, updateRoutine, removeRoutine, routines } = useRoutineStore()

  const addRoutineWithNotification = useCallback(
    async (data: Omit<Routine, 'id' | 'createdAt' | 'notificationId'>) => {
      addRoutine(data)

      const newRoutines = useRoutineStore.getState().routines
      const newRoutine = newRoutines[newRoutines.length - 1]
      if (!newRoutine) return

      if (newRoutine.notificationEnabled) {
        const granted = await requestPermissions()
        if (granted) {
          const { hour, minute } = getEffectiveTime(
            newRoutine.timeSlot,
            newRoutine.customTime,
          )
          const notificationId = await scheduleRoutineNotification(
            newRoutine.id,
            newRoutine.emoji,
            newRoutine.name,
            hour,
            minute,
          )
          updateRoutine(newRoutine.id, { notificationId })
        }
      }
    },
    [addRoutine, updateRoutine],
  )

  const updateRoutineWithNotification = useCallback(
    async (id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => {
      const routine = routines.find((r) => r.id === id)
      if (!routine) return

      if (routine.notificationId) {
        await cancelRoutineNotification(routine.notificationId)
      }

      // routine 존재가 위 guard로 보장됨
      const merged = { ...routine, ...updates } as Routine
      let notificationId: string | undefined

      if (merged.notificationEnabled) {
        const granted = await requestPermissions()
        if (granted) {
          const { hour, minute } = getEffectiveTime(
            merged.timeSlot,
            merged.customTime,
          )
          notificationId = await scheduleRoutineNotification(
            id,
            merged.emoji,
            merged.name,
            hour,
            minute,
          )
        }
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

  const toggleRoutineNotification = useCallback(
    async (id: string) => {
      const routine = routines.find((r) => r.id === id)
      if (!routine) return

      const nextEnabled = !routine.notificationEnabled

      if (routine.notificationId) {
        await cancelRoutineNotification(routine.notificationId)
      }

      let notificationId: string | undefined
      if (nextEnabled) {
        const granted = await requestPermissions()
        if (granted) {
          const { hour, minute } = getEffectiveTime(
            routine.timeSlot,
            routine.customTime,
          )
          notificationId = await scheduleRoutineNotification(
            id,
            routine.emoji,
            routine.name,
            hour,
            minute,
          )
        }
      }

      updateRoutine(id, { notificationEnabled: nextEnabled, notificationId })
    },
    [updateRoutine, routines],
  )

  return {
    addRoutineWithNotification,
    updateRoutineWithNotification,
    removeRoutineWithNotification,
    toggleRoutineNotification,
  }
}
