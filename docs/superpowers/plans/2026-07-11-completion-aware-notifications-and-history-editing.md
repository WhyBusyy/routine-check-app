# 완료 인지 알림 + 체크 이력 소급 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** (①) 루틴을 그날 완료하면 그날 알림을 보내지 않도록 알림을 롤링 개별 방식으로 재설계하고, (②) 히트맵을 탭해 과거 체크를 수정하는 월간 캘린더 편집 화면을 추가한다.

**Architecture:** DAILY 반복 트리거 → 개별 DATE 트리거(루틴×N일). `content.data{routineId,dateStr}`로 특정 날짜 식별. `useNotificationSync` 훅이 앱 포그라운드·스토어 변경 시 전체 재조정(취소 후 미완료·미래분만 N일치 재예약). 편집은 `edit-history` 화면 + `MonthCalendar`가 `toggleCheck`로 임의 날짜 토글.

**Tech Stack:** Expo SDK 52, React Native, TypeScript, expo-notifications, zustand+MMKV, expo-router, i18n-js.

**검증:** 자동 테스트 없음(방침). 각 태스크 `npx tsc --noEmit` + UI 태스크 수동 확인. (서브에이전트는 git 금지 — 컨트롤러가 커밋.)

**작업 위치:** 워크트리(컨트롤러가 `~/dev/DR_APP`에서 `git worktree add`로 생성). node_modules 심링크됨.

---

## 변경/신규 파일
- 변경: `utils/notifications.ts`, `store/routineStore.ts`, `hooks/useRoutineActions.ts`, `app/_layout.tsx`, `app/index.tsx`, `components/StreakHeatmap.tsx`, `i18n/locales/*`(전 13개)
- 신규: `hooks/useNotificationSync.ts`, `app/edit-history.tsx`, `components/MonthCalendar.tsx`

순서: 알림 서비스 → 모델/액션 → sync 훅 → 캘린더 → 편집화면 → 히트맵 배선 → 최종.

---

## Task 1: 알림 스케줄링 재설계 (utils/notifications.ts)

**Files:** Modify `utils/notifications.ts`; Modify `i18n/locales/ko.ts`·`en.ts`(+ 나머지 11 로케일은 Task 5와 함께, 여기선 ko/en만)

- [ ] **Step 1: 알림 문구 i18n 키 추가 (ko.ts, en.ts)**

ko.ts에 최상위 형제로 추가:
```ts
  notification: {
    title: '루틴 체크',
    body: '%{emoji} %{name} 할 시간이에요!',
  },
```
en.ts:
```ts
  notification: {
    title: 'Routine Check',
    body: '%{emoji} %{name} — time to check in!',
  },
```

- [ ] **Step 2: `utils/notifications.ts` 재작성**

`Notifications.setNotificationHandler`, `TIME_SLOT_HOURS`, `getEffectiveTime`, `formatTime`, `requestPermissions`는 유지. `scheduleRoutineNotification`·`cancelRoutineNotification`을 아래로 교체:

