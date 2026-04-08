import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useRoutineStore, Routine } from '../store/routineStore'

const EMOJIS = [
  '🏃', '💪', '🧘', '🚴', '🏊', '⚽',
  '📚', '✍️', '🎯', '💻', '🎸', '🎨',
  '🥗', '💊', '💧', '🛌', '🧹', '🌿',
  '🙏', '🫁', '❤️', '🧠', '☀️', '⭐',
]

const COLORS = [
  '#4ade80', '#60a5fa', '#f472b6', '#fb923c',
  '#a78bfa', '#34d399', '#fbbf24', '#f87171',
]

const TIME_SLOTS: { key: Routine['timeSlot']; label: string; desc: string }[] = [
  { key: 'morning', label: '🌅 아침', desc: '기상 ~ 오전' },
  { key: 'afternoon', label: '☀️ 오후', desc: '점심 ~ 저녁 전' },
  { key: 'evening', label: '🌙 저녁', desc: '저녁 이후' },
  { key: 'anytime', label: '⚡ 언제든', desc: '시간 무관' },
]

export default function AddRoutineScreen() {
  const router = useRouter()
  const { addRoutine } = useRoutineStore()

  const [name, setName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🏃')
  const [selectedColor, setSelectedColor] = useState('#4ade80')
  const [selectedSlot, setSelectedSlot] = useState<Routine['timeSlot']>('anytime')

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('이름을 입력해주세요')
      return
    }

    addRoutine({
      name: name.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
      timeSlot: selectedSlot,
    })

    router.back()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelBtn}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.title}>새 루틴</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.saveBtn, { color: selectedColor }]}>저장</Text>
          </TouchableOpacity>
        </View>

        {/* 미리보기 */}
        <View style={[styles.preview, { borderColor: selectedColor }]}>
          <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
          <Text style={styles.previewName}>{name || '루틴 이름'}</Text>
        </View>

        {/* 루틴 이름 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이름</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 물 2L 마시기"
            placeholderTextColor="#444"
            value={name}
            onChangeText={setName}
            maxLength={20}
            autoFocus
          />
        </View>

        {/* 이모지 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이모지</Text>
          <View style={styles.emojiGrid}>
            {EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiBtn,
                  selectedEmoji === emoji && {
                    backgroundColor: selectedColor + '30',
                    borderColor: selectedColor,
                  },
                ]}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 색상 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>색상</Text>
          <View style={styles.colorRow}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorBtn,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorBtnSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Text style={styles.colorCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 시간대 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>시간대</Text>
          <View style={styles.slotGrid}>
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot.key}
                style={[
                  styles.slotBtn,
                  selectedSlot === slot.key && {
                    borderColor: selectedColor,
                    backgroundColor: selectedColor + '15',
                  },
                ]}
                onPress={() => setSelectedSlot(slot.key)}
              >
                <Text style={styles.slotLabel}>{slot.label}</Text>
                <Text style={styles.slotDesc}>{slot.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  cancelBtn: { color: '#666', fontSize: 16 },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  saveBtn: { fontSize: 16, fontWeight: '600' },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 28,
  },
  previewEmoji: { fontSize: 28 },
  previewName: { color: '#fff', fontSize: 18, fontWeight: '500' },
  section: { marginBottom: 28 },
  sectionTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 24 },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBtnSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  colorCheck: { color: '#000', fontSize: 16, fontWeight: '700' },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotBtn: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
  },
  slotLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  slotDesc: { color: '#555', fontSize: 12, marginTop: 4 },
})
