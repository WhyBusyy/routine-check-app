# 루틴 알림 커스터마이징 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 루틴별로 알림 시각을 직접 지정하고(슬롯 기본 시간 override), 알림을 켜고 끌 수 있게 한다.

**Architecture:** `Routine` 모델에 `notificationEnabled`·`customTime`를 추가하고, persist 마이그레이션으로 기존 데이터를 백필한다. 알림 유틸은 effective time(custom ?? 슬롯 기본)을 계산해 예약하고, 스케줄 분기와 토글은 `useRoutineActions` 훅에 모은다. UI는 편집 화면의 알림 섹션 + 경량 `TimePicker` + 홈 리스트의 종 토글로 구성한다.

**Tech Stack:** Expo, React Native, TypeScript, Zustand(persist + MMKV), expo-notifications, expo-haptics.

**검증 방식:** 자동 테스트 없음(프로젝트에 테스트 인프라 없음). 각 태스크는 `npx tsc --noEmit` 타입체크를 통과해야 하고, UI 태스크는 `npx expo start`로 실행해 수동 검증한다.

---

## 변경 파일 구조

- `store/routineStore.ts` — `Routine` 타입에 `notificationEnabled`·`customTime` 추가, persist `version`+`migrate` 추가 (모델/영속)
- `utils/notifications.ts` — `getEffectiveTime`·`formatTime` 헬퍼 추가, `scheduleRoutineNotification` 시그니처를 hour/minute로 변경 (서비스)
- `hooks/useRoutineActions.ts` — enabled 분기 + `toggleRoutineNotification` 추가 (서비스)
- `components/TimePicker.tsx` — 의존성 없는 경량 시/분 선택 컴포넌트 (신규, 뷰)
- `app/add-routine.tsx` — 알림 on/off + 시간 모드 + TimePicker 섹션 (뷰)
- `components/RoutineItem.tsx` — 종 토글 + effective time 표시 (뷰)

태스크 순서는 bisectable 하도록 모델 → 서비스 → 뷰 순서로 배치한다.

---

## Task 1: 데이터 모델 + persist 마이그레이션

**Files:**
- Modify: `store/routineStore.ts`

- [ ] **Step 1: `Routine` 타입에 필드 추가**

`store/routineStore.ts`의 `Routine` 타입(현재 14-22행)을 아래로 교체:

```ts
export type Routine = {
  id: string
  name: string
  emoji: string
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'anytime'
  color: string
  createdAt: string
  notificationId?: string
  notificationEnabled: boolean
  customTime?: { hour: number; minute: number }
}
```

- [ ] **Step 2: persist 설정에 version + migrate 추가**

`store/routineStore.ts`의 persist 옵션 객체(현재 154-157행)를 아래로 교체:

```ts
{
  name: 'routine-store',
  storage: createJSONStorage(() => mmkvStorage),
  version: 1,
  migrate: (persisted: any, version: number) => {
    if (version === 0 && persisted?.routines) {
      persisted.routines = persisted.routines.map((r: any) => ({
        notificationEnabled: true,
        ...r,
      }))
    }
    return persisted as RoutineStore
  },
}
```

> 기존 저장 데이터는 version 0 → 1로 올라가며 각 루틴에 `notificationEnabled: true`가 백필된다. `customTime`은 `undefined`로 둔다.

- [ ] **Step 3: 타입체크**

Run: `cd ~/Desktop/DR_APP && npx tsc --noEmit`
Expected: `addRoutine` 호출부(`useRoutineActions.ts`)에서 `notificationEnabled` 누락 에러가 날 수 있음 — Task 3에서 해결되므로 이 태스크에서는 `routineStore.ts` 자체에 에러가 없으면 통과로 본다.

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/DR_APP
git add store/routineStore.ts
git commit -m "feat(store): 루틴 알림 on/off·커스텀 시간 필드 추가 및 마이그레이션"
```

---

## Task 2: 알림 유틸 — effective time 계산

**Files:**
- Modify: `utils/notifications.ts`

- [ ] **Step 1: `getEffectiveTime`·`formatTime` 헬퍼 추가**

`utils/notifications.ts`의 `TIME_SLOT_HOURS` 선언(현재 11-16행) 바로 아래에 추가:

```ts
export function getEffectiveTime(
  timeSlot: string,
  customTime?: { hour: number; minute: number },
): { hour: number; minute: number } {
  return customTime ?? TIME_SLOT_HOURS[timeSlot] ?? TIME_SLOT_HOURS.anytime
}

