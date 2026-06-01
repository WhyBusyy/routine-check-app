# 루틴 알림 커스터마이징 설계

작성일: 2026-06-02

## 배경

현재 루틴 알림은 `utils/notifications.ts`의 `TIME_SLOT_HOURS`에 시간이
하드코딩되어 있다(아침 09:00 / 오후 15:00 / 저녁 20:00 / 언제든 19:00).
루틴은 `timeSlot` 4종 중 하나를 가지며, 권한이 허용되면 추가/수정 시 항상
매일 1회 알림이 예약된다. 사용자가 알림 시각을 직접 정하거나, 루틴별로
알림을 끌 방법이 없다.

## 목표

1. 기본 시간대(슬롯) 외에 루틴별로 정확한 알림 시각을 직접 지정할 수 있다.
2. 루틴별로 알림을 켜고 끌 수 있다.

## 비목표

- 슬롯 기본 시간의 전역 편집(설정에서 일괄 변경)은 하지 않는다.
- 루틴당 다중 알림(하루 여러 번)은 하지 않는다 — 매일 1회 유지.
- 네이티브 타임피커 의존성 추가는 하지 않는다.

## 설계 결정

- **시간 모델**: 슬롯 유지 + 개별 커스텀 시간(override). `timeSlot`은 홈 화면
  그룹 분류에 계속 사용하고, `customTime`이 있으면 그 시각으로 알림을 예약한다.
- **on/off 제어**: 루틴 편집 화면에서 설정 + 홈 리스트에서 빠른 토글. 새 루틴
  기본값은 ON(기존 동작 유지).
- **시각 입력 UI**: 의존성 없는 경량 커스텀 JS 피커. 네이티브 리빌드 불필요.

## 데이터 모델 (`store/routineStore.ts`)

`Routine` 타입에 필드 추가:

```ts
notificationEnabled: boolean                    // 알림 on/off, 기본 true
customTime?: { hour: number; minute: number }   // 있으면 슬롯 기본시간 대신 사용
```

- `customTime`이 없으면 기존처럼 `TIME_SLOT_HOURS[timeSlot]`를 사용한다.
- `timeSlot`은 변경 없이 유지 — 홈 화면 그룹 분류 계속 사용.

**마이그레이션**: 기존 영속 데이터의 루틴에는 새 필드가 없다. Zustand
`persist`에 `version`(0 → 1)과 `migrate`를 추가하여 기존 루틴에
`notificationEnabled: true`를 백필한다. `customTime`은 `undefined`로 둔다.

## 알림 유틸 (`utils/notifications.ts`)

- `TIME_SLOT_HOURS`는 슬롯 기본값으로 유지.
- `getEffectiveTime(routine)` 헬퍼 추가:
  `routine.customTime ?? TIME_SLOT_HOURS[routine.timeSlot] ?? TIME_SLOT_HOURS.anytime`.
- `scheduleRoutineNotification`은 effective time(hour/minute)을 받아 DAILY
  트리거로 예약한다.

## 예약 로직 (`hooks/useRoutineActions.ts`)

- **추가 시**: `notificationEnabled === true` 이고 권한 허용일 때만 예약.
  off면 예약하지 않는다.
- **수정 시**: 기존 `notificationId`가 있으면 취소한 뒤, enabled일 때만
  effective time으로 재예약. off면 `notificationId`를 제거한다.
- **삭제 시**: 기존대로 예약 취소 후 루틴 삭제.
- **신규 액션** `toggleRoutineNotification(id)`: `notificationEnabled`를
  뒤집고 즉시 예약/취소한다. 홈 빠른 토글에서 사용.

## UI

### 편집 화면 (`app/add-routine.tsx`)
"알림" 섹션 추가:
- 알림 on/off 스위치
- on일 때: "슬롯 기본 시간" / "직접 지정" 선택. "직접 지정" 시 경량 시각
  피커 노출. "슬롯 기본"으로 되돌리면 `customTime`을 제거한다.

### 새 컴포넌트 (`components/TimePicker.tsx`)
- 의존성 없는 경량 JS 시/분 선택. 앱 다크 테마에 맞춤.
- 값: `{ hour, minute }`. onChange 콜백 제공.

### 홈 리스트 (`components/RoutineItem.tsx`)
- 종 아이콘 토글: 켜짐(채움) / 꺼짐(외곽선). 탭 시 `toggleRoutineNotification`.
- 적용 시각 텍스트 표시(effective time).

## 엣지 케이스

- **권한 거부 상태에서 on 시도**: 권한 재요청. 그래도 거부면
  `notificationEnabled`는 유지하되 실제 예약은 생략하고 안내를 표시한다.
- **모드 전환**: "직접 지정" → "슬롯 기본"으로 되돌리면 `customTime`을 지운다.
- **위젯/체크 로직**: 알림과 독립이므로 영향 없음.

## 영향 범위 / 변경 파일

- `store/routineStore.ts` — 타입 확장 + persist 마이그레이션
- `utils/notifications.ts` — `getEffectiveTime`, 스케줄 시그니처
- `hooks/useRoutineActions.ts` — enabled 분기 + `toggleRoutineNotification`
- `app/add-routine.tsx` — 알림 섹션 UI
- `components/TimePicker.tsx` — 신규
- `components/RoutineItem.tsx` — 종 토글 + 시각 표시