```ts
import { toDateString } from './dateUtils'
import { t } from '../i18n'

export type NotifRoutine = {
  id: string
  emoji: string
  name: string
  timeSlot: string
  customTime?: { hour: number; minute: number }
  notificationEnabled: boolean
}

const MAX_TOTAL = 60 // iOS 64개 제한 여유
const MAX_DAYS = 14

/** date의 effective time에 단발 알림 예약(발송 시각이 미래일 때만) */
export async function scheduleRoutineDay(
  routine: NotifRoutine,
  date: Date,
): Promise<void> {
  const { hour, minute } = getEffectiveTime(routine.timeSlot, routine.customTime)
  const fireDate = new Date(date)
  fireDate.setHours(hour, minute, 0, 0)
  if (fireDate.getTime() <= Date.now()) return
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t('notification.title'),
      body: t('notification.body', { emoji: routine.emoji, name: routine.name }),
      data: { routineId: routine.id, dateStr: toDateString(fireDate) },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  })
}

async function ours() {
  const all = await Notifications.getAllScheduledNotificationsAsync()
  return all.filter((s) => (s.content.data as any)?.routineId)
}

export async function cancelRoutineDay(routineId: string, dateStr: string): Promise<void> {
  const list = await ours()
  await Promise.all(
    list
      .filter((s) => {
        const d = s.content.data as any
        return d.routineId === routineId && d.dateStr === dateStr
      })
      .map((s) => Notifications.cancelScheduledNotificationAsync(s.identifier)),
  )
}

export async function cancelAllForRoutine(routineId: string): Promise<void> {
  const list = await ours()
  await Promise.all(
    list
      .filter((s) => (s.content.data as any).routineId === routineId)
      .map((s) => Notifications.cancelScheduledNotificationAsync(s.identifier)),
  )
}

/**
 * 전체 재조정: 우리 앱 예약을 모두 취소하고, 활성 루틴에 대해 오늘부터 N일 중
 * 미완료·미래 시각인 날만 재예약한다. N은 iOS 64개 제한을 고려해 적응적으로 결정.
 */
export async function reconcileNotifications(
  routines: NotifRoutine[],
  isChecked: (routineId: string, dateStr: string) => boolean,
): Promise<void> {
  const list = await ours()
  await Promise.all(list.map((s) => Notifications.cancelScheduledNotificationAsync(s.identifier)))

  const granted = (await Notifications.getPermissionsAsync()).status === 'granted'
  if (!granted) return

  const enabled = routines.filter((r) => r.notificationEnabled)
  if (enabled.length === 0) return

  const N = Math.max(1, Math.min(MAX_DAYS, Math.floor(MAX_TOTAL / enabled.length)))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const r of enabled) {
    for (let i = 0; i < N; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dateStr = toDateString(d)
      if (isChecked(r.id, dateStr)) continue
      await scheduleRoutineDay(r, d)
    }
  }
}
```

- [ ] **Step 3: 타입체크**
`npx tsc --noEmit` → `useRoutineActions.ts`가 아직 옛 `scheduleRoutineNotification`/`cancelRoutineNotification`을 import해 에러날 수 있음(Task 2에서 해결). `notifications.ts` 자체 에러 0이면 통과.

- [ ] **Step 4: 보고** (커밋은 컨트롤러) — 변경 파일·tsc 결과.

---

## Task 2: 모델 정리 + 액션 재작성

**Files:** Modify `store/routineStore.ts`, `hooks/useRoutineActions.ts`

- [ ] **Step 1: `store/routineStore.ts`에서 `notificationId` 제거**
`Routine` 타입의 `notificationId?: string` 줄 삭제. (다른 곳에서 안 쓰이므로 store 로직 변경 없음.)

- [ ] **Step 2: `hooks/useRoutineActions.ts` 재작성**
개별 스케줄링 로직 제거. 재조정은 `useNotificationSync`(Task 3)가 스토어 변경으로 처리하므로, 액션은 스토어만 바꾸고 삭제 시에만 즉시 취소한다. 전체 교체:

```ts
import { useCallback } from 'react'
import { useRoutineStore, Routine } from '../store/routineStore'
import { requestPermissions, cancelAllForRoutine } from '../utils/notifications'

export function useRoutineActions() {
  const { addRoutine, updateRoutine, removeRoutine } = useRoutineStore()

  const addRoutineWithNotification = useCallback(
    async (data: Omit<Routine, 'id' | 'createdAt'>) => {
      addRoutine(data)
      if (data.notificationEnabled) await requestPermissions()
      // 실제 예약은 useNotificationSync가 스토어 변경을 감지해 재조정한다.
    },
    [addRoutine],
  )

  const updateRoutineWithNotification = useCallback(
    async (id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => {
      updateRoutine(id, updates)
      if (updates.notificationEnabled) await requestPermissions()
    },
    [updateRoutine],
  )

  const removeRoutineWithNotification = useCallback(
    async (id: string) => {
      await cancelAllForRoutine(id)
      removeRoutine(id)
    },
    [removeRoutine],
  )

  const toggleRoutineNotification = useCallback(
    async (id: string) => {
      const routine = useRoutineStore.getState().routines.find((r) => r.id === id)
      if (!routine) return
      const nextEnabled = !routine.notificationEnabled
      if (nextEnabled) await requestPermissions()
      updateRoutine(id, { notificationEnabled: nextEnabled })
    },
    [updateRoutine],
  )

  return {
    addRoutineWithNotification,
    updateRoutineWithNotification,
    removeRoutineWithNotification,
    toggleRoutineNotification,
  }
}
```