export function formatTime(hour: number, minute: number): string {
  const hh = hour.toString().padStart(2, '0')
  const mm = minute.toString().padStart(2, '0')
  return `${hh}:${mm}`
}
```

- [ ] **Step 2: `scheduleRoutineNotification` 시그니처를 hour/minute로 변경**

`utils/notifications.ts`의 `scheduleRoutineNotification` 함수(현재 26-48행)를 아래로 교체:

```ts
export async function scheduleRoutineNotification(
  routineId: string,
  emoji: string,
  name: string,
  hour: number,
  minute: number,
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '루틴 체크',
      body: `${emoji} ${name} 할 시간이에요!`,
      data: { routineId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })

  return id
}
```

- [ ] **Step 3: 타입체크**

Run: `cd ~/Desktop/DR_APP && npx tsc --noEmit`
Expected: `useRoutineActions.ts`에서 `scheduleRoutineNotification` 호출 인자 불일치 에러가 날 수 있음 — Task 3에서 해결되므로 `notifications.ts` 자체에 에러가 없으면 통과로 본다.

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/DR_APP
git add utils/notifications.ts
git commit -m "feat(notifications): effective time 계산 헬퍼 및 hour/minute 기반 예약"
```

---

## Task 3: 스케줄 분기 + 토글 액션

**Files:**
- Modify: `hooks/useRoutineActions.ts`

- [ ] **Step 1: import에 `getEffectiveTime` 추가**

`hooks/useRoutineActions.ts`의 import 블록(현재 3-7행)을 아래로 교체:

```ts
import {
  requestPermissions,
  scheduleRoutineNotification,
  cancelRoutineNotification,
  getEffectiveTime,
} from '../utils/notifications'
```

- [ ] **Step 2: `addRoutineWithNotification`을 enabled 분기로 교체**

현재 함수(12-32행)를 아래로 교체:

```ts
  const addRoutineWithNotification = useCallback(
    async (data: Omit<Routine, 'id' | 'createdAt' | 'notificationId'>) => {
      addRoutine(data)

      const newRoutines = useRoutineStore.getState().routines
      const newRoutine = newRoutines[newRoutines.length - 1]
      if (!newRoutine) return

      if (newRoutine.notificationEnabled) {
        const granted = await requestPermissions()
        if (granted) {
          const { hour, minute } = getEffectiveTime(
            newRoutine.timeSlot,
            newRoutine.customTime,
          )
          const notificationId = await scheduleRoutineNotification(
            newRoutine.id,
            newRoutine.emoji,
            newRoutine.name,
            hour,
            minute,
          )
          updateRoutine(newRoutine.id, { notificationId })
        }
      }
    },
    [addRoutine, updateRoutine],
  )
```

- [ ] **Step 3: `updateRoutineWithNotification`을 enabled 분기로 교체**

현재 함수(34-56행)를 아래로 교체:

```ts
  const updateRoutineWithNotification = useCallback(
    async (id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => {
      const routine = routines.find((r) => r.id === id)

      if (routine?.notificationId) {
        await cancelRoutineNotification(routine.notificationId)
      }

      const merged = { ...routine, ...updates } as Routine
      let notificationId: string | undefined

      if (merged.notificationEnabled) {
        const granted = await requestPermissions()
        if (granted) {
          const { hour, minute } = getEffectiveTime(
            merged.timeSlot,
            merged.customTime,
          )
          notificationId = await scheduleRoutineNotification(
            id,
            merged.emoji,
            merged.name,
            hour,
            minute,
          )
        }
      }

      updateRoutine(id, { ...updates, notificationId })
    },
    [updateRoutine, routines],
  )
```

- [ ] **Step 4: `toggleRoutineNotification` 액션 추가**

