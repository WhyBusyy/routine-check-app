import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

type TimeValue = { hour: number; minute: number }

type Props = {
  value: TimeValue
  onChange: (value: TimeValue) => void
  color?: string
}

const MINUTE_STEP = 5

function wrap(n: number, max: number): number {
  return ((n % max) + max) % max
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export default function TimePicker({ value, onChange, color = '#4ade80' }: Props) {
  const changeHour = (delta: number) => {
    onChange({ ...value, hour: wrap(value.hour + delta, 24) })
  }

  const changeMinute = (delta: number) => {
    onChange({ ...value, minute: wrap(value.minute + delta * MINUTE_STEP, 60) })
  }

  return (
    <View style={styles.container}>
      <View style={styles.column}>
        <TouchableOpacity
          style={styles.stepBtn}
          hitSlop={8}
          onPress={() => changeHour(1)}
        >
          <Text style={[styles.stepText, { color }]}>▲</Text>
        </TouchableOpacity>
        <Text style={styles.valueText}>{pad(value.hour)}</Text>
        <TouchableOpacity
          style={styles.stepBtn}
          hitSlop={8}
          onPress={() => changeHour(-1)}
        >
          <Text style={[styles.stepText, { color }]}>▼</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.colon}>:</Text>

      <View style={styles.column}>
        <TouchableOpacity
          style={styles.stepBtn}
          hitSlop={8}
          onPress={() => changeMinute(1)}
        >
          <Text style={[styles.stepText, { color }]}>▲</Text>
        </TouchableOpacity>
        <Text style={styles.valueText}>{pad(value.minute)}</Text>
        <TouchableOpacity
          style={styles.stepBtn}
          hitSlop={8}
          onPress={() => changeMinute(-1)}
        >
          <Text style={[styles.stepText, { color }]}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingVertical: 12,
  },
  column: {
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  stepText: {
    fontSize: 18,
    fontWeight: '700',
  },
  valueText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    minWidth: 52,
    textAlign: 'center',
  },
  colon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
})