> `addRoutineWithNotification`의 인자 타입이 `Omit<Routine,'id'|'createdAt'>`로 바뀐다(‘notificationId’ 제외 문구 제거). 호출부(`app/add-routine.tsx`)는 이미 `notificationEnabled`/`customTime`을 넘기므로 그대로 호환.

- [ ] **Step 3: 타입체크** — `npx tsc --noEmit` → notifications.ts·routineStore.ts·useRoutineActions.ts 에러 0. (`useNotificationSync` 미장착 상태라 앱 동작은 Task 3 후 완성.)

- [ ] **Step 4: 보고**

---

## Task 3: 재조정 훅 (hooks/useNotificationSync.ts) + 마운트

**Files:** Create `hooks/useNotificationSync.ts`; Modify `app/_layout.tsx`

- [ ] **Step 1: `hooks/useNotificationSync.ts` 생성**
```ts
import { useEffect } from 'react'
import { AppState } from 'react-native'
import { useRoutineStore } from '../store/routineStore'
import { reconcileNotifications } from '../utils/notifications'

export function useNotificationSync() {
  const routines = useRoutineStore((s) => s.routines)
  const checkRecords = useRoutineStore((s) => s.checkRecords)

  // 루틴/체크 변경 시 재조정(디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      const { routines: rs, isChecked } = useRoutineStore.getState()
      reconcileNotifications(rs, isChecked)
    }, 400)
    return () => clearTimeout(timer)
  }, [routines, checkRecords])

  // 앱 포그라운드 복귀 시 재조정
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const { routines: rs, isChecked } = useRoutineStore.getState()
        reconcileNotifications(rs, isChecked)
      }
    })
    return () => sub.remove()
  }, [])
}
```

- [ ] **Step 2: `app/_layout.tsx`에 훅 마운트**
`RootLayout` 함수 본문에 `useNotificationSync()` 호출 추가(기존 language 로직 유지). import 추가:
```tsx
import { useNotificationSync } from '../hooks/useNotificationSync'
```
`RootLayout` 안, `setI18nLocale(effectiveLocale)` 아래에 `useNotificationSync()` 추가.

- [ ] **Step 3: 타입체크 + 수동 확인** — `npx tsc --noEmit` 0. `npx expo start`(가능 시)로 루틴 완료→예약 목록에서 오늘 건 사라짐, 재실행 시 보충 확인.

- [ ] **Step 4: 보고**

---

## Task 4: 월간 캘린더 컴포넌트 (components/MonthCalendar.tsx)

**Files:** Create `components/MonthCalendar.tsx`