`removeRoutineWithNotification` 함수(현재 58-67행) 바로 아래(`return {` 직전)에 추가:

```ts
  const toggleRoutineNotification = useCallback(
    async (id: string) => {
      const routine = routines.find((r) => r.id === id)
      if (!routine) return

      const nextEnabled = !routine.notificationEnabled

      if (routine.notificationId) {
        await cancelRoutineNotification(routine.notificationId)
      }

      let notificationId: string | undefined
      if (nextEnabled) {
        const granted = await requestPermissions()
        if (granted) {
          const { hour, minute } = getEffectiveTime(
            routine.timeSlot,
            routine.customTime,
          )
          notificationId = await scheduleRoutineNotification(
            id,
            routine.emoji,
            routine.name,
            hour,
            minute,
          )
        }
      }

      updateRoutine(id, { notificationEnabled: nextEnabled, notificationId })
    },
    [updateRoutine, routines],
  )
```

- [ ] **Step 5: return 객체에 `toggleRoutineNotification` 추가**

현재 return 블록(69-73행)을 아래로 교체:

```ts
  return {
    addRoutineWithNotification,
    updateRoutineWithNotification,
    removeRoutineWithNotification,
    toggleRoutineNotification,
  }
```

- [ ] **Step 6: 타입체크**

Run: `cd ~/Desktop/DR_APP && npx tsc --noEmit`
Expected: `add-routine.tsx`에서 `addRoutineWithNotification` 인자에 `notificationEnabled` 누락 에러가 날 수 있음 — Task 5에서 해결. `useRoutineActions.ts`·`notifications.ts`·`routineStore.ts` 에러가 없으면 통과로 본다.

- [ ] **Step 7: Commit**

```bash
cd ~/Desktop/DR_APP
git add hooks/useRoutineActions.ts
git commit -m "feat(routine-actions): 알림 enabled 분기 및 toggleRoutineNotification 추가"
```

---

## Task 4: 경량 TimePicker 컴포넌트

**Files:**
- Create: `components/TimePicker.tsx`

- [ ] **Step 1: TimePicker 작성**

`components/TimePicker.tsx` 신규 생성:

```tsx
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
```

> 분은 5분 단위(`MINUTE_STEP`)로 증감하며 0/24, 0/60 경계에서 순환한다. 의존성 추가 없음.

- [ ] **Step 2: 타입체크**

Run: `cd ~/Desktop/DR_APP && npx tsc --noEmit`
Expected: `TimePicker.tsx`에 에러 없음.

- [ ] **Step 3: Commit**

```bash
cd ~/Desktop/DR_APP
git add components/TimePicker.tsx
git commit -m "feat(components): 의존성 없는 경량 TimePicker 추가"
```

---

## Task 5: 편집 화면 알림 섹션

**Files:**
- Modify: `app/add-routine.tsx`

- [ ] **Step 1: import 추가**

`app/add-routine.tsx` 상단 import에서 react-native 블록에 `Switch`를 추가하고, 컴포넌트·헬퍼 import를 추가한다. 현재 1-14행을 아래로 교체:

```tsx
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
  Switch,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useRoutineStore, Routine } from '../store/routineStore'
import { useRoutineActions } from '../hooks/useRoutineActions'
import TimePicker from '../components/TimePicker'
import { getEffectiveTime } from '../utils/notifications'
```

- [ ] **Step 2: 알림 관련 상태 추가**

현재 상태 선언부 마지막 줄(`const [selectedSlot, ...]`, 47행) 바로 아래에 추가:

```tsx
  const [notificationEnabled, setNotificationEnabled] = useState(
    existingRoutine?.notificationEnabled ?? true,
  )
  const [useCustomTime, setUseCustomTime] = useState(
    !!existingRoutine?.customTime,
  )
  const [customTime, setCustomTime] = useState(
    existingRoutine?.customTime ??
      getEffectiveTime(existingRoutine?.timeSlot ?? 'anytime', undefined),
  )
```

- [ ] **Step 3: save 핸들러에 알림 필드 전달**

현재 `handleSave`의 update/add 호출(56-69행)을 아래로 교체:

