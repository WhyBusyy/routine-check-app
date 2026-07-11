# 완료 인지 알림 + 체크 이력 소급 수정 설계

작성일: 2026-07-11

## 배경

- 현재 알림은 `expo-notifications`의 **DAILY 반복 트리거**로 예약된다(루틴당 단일 `notificationId`). 반복 트리거는 특정 하루만 취소할 수 없어, "오늘 이미 완료했으면 오늘 알림은 안 보내기"가 불가능하다.
- 체크는 `store.toggleCheck(routineId, date)`로 임의 날짜를 토글할 수 있으나, 과거 날짜를 수정할 UI가 없다. 스트릭·히트맵·진행률은 모두 `checkRecords`에서 파생되므로 소급 수정 시 자동 갱신된다.

## 목표

1. **완료 시 알림 미전송**: 루틴을 그날 완료하면 그날 남은 알림을 보내지 않는다.
2. **체크 이력 소급 수정**: 히트맵을 탭해 편집 화면을 열고, 특정 과거 날짜의 완료/미완료를 바꾼다.

## 비목표

- 서버/푸시 알림 도입(로컬 알림 유지).
- 알림 스누즈·다중 시간대 알림.
- 주간 반복 요일 지정(매일 유지).

## 설계 결정 (합의됨)

- 알림을 **DAILY 반복 → 롤링 개별(DATE 트리거)** 방식으로 재설계.
- 소급 수정 UI는 **히트맵 탭 → 월간 캘린더 편집 화면**.

---

## 기능 ①: 완료 인지 롤링 알림

### expo-notifications 제약 (근거)
- 로컬 알림은 예약 시 OS에 등록되어 앱이 꺼져 있어도 발송되며, 발송 시점에 JS 코드는 실행되지 않는다.
- 수신 핸들러는 앱 실행 중에만 동작하므로 "발송 순간 완료 여부로 숨기기"는 불가.
- DAILY 반복은 식별자 1개라 하루만 취소 불가.
- iOS는 앱당 예약 알림 **최대 64개**.

### 접근: 롤링 개별 알림 + 재조정
루틴마다 향후 N일치 알림을 **개별 DATE 트리거**로 예약하고, 앱 코드에서 재조정한다.

### `utils/notifications.ts` 변경
- `getEffectiveTime`, `formatTime`, `requestPermissions` 유지.
- `scheduleRoutineNotification`(DAILY) **제거**. 대신:
  - `scheduleRoutineDay(routine, date: Date): Promise<void>` — `date`의 effective time에 단발 DATE 트리거로 예약. `content.data = { routineId, dateStr }`(YYYY-MM-DD). 발송 시각이 **미래일 때만** 예약.
  - `cancelRoutineDay(routineId, dateStr): Promise<void>` — `getAllScheduledNotificationsAsync()`에서 `data.routineId && data.dateStr` 일치 건 취소.
  - `cancelAllForRoutine(routineId): Promise<void>` — `data.routineId` 일치 전부 취소.
- 식별은 저장된 id가 아니라 **`content.data`(routineId/dateStr) 조회**로 한다 → 루틴 모델에서 `notificationId` 불필요.

### 데이터 모델
- `store/routineStore.ts`의 `Routine.notificationId?: string` **제거**(더 이상 사용 안 함). `notificationEnabled`, `customTime`은 유지.
- persist 마이그레이션 불필요(필드 제거는 무시되며, 재조정이 스케줄 상태를 재구축).

### 재조정 로직 — 신설 `hooks/useNotificationSync.ts`
루트(`app/_layout.tsx`)에 마운트. 다음 시점에 `reconcile()` 호출:
- 앱 **포그라운드 복귀**(`AppState` 'active') 및 최초 마운트.
- 스토어의 **`routines` 또는 `checkRecords` 변경**(zustand 구독, 짧은 디바운스).