- [ ] **Step 1: 컴포넌트 작성**
Props: `month: Date`(해당 월 아무 날), `isDone: (dateStr) => boolean`, `onToggle: (dateStr) => void`, `color: string`, `minMonth: Date`(이 월 이전 이동 불가), `onPrev`/`onNext`. 요일 헤더는 `getWeekdayLabels(i18n.locale)`(일요일 시작), 월 제목은 `Intl.DateTimeFormat(i18n.locale,{year:'numeric',month:'long'})`. 날짜 그리드는 해당 월 1일의 요일만큼 앞을 빈칸으로, 각 날짜 셀:
- 완료: `color` 채움. 오늘: 테두리. **미래(오늘 초과): 비활성(흐리게, onPress 없음)**.
- 탭 시 `onToggle(toDateString(date))`.
prev 버튼은 `month`가 `minMonth` 이하이면 비활성; next 버튼은 `month`가 이번 달 이상이면 비활성(미래 달 금지).
다크 테마(#111/#1a1a1a/#2a2a2a). `toDateString`/비교는 `utils/dateUtils` 사용. 순수 컴포넌트(내부 상태 없음, 부모가 month 관리).

- [ ] **Step 2: 타입체크 + 보고** — `npx tsc --noEmit` 0.

---

## Task 5: 편집 화면 (app/edit-history.tsx) + i18n

**Files:** Create `app/edit-history.tsx`; Modify `i18n/locales/*`(13개 전부)

- [ ] **Step 1: `editHistory.*` 키 추가 (13개 로케일 전부)**
각 로케일에 `editHistory: { title: <해당 언어> }` 추가. ko '이력 수정', en 'Edit history', ja '履歴を編集', zh-Hans '编辑记录', zh-Hant '編輯記錄', es 'Editar historial', fr "Modifier l'historique", de 'Verlauf bearbeiten', pt-BR 'Editar histórico', ru 'Изменить историю', it 'Modifica cronologia', id 'Edit riwayat', vi 'Chỉnh sửa lịch sử'. (ko/en은 정본; 나머지는 값 채움.)

- [ ] **Step 2: `app/edit-history.tsx` 생성**
`useLocalSearchParams`로 `id` 취득 → `useRoutineStore`에서 routine 조회 + `isChecked`, `toggleCheck` 사용. 로컬 상태 `month`(기본 이번 달). `MonthCalendar`에 `isDone={(ds)=>isChecked(id, ds)}`, `onToggle={(ds)=>toggleCheck(id, ds)}`, `color={routine.color}`, `minMonth`=routine.createdAt의 월, `onPrev/onNext`로 month 이동(미래 금지). 헤더: 뒤로가기 + `${emoji} ${name}` + `t('editHistory.title')`. SafeAreaView 다크 테마. 라우트는 expo-router 파일 기반이라 별도 등록 불필요(Stack 자동).

- [ ] **Step 3: 타입체크 + 보고** — `npx tsc --noEmit` 0.

---

## Task 6: 히트맵 탭 → 편집 진입

**Files:** Modify `components/StreakHeatmap.tsx`, `app/index.tsx`

- [ ] **Step 1: StreakHeatmap에 onPress 추가**
Props에 `onPress?: () => void` 추가. 최상위 `View`(container)를 `TouchableOpacity`로 바꾸고(스타일 동일) `onPress={onPress} activeOpacity={0.9}` 부여. 내부 가로 ScrollView와의 제스처 충돌을 피하려면 container를 TouchableOpacity로 감싸되 셀 자체엔 핸들러 없음(전체 탭 = 편집 진입).

- [ ] **Step 2: `app/index.tsx`에서 편집 화면으로 연결**
`<StreakHeatmap data={heatmapData} color={routine.color} />`에 `onPress={() => router.push('/edit-history?id=' + routine.id)}` 추가. `router`는 이미 사용 중.

- [ ] **Step 3: 타입체크 + 수동 확인 + 보고** — `npx tsc --noEmit` 0. 히트맵 탭→편집 화면, 과거 날짜 토글→히트맵/스트릭 반영, 미래 비활성 확인.

---

## Task 7: 최종 검증

- [ ] **Step 1: 전체 tsc** — `npx tsc --noEmit` → 0 errors.
- [ ] **Step 2: 로케일 키 완전성** — ko의 모든 키가 12개 로케일에 존재(특히 신규 `notification.*`, `editHistory.*`). (컨트롤러가 스크립트로 확인.)
- [ ] **Step 3: 수동 시나리오** (`npx expo start` 가능 시):
  1. 오늘 완료 → 예약 목록에서 오늘 건 취소.
  2. 완료 해제(시각 미경과) → 오늘 건 재예약.
  3. 포그라운드 복귀 → N일치 보충, 과거·발송 건 정리.
  4. 활성 루틴 다수 → 총 예약 ≤ 60.
  5. 히트맵 탭 → 편집, 과거 토글 반영, 미래 비활성.

---

## 자가 검토 메모
- 스펙의 ①(롤링 재조정·완료 시 오늘 취소·N 적응·notificationId 제거)과 ②(히트맵 탭→월간 캘린더 편집·미래 비활성·자동 반영)가 Task 1~6에 매핑됨.
- 알림 문구 i18n(notification.*)은 스펙의 "touching this file" 개선으로 포함(기존 하드코딩 한국어 해소).
- 타입 시그니처: `NotifRoutine`(notifications.ts) ← Routine이 구조적으로 호환. `reconcileNotifications(routines, isChecked)` 시그니처 Task 1 정의 = Task 3 호출 일치.
- `expo-localization` 패치(patch-package)는 배포 시 유지됨(이번 작업 무관).