```tsx
    const notificationFields = {
      notificationEnabled,
      customTime: useCustomTime ? customTime : undefined,
    }

    if (isEditing && id) {
      await updateRoutineWithNotification(id, {
        name: name.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
        timeSlot: selectedSlot,
        ...notificationFields,
      })
    } else {
      await addRoutineWithNotification({
        name: name.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
        timeSlot: selectedSlot,
        ...notificationFields,
      })
    }
```

- [ ] **Step 4: 알림 섹션 UI 추가**

시간대 선택 섹션이 끝나는 `</View>`(현재 178행, `{/* 시간대 선택 */}` 블록의 닫는 태그) 바로 아래, `<View style={{ height: 40 }} />`(180행) 직전에 추가:

```tsx
        {/* 알림 설정 */}
        <View style={styles.section}>
          <View style={styles.notiHeader}>
            <Text style={styles.sectionTitle}>알림</Text>
            <Switch
              value={notificationEnabled}
              onValueChange={setNotificationEnabled}
              trackColor={{ false: '#333', true: selectedColor }}
              thumbColor="#fff"
            />
          </View>

          {notificationEnabled && (
            <>
              <View style={styles.notiModeRow}>
                <TouchableOpacity
                  style={[
                    styles.notiModeBtn,
                    !useCustomTime && {
                      borderColor: selectedColor,
                      backgroundColor: selectedColor + '15',
                    },
                  ]}
                  onPress={() => setUseCustomTime(false)}
                >
                  <Text style={styles.notiModeLabel}>슬롯 기본 시간</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.notiModeBtn,
                    useCustomTime && {
                      borderColor: selectedColor,
                      backgroundColor: selectedColor + '15',
                    },
                  ]}
                  onPress={() => {
                    setCustomTime(getEffectiveTime(selectedSlot, undefined))
                    setUseCustomTime(true)
                  }}
                >
                  <Text style={styles.notiModeLabel}>직접 지정</Text>
                </TouchableOpacity>
              </View>

              {useCustomTime && (
                <View style={{ marginTop: 12 }}>
                  <TimePicker
                    value={customTime}
                    onChange={setCustomTime}
                    color={selectedColor}
                  />
                </View>
              )}
            </>
          )}
        </View>
```

> "직접 지정" 탭으로 전환 시 현재 슬롯의 기본 시간을 시작값으로 채운다. "슬롯 기본 시간"으로 되돌리면 저장 시 `customTime`이 `undefined`로 전달된다(Step 3).

- [ ] **Step 5: 스타일 추가**

`StyleSheet.create({ ... })` 안의 마지막 항목(`slotDesc`, 274행) 뒤에 추가:

```tsx
  notiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notiModeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  notiModeBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    alignItems: 'center',
  },
  notiModeLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
```

> 주의: `notiHeader`가 `sectionTitle`의 `marginBottom: 12`와 겹치지 않도록 알림 섹션 제목은 `notiHeader` 안에 두었다. 기존 `sectionTitle`은 그대로 둔다.

- [ ] **Step 6: 타입체크**

Run: `cd ~/Desktop/DR_APP && npx tsc --noEmit`
Expected: 에러 없음(0 errors).

- [ ] **Step 7: 수동 검증**

Run: `cd ~/Desktop/DR_APP && npx expo start`
시뮬레이터/기기에서 확인:
1. 새 루틴 추가 화면에 "알림" 섹션이 보이고 스위치 기본값이 ON이다.
2. 스위치를 OFF하면 모드 버튼/피커가 사라진다.
3. "직접 지정"을 누르면 TimePicker가 나타나고 ▲▼로 시/분이 바뀐다(분은 5분 단위).
4. 저장 후 다시 편집 화면을 열면 설정한 값이 유지된다.

- [ ] **Step 8: Commit**

```bash
cd ~/Desktop/DR_APP
git add app/add-routine.tsx
git commit -m "feat(add-routine): 알림 on/off 및 커스텀 시간 설정 UI"
```

---

## Task 6: 홈 리스트 종 토글 + 시각 표시

**Files:**
- Modify: `components/RoutineItem.tsx`

- [ ] **Step 1: import 추가**

