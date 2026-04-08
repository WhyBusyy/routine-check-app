import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

type Props = {
  completed: number
  total: number
  size?: number
  color?: string
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export default function ProgressRing({
  completed,
  total,
  size = 120,
  color = '#4ade80',
}: Props) {
  const progress = total === 0 ? 0 : completed / total
  const percentage = Math.round(progress * 100)

  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const animatedOffset = useRef(new Animated.Value(circumference)).current

  useEffect(() => {
    Animated.timing(animatedOffset, {
      toValue: strokeDashoffset,
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [strokeDashoffset])

  const allDone = completed === total && total > 0

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* 배경 링 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2a2a2a"
          strokeWidth={8}
          fill="transparent"
        />
        {/* 진행 링 */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={allDone ? '#fbbf24' : color}
          strokeWidth={8}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* 중앙 텍스트 */}
      <View style={[styles.center, { width: size, height: size }]}>
        {allDone ? (
          <Text style={styles.doneEmoji}>🎉</Text>
        ) : (
          <>
            <Text style={[styles.percentage, { color: allDone ? '#fbbf24' : color }]}>
              {percentage}%
            </Text>
            <Text style={styles.fraction}>
              {completed}/{total}
            </Text>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: 26,
    fontWeight: '700',
  },
  fraction: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  doneEmoji: {
    fontSize: 36,
  },
})