`reconcile()` 동작:
1. 권한 없으면 중단.
2. `enabled = routines.filter(notificationEnabled)`. `N = clamp(floor(60 / max(1, enabled.length)), 1, 14)`.
3. 우리 앱의 기존 예약(`data.routineId` 보유) 전부 취소.
4. 각 enabled 루틴에 대해 오늘부터 N일: 해당 날짜가 **미완료**이고 발송 시각이 미래이면 `scheduleRoutineDay` 예약(오늘 완료 시 오늘 건 자동 제외).

> 전체 취소 후 재구축이므로 기존 DAILY 방식 알림도 자연히 대체된다(마이그레이션 불필요).

### `hooks/useRoutineActions.ts` 변경
- add/update/remove/toggleNotification에서 개별 `scheduleRoutineNotification`/`notificationId` 로직 제거.
- 대신 각 액션 후 재조정을 트리거(간단히는 스토어 변경으로 `useNotificationSync`가 반응). `removeRoutineWithNotification`은 `cancelAllForRoutine(id)` 호출 후 삭제.

### 홈 체크 토글
- `RoutineItem`의 `toggleCheck`(오늘 토글)는 스토어를 바꾸므로 `useNotificationSync`가 자동 재조정 → 오늘 완료 시 오늘 알림 취소, 해제 시(시간 미경과) 재예약.

---

## 기능 ②: 체크 이력 소급 수정

### 진입: 히트맵 탭
- `components/StreakHeatmap.tsx`에 옵셔널 `onPress?: () => void` 추가, 전체를 `TouchableOpacity`로 감싼다(표시는 그대로).
- 홈(`app/index.tsx`)·통계(`app/stats.tsx`)에서 선택된 루틴의 히트맵 `onPress`에 `router.push('/edit-history?id=' + routineId)` 연결.

### 편집 화면: `app/edit-history.tsx` (신설)
- `id` 파라미터로 루틴 조회. 헤더에 루틴 이모지+이름 + 뒤로가기.
- **월간 캘린더**(`components/MonthCalendar.tsx` 신설): 요일 헤더(Intl short weekday, 일요일 시작) + 해당 월 날짜 그리드.
  - 완료일: 루틴 색으로 채움. 오늘: 테두리 강조.
  - **미래 날짜: 비활성**(탭 불가, 흐리게).
  - 이전/다음 달 이동. 미래 달로는 이동 불가. 과거는 루틴 `createdAt` 월까지(그 이전은 이동 불가).
- 날짜 탭 → `toggleCheck(routineId, dateStr)`. 스트릭·히트맵·진행률 자동 반영.
- 오늘을 편집하면 ①의 재조정이 함께 동작.
- 월/요일 명칭은 `Intl.DateTimeFormat(i18n.locale, ...)`, 그 외 문구는 `t('editHistory.*')`.

### i18n
- `editHistory.title`(예: '이력 수정' / 'Edit history') 키를 13개 로케일에 추가(다른 로케일은 en 폴백이 아니라 실제 값; 소량이므로 T-스타일로 채움).

---

## 영향 범위 / 변경·신규 파일

- 변경: `utils/notifications.ts`(스케줄 API 재설계), `store/routineStore.ts`(`notificationId` 제거), `hooks/useRoutineActions.ts`(스케줄 로직 교체), `app/_layout.tsx`(sync 훅 마운트), `app/index.tsx`·`app/stats.tsx`(히트맵 onPress→편집 진입), `components/StreakHeatmap.tsx`(onPress), `i18n/locales/*`(editHistory 키)
- 신규: `hooks/useNotificationSync.ts`, `app/edit-history.tsx`, `components/MonthCalendar.tsx`

## 검증

자동 테스트 인프라 없음(방침). `npx tsc --noEmit` + 수동 시나리오:
1. 오늘 루틴 완료 → 예약된 오늘 알림이 취소되는지(예약 목록 확인).
2. 완료 해제(시간 미경과) → 오늘 알림 재예약.
3. 앱 재실행/포그라운드 복귀 → N일치로 보충, 과거·발송 건 정리.
4. 활성 루틴 다수 → 총 예약 ≤ 60 유지(N 축소).
5. 히트맵 탭 → 편집 화면, 과거 날짜 토글 시 스트릭·히트맵 반영, 미래 날짜 비활성.
