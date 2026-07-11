import { useEffect } from 'react'
import { AppState } from 'react-native'
import { useRoutineStore } from '../store/routineStore'
import { reconcileNotifications } from '../utils/notifications'

export function useNotificationSync() {
  const routines = useRoutineStore((s) => s.routines)
  const checkRecords = useRoutineStore((s) => s.checkRecords)

  // 루틴/체크 변경 시 재조정(디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      const { routines: rs, isChecked } = useRoutineStore.getState()
      reconcileNotifications(rs, isChecked)
    }, 400)
    return () => clearTimeout(timer)
  }, [routines, checkRecords])

  // 앱 포그라운드 복귀 시 재조정
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const { routines: rs, isChecked } = useRoutineStore.getState()
        reconcileNotifications(rs, isChecked)
      }
    })
    return () => sub.remove()
  }, [])
}
