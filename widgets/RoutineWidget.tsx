/**
 * iOS 홈 위젯 구현
 * expo-widget-kit 또는 react-native-widgetkit 사용
 *
 * 설치: npm install react-native-widgetkit
 * iOS only — Android는 별도 Glance 위젯 구현 필요
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

// 위젯에서 사용할 데이터 타입
export type WidgetData = {
  routines: Array<{
    id: string
    name: string
    emoji: string
    color: string
    checked: boolean
  }>
  progress: {
    completed: number
    total: number
  }
  date: string
}

/**
 * 위젯 데이터를 MMKV shared storage에 저장
 * App Group 설정 필요: com.yourapp.routinecheck
 *
 * app.json에 추가:
 * "ios": {
 *   "entitlements": {
 *     "com.apple.security.application-groups": ["group.com.yourapp.routinecheck"]
 *   }
 * }
 */
export const saveWidgetData = (data: WidgetData) => {
  // MMKV App Group storage
  // const sharedStorage = new MMKV({ id: 'widget-storage', path: 'group.com.yourapp.routinecheck' })
  // sharedStorage.set('widgetData', JSON.stringify(data))

  // 위젯 타임라인 새로고침 트리거
  // WidgetKit.reloadAllTimelines()
  console.log('Widget data saved:', data)
}

/**
 * Small 위젯 (2x2) — 오늘 진행률 표시
 * SwiftUI로 구현하거나 react-native-widgetkit 사용
 */
export function SmallWidget({ data }: { data: WidgetData }) {
  const pct = data.progress.total === 0
    ? 0
    : Math.round((data.progress.completed / data.progress.total) * 100)

  return (
    <View style={styles.small}>
      <Text style={styles.smallPct}>{pct}%</Text>
      <Text style={styles.smallLabel}>
        {data.progress.completed}/{data.progress.total}
      </Text>
      <Text style={styles.smallDate}>{data.date}</Text>
    </View>
  )
}

/**
 * Medium 위젯 (4x2) — 루틴 목록 표시
 */
export function MediumWidget({ data }: { data: WidgetData }) {
  return (
    <View style={styles.medium}>
      <View style={styles.mediumHeader}>
        <Text style={styles.mediumTitle}>오늘의 루틴</Text>
        <Text style={styles.mediumPct}>
          {data.progress.completed}/{data.progress.total}
        </Text>
      </View>
      {data.routines.slice(0, 4).map((routine) => (
        <View key={routine.id} style={styles.mediumRow}>
          <View
            style={[
              styles.mediumDot,
              routine.checked
                ? { backgroundColor: routine.color }
                : { backgroundColor: '#333' },
            ]}
          />
          <Text style={styles.mediumEmoji}>{routine.emoji}</Text>
          <Text
            style={[
              styles.mediumName,
              routine.checked && { color: '#555', textDecorationLine: 'line-through' },
            ]}
          >
            {routine.name}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  small: {
    flex: 1,
    backgroundColor: '#111',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  smallPct: { color: '#4ade80', fontSize: 32, fontWeight: '700' },
  smallLabel: { color: '#666', fontSize: 13, marginTop: 4 },
  smallDate: { color: '#444', fontSize: 11, marginTop: 6 },
  medium: {
    flex: 1,
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 20,
  },
  mediumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mediumTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  mediumPct: { color: '#4ade80', fontSize: 14, fontWeight: '600' },
  mediumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  mediumDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mediumEmoji: { fontSize: 14 },
  mediumName: { color: '#ccc', fontSize: 13 },
})

/**
 * 네이티브 위젯 구현 가이드
 *
 * iOS (Swift/SwiftUI):
 * 1. Xcode에서 Widget Extension 타겟 추가
 * 2. App Group 설정으로 앱 ↔ 위젯 데이터 공유
 * 3. UserDefaults(suiteName:) 또는 FileManager로 데이터 읽기
 * 4. TimelineProvider로 위젯 업데이트 스케줄링
 *
 * Android (Kotlin/Glance):
 * 1. AppWidgetProvider 서브클래스 생성
 * 2. SharedPreferences로 데이터 공유
 * 3. Glance Composable로 UI 정의
 * 4. WorkManager로 주기적 업데이트
 */
