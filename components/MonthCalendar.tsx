import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { i18n } from '../i18n'
import { toDateString, getWeekdayLabels, getToday } from '../utils/dateUtils'

// ─── helpers ────────────────────────────────────────────────────────────────

/** year*12+month — used for month-level comparisons */
function monthIndex(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth()
}

/** Number of days in a given year/month (0-based month) */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// ─── Props ───────────────────────────────────────────────────────────────────

export type MonthCalendarProps = {
  /** Any day within the visible month. */
  month: Date
  /** Returns true if the given YYYY-MM-DD date is marked done. */
  isDone: (dateStr: string) => boolean
  /** Called when the user taps a non-future day. */
  onToggle: (dateStr: string) => void
  /** Routine accent color applied to completed-day cells. */
  color: string
  /** Earliest navigable month (e.g. routine.createdAt). */
  minMonth: Date
  onPrev: () => void
  onNext: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MonthCalendar({
  month,
  isDone,
  onToggle,
  color,
  minMonth,
  onPrev,
  onNext,
}: MonthCalendarProps) {
  const locale = i18n.locale
  const today = getToday()

  const year = month.getFullYear()
  const monthNum = month.getMonth() // 0-based

  // Month title via Intl — no hardcoded names
  const monthTitle = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
  }).format(month)

  // Navigation bounds
  const canGoPrev = monthIndex(month) > monthIndex(minMonth)
  const canGoNext = monthIndex(month) < monthIndex(new Date())

  // Weekday header labels (Sunday-first, 7 items)
  const weekdayLabels = getWeekdayLabels(locale)

  // Day grid: leading empty pads + day cells
  const firstDayOfMonth = new Date(year, monthNum, 1)
  const leadingPads = firstDayOfMonth.getDay() // 0=Sun … 6=Sat
  const totalDays = daysInMonth(year, monthNum)

  // Build cell descriptors
  type DayCell =
    | { kind: 'pad'; key: string }
    | { kind: 'day'; key: string; day: number; dateStr: string }

  const cells: DayCell[] = []

  for (let i = 0; i < leadingPads; i++) {
    cells.push({ kind: 'pad', key: `pad-${i}` })
  }

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, monthNum, d)
    const dateStr = toDateString(date)
    cells.push({ kind: 'day', key: dateStr, day: d, dateStr })
  }

  // Pad trailing cells so the grid rows are complete multiples of 7
  const trailing = (7 - (cells.length % 7)) % 7
  for (let i = 0; i < trailing; i++) {
    cells.push({ kind: 'pad', key: `pad-trail-${i}` })
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={canGoPrev ? onPrev : undefined}
          disabled={!canGoPrev}
          hitSlop={12}
          style={styles.navBtn}
        >
          <Text style={[styles.navIcon, !canGoPrev && styles.navIconDisabled]}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.monthTitle}>{monthTitle}</Text>

        <TouchableOpacity
          onPress={canGoNext ? onNext : undefined}
          disabled={!canGoNext}
          hitSlop={12}
          style={styles.navBtn}
        >
          <Text style={[styles.navIcon, !canGoNext && styles.navIconDisabled]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekRow}>
        {weekdayLabels.map((label, idx) => (
          <View key={idx} style={styles.weekCell}>
            <Text style={styles.weekLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {cells.map((cell) => {
          if (cell.kind === 'pad') {
            return <View key={cell.key} style={styles.cell} />
          }

          const { dateStr, day } = cell
          const done = isDone(dateStr)
          const isToday = dateStr === today
          const isFuture = dateStr > today

          if (isFuture) {
            return (
              <View key={dateStr} style={[styles.cell, styles.dayCell]}>
                <Text style={styles.futureDayText}>{day}</Text>
              </View>
            )
          }

          // Past or today — pressable
          const cellBg: object = done
            ? { backgroundColor: color }
            : { backgroundColor: '#222' }

          const todayBorder: object = isToday
            ? { borderWidth: 1.5, borderColor: '#fff' }
            : {}

          return (
            <TouchableOpacity
              key={dateStr}
              style={[styles.cell, styles.dayCell, cellBg, todayBorder]}
              onPress={() => onToggle(dateStr)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayText, done && styles.doneDayText]}>
                {day}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 32,
    alignItems: 'center',
  },
  navIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 26,
  },
  navIconDisabled: {
    color: '#333',
  },
  monthTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },

  // Weekday header
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '500',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '13%',      // ~13% of row ≈ 7 cols with small gap via margin
    aspectRatio: 1,
    margin: '0.5%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    backgroundColor: '#222',
  },
  dayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '400',
  },
  doneDayText: {
    color: '#111',
    fontWeight: '600',
  },
  futureDayText: {
    color: '#333',
    fontSize: 13,
  },
})
