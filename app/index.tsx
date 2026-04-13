import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useRoutineStore } from '../store/routineStore'
import { useRoutineActions } from '../hooks/useRoutineActions'
import RoutineItem from '../components/RoutineItem'
import ProgressRing from '../components/ProgressRing'
import StreakHeatmap from '../components/StreakHeatmap'
import Confetti from '../components/Confetti'
import { formatDate, getToday } from '../utils/dateUtils'

const TIME_SLOTS = [
  { key: 'morning', label: '🌅 아침' },
  { key: 'afternoon', label: '☀️ 오후' },
  { key: 'evening', label: '🌙 저녁' },
  { key: 'anytime', label: '⚡ 언제든' },
] as const

export default function HomeScreen() {
  const router = useRouter()
  const { routines, getTodayProgress, getHeatmapData } = useRoutineStore()
  const { removeRoutineWithNotification } = useRoutineActions()
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const { completed, total } = getTodayProgress()
  const today = getToday()
  const allDone = completed === total && total > 0

  // 전체 완료 시 confetti 표시
  React.useEffect(() => {
    if (allDone) setShowConfetti(true)
  }, [allDone])

  const handleLongPress = useCallback((id: string) => {
    Alert.alert('루틴 관리', '이 루틴을 어떻게 할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '수정',
        onPress: () => router.push(`/add-routine?id=${id}`),
      },
      {
        text: '삭제',
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
            <Text style={styles.dateText}>{formatDate(today)}</Text>
            <Text style={styles.greeting}>
              {completed === total && total > 0
                ? '오늘 루틴 완료! 🎉'
                : '오늘의 루틴'}
            </Text>
          </View>
          <View style={styles.headerButtons}>
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
              <Text style={styles.progressTitle}>오늘 달성률</Text>
              <Text style={styles.progressDesc}>
                {total - completed}개 남았어요
              </Text>
              {completed > 0 && (
                <Text style={styles.progressMotivation}>
                  {completed === total ? '완벽해요! 💯' : '잘 하고 있어요 💪'}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* 루틴 없을 때 */}
        {routines.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>루틴을 추가해보세요</Text>
            <Text style={styles.emptyDesc}>
              매일 반복할 습관을 만들어{'\n'}작은 성취를 쌓아가세요
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/add-routine')}
            >
              <Text style={styles.emptyBtnText}>+ 첫 루틴 추가하기</Text>
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
