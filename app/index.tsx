import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  AppState,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useRoutineStore } from '../store/routineStore'
import { useRoutineActions } from '../hooks/useRoutineActions'
import RoutineItem from '../components/RoutineItem'
import ProgressRing from '../components/ProgressRing'
import StreakHeatmap from '../components/StreakHeatmap'
import Confetti from '../components/Confetti'
import { formatDate, getToday } from '../utils/dateUtils'
import { t, i18n } from '../i18n'

const TIME_SLOTS = [
  { key: 'morning', labelKey: 'home.slotMorning' as const },
  { key: 'afternoon', labelKey: 'home.slotAfternoon' as const },
  { key: 'evening', labelKey: 'home.slotEvening' as const },
  { key: 'anytime', labelKey: 'home.slotAnytime' as const },
] as const

export default function HomeScreen() {
  const router = useRouter()
  const { routines, getTodayProgress, getHeatmapData } = useRoutineStore()
  const { removeRoutineWithNotification } = useRoutineActions()
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [today, setToday] = useState(getToday())
  const { completed, total } = getTodayProgress()
  const allDone = completed === total && total > 0

  // 날짜 변경 감지: 자정 타이머 + 앱 포그라운드 복귀 시 체크
  useEffect(() => {
    const checkDateChange = () => {
      const current = getToday()
      setToday((prev) => (prev !== current ? current : prev))
    }

    // 다음 자정까지 남은 시간 계산 후 타이머 세팅
    const scheduleNextMidnight = () => {
      const now = new Date()
      const nextMidnight = new Date(now)
      nextMidnight.setHours(24, 0, 5, 0) // 자정 + 5초 여유
      const msUntilMidnight = nextMidnight.getTime() - now.getTime()
      return setTimeout(() => {
        checkDateChange()
        timer = scheduleNextMidnight()
      }, msUntilMidnight)
    }

    let timer = scheduleNextMidnight()

    // 앱이 백그라운드에서 돌아올 때 즉시 체크
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkDateChange()
    })

    return () => {
      clearTimeout(timer)
      sub.remove()
    }
  }, [])

  // 전체 완료 시 confetti 표시
  useEffect(() => {
    if (allDone) setShowConfetti(true)
  }, [allDone])

  const handleLongPress = useCallback((id: string) => {
    Alert.alert(t('home.manageTitle'), t('home.manageMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.edit'),
        onPress: () => router.push(`/add-routine?id=${id}`),
      },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => removeRoutineWithNotification(id),
      },
    ])
  }, [removeRoutineWithNotification, router])

  const selectedRoutine = routines.find((r) => r.id === selectedRoutineId)
  const heatmapData = selectedRoutineId
    ? getHeatmapData(selectedRoutineId)
    : []

  const routinesBySlot = TIME_SLOTS.map((slot) => ({
    ...slot,
    label: t(slot.labelKey),
    routines: routines.filter((r) => r.timeSlot === slot.key),
  })).filter((slot) => slot.routines.length > 0)

  return (
    <SafeAreaView style={styles.safe}>
      <Confetti visible={showConfetti} onDone={() => setShowConfetti(false)} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{formatDate(today, i18n.locale)}</Text>
            <Text style={styles.greeting}>
              {completed === total && total > 0
                ? t('home.greetingDone')
                : t('home.greeting')}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.addBtnText}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/stats')}
            >
              <Text style={styles.addBtnText}>📊</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/add-routine')}
            >
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 진행률 링 */}
        {total > 0 && (
          <View style={styles.progressSection}>
            <ProgressRing completed={completed} total={total} size={130} />
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>{t('home.todayRate')}</Text>
              <Text style={styles.progressDesc}>
                {t('home.remaining', { count: total - completed })}
              </Text>
              {completed > 0 && (
                <Text style={styles.progressMotivation}>
                  {completed === total ? t('home.motivationPerfect') : t('home.motivationGood')}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* 루틴 없을 때 */}
        {routines.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>
            <Text style={styles.emptyDesc}>
              {t('home.emptyDesc')}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/add-routine')}
            >
              <Text style={styles.emptyBtnText}>{t('home.emptyButton')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 시간대별 루틴 목록 */}
        {routinesBySlot.map((slot) => (
          <View key={slot.key} style={styles.slotSection}>
            <Text style={styles.slotTitle}>{slot.label}</Text>
            {slot.routines.map((routine) => (
              <View key={routine.id}>
                <RoutineItem
                  routine={routine}
                  onTap={() =>
                    setSelectedRoutineId(
                      selectedRoutineId === routine.id ? null : routine.id
                    )
                  }
                  onLongPress={() => handleLongPress(routine.id)}
                  onEdit={() => router.push(`/add-routine?id=${routine.id}`)}
                  onDelete={() => removeRoutineWithNotification(routine.id)}
                />
                {/* 히트맵 (선택 시 펼침) */}
                {selectedRoutineId === routine.id && (
                  <View style={styles.heatmapContainer}>
                    <StreakHeatmap
                      data={heatmapData}
                      color={routine.color}
                      onPress={() => router.push('/edit-history?id=' + routine.id)}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    color: '#666',
    fontSize: 13,
  },
  greeting: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 28,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 20,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    color: '#888',
    fontSize: 13,
  },
  progressDesc: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  progressMotivation: {
    color: '#4ade80',
    fontSize: 14,
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDesc: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  slotSection: {
    marginBottom: 20,
  },
  slotTitle: {
    color: '#555',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  heatmapContainer: {
    marginTop: -4,
    marginBottom: 10,
  },
})
