import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Rect } from 'react-native-svg'
import { useRoutineStore } from '../store/routineStore'

type Tab = 'weekly' | 'monthly'

export default function StatsScreen() {
  const router = useRouter()
  const { routines, checkRecords } = useRoutineStore()
  const [tab, setTab] = useState<Tab>('weekly')

  // 주간 데이터: 최근 7일 일별 완료 수
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000)
      .toISOString()
      .split('T')[0]
    const count = checkRecords.filter((c) => c.date === date).length
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const dayOfWeek = dayNames[new Date(date + 'T00:00:00').getDay()]
    return { date, count, dayOfWeek }
  })

  const maxWeekly = Math.max(...weeklyData.map((d) => d.count), 1)

  // 월간 데이터: 최근 30일 히트맵
  const monthlyData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 86400000)
      .toISOString()
      .split('T')[0]
    const count = checkRecords.filter((c) => c.date === date).length
    return { date, count }
  })

  const maxMonthly = Math.max(...monthlyData.map((d) => d.count), 1)

  // 루틴별 완료율 (최근 30일 기준)
  const thirtyDaysAgo = new Date(Date.now() - 29 * 86400000)
    .toISOString()
    .split('T')[0]

  const routineStats = routines.map((routine) => {
    const completedDays = checkRecords.filter(
      (c) => c.routineId === routine.id && c.date >= thirtyDaysAgo
    ).length
    const rate = Math.round((completedDays / 30) * 100)
    return { ...routine, completedDays, rate }
  }).sort((a, b) => b.rate - a.rate)

  // 전체 통계
  const totalChecks = checkRecords.filter((c) => c.date >= thirtyDaysAgo).length
  const avgPerDay = routines.length > 0
    ? (totalChecks / 30).toFixed(1)
    : '0'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← 돌아가기</Text>
          </TouchableOpacity>
          <Text style={styles.title}>통계</Text>
          <View style={{ width: 80 }} />
        </View>

        {/* 요약 카드 */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalChecks}</Text>
            <Text style={styles.summaryLabel}>30일 총 체크</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{avgPerDay}</Text>
            <Text style={styles.summaryLabel}>일 평균</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{routines.length}</Text>
            <Text style={styles.summaryLabel}>루틴 수</Text>
          </View>
        </View>

        {/* 탭 */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'weekly' && styles.tabBtnActive]}
            onPress={() => setTab('weekly')}
          >
            <Text style={[styles.tabText, tab === 'weekly' && styles.tabTextActive]}>
              주간
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'monthly' && styles.tabBtnActive]}
            onPress={() => setTab('monthly')}
          >
            <Text style={[styles.tabText, tab === 'monthly' && styles.tabTextActive]}>
              월간
            </Text>
          </TouchableOpacity>
        </View>

        {/* 주간 바 차트 */}
        {tab === 'weekly' && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>최근 7일 완료 수</Text>
            <Svg width="100%" height={160} viewBox="0 0 280 160">
              {weeklyData.map((d, i) => {
                const barHeight = (d.count / maxWeekly) * 110
                const x = i * 40 + 10
                return (
                  <React.Fragment key={d.date}>
                    {/* Bar background */}
                    <Rect
                      x={x}
                      y={10}
                      width={24}
                      height={110}
                      rx={6}
                      fill="#2a2a2a"
                    />
                    {/* Bar value */}
                    <Rect
                      x={x}
                      y={10 + (110 - barHeight)}
                      width={24}
                      height={barHeight}
                      rx={6}
                      fill="#4ade80"
                      opacity={d.count > 0 ? 0.5 + (d.count / maxWeekly) * 0.5 : 0}
                    />
                  </React.Fragment>
                )
              })}
            </Svg>
            <View style={styles.barLabels}>
              {weeklyData.map((d) => (
                <View key={d.date} style={styles.barLabelItem}>
                  <Text style={styles.barLabelCount}>{d.count}</Text>
                  <Text style={styles.barLabelDay}>{d.dayOfWeek}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 월간 히트맵 */}
        {tab === 'monthly' && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>최근 30일 활동</Text>
            <View style={styles.heatmapGrid}>
              {monthlyData.map((d) => (
                <View
                  key={d.date}
                  style={[
                    styles.heatmapCell,
                    d.count > 0
                      ? { backgroundColor: '#4ade80', opacity: 0.3 + (d.count / maxMonthly) * 0.7 }
                      : { backgroundColor: '#2a2a2a' },
                  ]}
                />
              ))}
            </View>
            <View style={styles.heatmapLegend}>
              <Text style={styles.legendText}>적음</Text>
              {[0, 0.3, 0.6, 1].map((op, i) => (
                <View
                  key={i}
                  style={[
                    styles.legendCell,
                    op === 0
                      ? { backgroundColor: '#2a2a2a' }
                      : { backgroundColor: '#4ade80', opacity: op },
                  ]}
                />
              ))}
              <Text style={styles.legendText}>많음</Text>
            </View>
          </View>
        )}

        {/* 루틴별 완료율 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>루틴별 달성률 (30일)</Text>
          {routineStats.map((routine) => (
            <View key={routine.id} style={styles.routineStatRow}>
              <View style={styles.routineStatLeft}>
                <Text style={styles.routineStatEmoji}>{routine.emoji}</Text>
                <Text style={styles.routineStatName}>{routine.name}</Text>
              </View>
              <View style={styles.routineStatRight}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${routine.rate}%`,
                        backgroundColor: routine.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.routineStatRate, { color: routine.color }]}>
                  {routine.rate}%
                </Text>
              </View>
            </View>
          ))}
          {routineStats.length === 0 && (
            <Text style={styles.emptyText}>루틴을 추가하면 통계가 표시됩니다</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: { color: '#666', fontSize: 15 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#2a2a2a',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 24,
  },
  chartTitle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 12,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  barLabelItem: {
    alignItems: 'center',
    width: 32,
  },
  barLabelCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  barLabelDay: {
    color: '#555',
    fontSize: 11,
    marginTop: 2,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    marginVertical: 12,
  },
  heatmapCell: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 8,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    color: '#555',
    fontSize: 10,
    marginHorizontal: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  routineStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  routineStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routineStatEmoji: {
    fontSize: 20,
  },
  routineStatName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  routineStatRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2a2a2a',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  routineStatRate: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
})
