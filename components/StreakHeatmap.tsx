import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'

type Props = {
  data: { date: string; count: number }[]
  color?: string
}

const COLS = 12  // 12주
const ROWS = 7   // 7일

export default function StreakHeatmap({ data, color = '#4ade80' }: Props) {
  // 데이터를 2D 그리드로 변환 (열 우선)
  const grid: { date: string; count: number }[][] = []
  for (let col = 0; col < COLS; col++) {
    const week: { date: string; count: number }[] = []
    for (let row = 0; row < ROWS; row++) {
      const idx = col * ROWS + row
      if (idx < data.length) {
        week.push(data[idx])
      }
    }
    grid.push(week)
  }

  const totalChecked = data.filter((d) => d.count > 0).length
  const longestStreak = (() => {
    let max = 0
    let current = 0
    for (const d of data) {
      if (d.count > 0) {
        current++
        max = Math.max(max, current)
      } else {
        current = 0
      }
    }
    return max
  })()

  return (
    <View style={styles.container}>
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{totalChecked}일</Text>
          <Text style={styles.statLabel}>총 완료</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{longestStreak}일</Text>
          <Text style={styles.statLabel}>최장 연속</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>
            {data.length > 0 ? Math.round((totalChecked / data.length) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>달성률</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {/* 요일 라벨 */}
          <View style={styles.dayLabels}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <Text key={i} style={styles.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* 히트맵 그리드 */}
          <View style={styles.weeks}>
            {grid.map((week, colIdx) => (
              <View key={colIdx} style={styles.week}>
                {week.map((day, rowIdx) => (
                  <View
                    key={rowIdx}
                    style={[
                      styles.cell,
                      day.count > 0
                        ? { backgroundColor: color }
                        : { backgroundColor: '#2a2a2a' },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <Text style={styles.legendLabel}>적음</Text>
        {[0, 0.3, 0.6, 1].map((opacity, i) => (
          <View
            key={i}
            style={[
              styles.legendCell,
              opacity === 0
                ? { backgroundColor: '#2a2a2a' }
                : { backgroundColor: color, opacity },
            ]}
          />
        ))}
        <Text style={styles.legendLabel}>많음</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statVal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: 6,
    paddingTop: 2,
  },
  dayLabel: {
    color: '#555',
    fontSize: 10,
    height: 14,
    lineHeight: 14,
    marginBottom: 2,
  },
  weeks: {
    flexDirection: 'row',
    gap: 3,
  },
  week: {
    flexDirection: 'column',
    gap: 2,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 3,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    color: '#555',
    fontSize: 10,
    marginHorizontal: 2,
  },
})
