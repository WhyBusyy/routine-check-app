import React, { useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useRoutineStore, Routine } from '../store/routineStore'
import { getToday, streakEmoji } from '../utils/dateUtils'

type Props = {
  routine: Routine
  onLongPress?: () => void
}

const TIME_SLOT_LABEL: Record<Routine['timeSlot'], string> = {
  morning: '아침',
  afternoon: '오후',
  evening: '저녁',
  anytime: '언제든',
}

export default function RoutineItem({ routine, onLongPress }: Props) {
  const { isChecked, toggleCheck, getStreak } = useRoutineStore()
  const today = getToday()
  const checked = isChecked(routine.id, today)
  const streak = getStreak(routine.id)

  const scaleAnim = React.useRef(new Animated.Value(1)).current

  const handlePress = useCallback(() => {
    // 체크 시 햅틱 피드백
    Haptics.impactAsync(
      checked
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    )

    // 체크 애니메이션
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

  return (
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
          {/* 체크 인디케이터 */}
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

          {/* 이모지 + 이름 */}
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

        {/* 스트릭 */}
        {streak > 0 && (
          <View style={styles.streak}>
            <Text style={styles.streakEmoji}>{streakEmoji(streak)}</Text>
            <Text style={styles.streakCount}>{streak}일</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
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
})
