import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useRoutineStore } from '../store/routineStore'
import MonthCalendar from '../components/MonthCalendar'
import { t } from '../i18n'

export default function EditHistoryScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()

  const routine = useRoutineStore((s) => s.routines.find((r) => r.id === id))
  const isChecked = useRoutineStore((s) => s.isChecked)
  const toggleCheck = useRoutineStore((s) => s.toggleCheck)

  const [month, setMonth] = useState(new Date())

  // 루틴이 없는 경우 (삭제됐거나 잘못된 id): 안전한 fallback
  if (!routine) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('editHistory.title')}</Text>
          <View style={styles.headerRight} />
        </View>
      </SafeAreaView>
    )
  }

  const minMonth = new Date(routine.createdAt)

  return (
    <SafeAreaView style={styles.safe}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('editHistory.title')}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {routine.emoji} {routine.name}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* 캘린더 */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MonthCalendar
          month={month}
          isDone={(dateStr) => isChecked(routine.id, dateStr)}
          onToggle={(dateStr) => toggleCheck(routine.id, dateStr)}
          color={routine.color}
          minMonth={minMonth}
          onPrev={() =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
          }
          onNext={() =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
          }
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backIcon: {
    color: '#fff',
    fontSize: 28,
    width: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRight: {
    width: 24,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
})
