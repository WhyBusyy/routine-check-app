import React, { useCallback, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import { useRoutineStore, Routine } from '../store/routineStore'
import { getToday, streakEmoji } from '../utils/dateUtils'

type Props = {
  routine: Routine
  onLongPress?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

const TIME_SLOT_LABEL: Record<Routine['timeSlot'], string> = {
  morning: '아침',
  afternoon: '오후',
  evening: '저녁',
  anytime: '언제든',
}

export default function RoutineItem({ routine, onLongPress, onEdit, onDelete }: Props) {
  const { isChecked, toggleCheck, getStreak } = useRoutineStore()
  const today = getToday()
  const checked = isChecked(routine.id, today)
  const streak = getStreak(routine.id)

  const scaleAnim = useRef(new Animated.Value(1)).current
  const swipeableRef = useRef<Swipeable>(null)

  const handlePress = useCallback(() => {
    Haptics.impactAsync(
      checked
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    )

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.93,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start()

    toggleCheck(routine.id, today)
  }, [checked, routine.id, today])

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeBtn, styles.editBtn]}
        onPress={() => {
          swipeableRef.current?.close()
          onEdit?.()
        }}
      >
        <Text style={styles.swipeBtnText}>수정</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeBtn, styles.deleteBtn]}
        onPress={() => {
          swipeableRef.current?.close()
          onDelete?.()
        }}
      >
        <Text style={styles.swipeBtnText}>삭제</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePress}
          onLongPress={onLongPress}
          style={[
            styles.container,
            checked && { borderColor: routine.color, borderWidth: 1.5 },
          ]}
        >
          <View style={styles.left}>
            <View
              style={[
                styles.checkCircle,
                checked
                  ? { backgroundColor: routine.color }
                  : { backgroundColor: 'transparent', borderColor: '#3a3a3a', borderWidth: 1.5 },
              ]}
            >
              {checked && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>

            <View style={styles.info}>
              <Text style={styles.emoji}>{routine.emoji}</Text>
              <View>
                <Text
                  style={[
                    styles.name,
                    checked && { color: '#888', textDecorationLine: 'line-through' },
                  ]}
                >
                  {routine.name}
                </Text>
                <Text style={styles.timeSlot}>
                  {TIME_SLOT_LABEL[routine.timeSlot]}
                </Text>
              </View>
            </View>
          </View>

          {streak > 0 && (
            <View style={styles.streak}>
              <Text style={styles.streakEmoji}>{streakEmoji(streak)}</Text>
              <Text style={styles.streakCount}>{streak}일</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Swipeable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 24,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  timeSlot: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  streak: {
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakCount: {
    color: '#666',
    fontSize: 11,
    marginTop: 1,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 4,
    paddingLeft: 8,
  },
  swipeBtn: {
    width: 60,
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    backgroundColor: '#60a5fa',
  },
  deleteBtn: {
    backgroundColor: '#f87171',
  },
  swipeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
})