`components/RoutineItem.tsx`의 import 블록(현재 11-12행)을 아래로 교체:

```tsx
import { useRoutineStore, Routine } from '../store/routineStore'
import { getToday, streakEmoji } from '../utils/dateUtils'
import { useRoutineActions } from '../hooks/useRoutineActions'
import { getEffectiveTime, formatTime } from '../utils/notifications'
```

- [ ] **Step 2: 토글 액션·effective time 계산**

`RoutineItem` 함수 본문에서 `const streak = getStreak(routine.id)`(현재 33행) 바로 아래에 추가:

```tsx
  const { toggleRoutineNotification } = useRoutineActions()
  const effectiveTime = getEffectiveTime(routine.timeSlot, routine.customTime)
```

- [ ] **Step 3: 종 버튼 핸들러 추가**

같은 함수 안 `handlePress` 정의(38-59행) 아래에 추가:

```tsx
  const handleBellPress = useCallback(() => {
    Haptics.selectionAsync()
    toggleRoutineNotification(routine.id)
  }, [routine.id, toggleRoutineNotification])
```

- [ ] **Step 4: 시각 표시 텍스트 변경**

현재 시간대 라벨(128-130행)을 아래로 교체:

```tsx
                <Text style={styles.timeSlot}>
                  {TIME_SLOT_LABEL[routine.timeSlot]}
                  {routine.notificationEnabled
                    ? ` · ${formatTime(effectiveTime.hour, effectiveTime.minute)}`
                    : ' · 알림 꺼짐'}
                </Text>
```

- [ ] **Step 5: 오른쪽 영역에 종 버튼 추가**

현재 streak 블록(135-140행)을 아래로 교체(streak를 종과 함께 `right` 컨테이너로 묶음):

```tsx
          <View style={styles.right}>
            {streak > 0 && (
              <View style={styles.streak}>
                <Text style={styles.streakEmoji}>{streakEmoji(streak)}</Text>
                <Text style={styles.streakCount}>{streak}일</Text>
              </View>
            )}
            <TouchableOpacity onPress={handleBellPress} hitSlop={8}>
              <Text style={styles.bell}>
                {routine.notificationEnabled ? '🔔' : '🔕'}
              </Text>
            </TouchableOpacity>
          </View>
```

- [ ] **Step 6: 스타일 추가**

`StyleSheet.create({ ... })` 안에서 `streak` 스타일(194-196행) 바로 앞에 추가:

```tsx
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bell: {
    fontSize: 20,
  },
```

- [ ] **Step 7: 타입체크**

Run: `cd ~/Desktop/DR_APP && npx tsc --noEmit`
Expected: 에러 없음(0 errors).

- [ ] **Step 8: 수동 검증**

Run: `cd ~/Desktop/DR_APP && npx expo start`
시뮬레이터/기기에서 확인:
1. 홈 리스트 각 루틴 우측에 종 아이콘(🔔)이 보인다.
2. 종을 탭하면 🔔↔🔕로 토글되고, 라벨이 "아침 · 09:00" ↔ "아침 · 알림 꺼짐"으로 바뀐다.
3. 커스텀 시간을 지정한 루틴은 해당 시각(예: "아침 · 07:30")이 표시된다.
4. 앱을 껐다 켜도(영속) 토글 상태와 시각이 유지된다.

- [ ] **Step 9: Commit**

```bash
cd ~/Desktop/DR_APP
git add components/RoutineItem.tsx
git commit -m "feat(routine-item): 알림 종 토글 및 적용 시각 표시"
```

---

## 최종 검증

- [ ] **전체 타입체크**

Run: `cd ~/Desktop/DR_APP && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **수동 시나리오 검증** (`npx expo start`)

1. 새 루틴을 알림 OFF로 생성 → 홈에서 🔕 표시, 알림 예약 안 됨.
2. 새 루틴을 "직접 지정" 07:30으로 생성 → 홈에서 "· 07:30" 표시.
3. 기존 루틴(마이그레이션 대상)이 알림 ON 상태로 정상 표시되는지 확인.
4. 알림 권한을 거부한 상태에서 토글 ON → 앱이 크래시 없이 동작(예약만 생략).
