# 다국어(i18n) 지원 설계

작성일: 2026-06-07 (2026-07-05 비iCloud 경로로 재생성)

## 배경

앱 전체 UI 문자열이 한국어로 하드코딩되어 있다(`app/`, `components/`에 ~100개 이상).
i18n 라이브러리·`expo-localization`·locale 설정이 전혀 없다.

## 목표

1. 기기 언어를 자동 감지해 해당 언어로 표시한다.
2. 설정 화면에서 사용자가 언어를 수동 선택할 수 있다(선택 시 즉시 적용·영속).
3. 글로벌 주요 12개 언어를 지원하고, 이후 언어 추가가 로케일 파일 하나로 끝나도록 한다.

### 지원 언어 (12)
`ko`(기본/원본) · `en` · `ja` · `zh-Hans` · `zh-Hant` · `es` · `fr` · `de` · `pt-BR` · `ru` · `it` · `id` · `vi`

## 비목표

- RTL(아랍어/히브리어 등)은 이번 범위 아님.
- 통화/숫자 단위의 지역화는 범위 아님(날짜 표기만 로케일 처리).
- paywall의 가격 표기는 RevenueCat/스토어가 로케일별로 처리하므로 문구만 번역.

## 설계 결정

- **라이브러리**: `expo-localization`(기기 로케일 감지) + `i18n-js`(순수 JS 번역 조회, 보간·복수형 지원). react-i18next는 이 규모엔 과해 제외.
- **언어 선택**: 기기 자동 감지 + 설정 화면 수동 전환. 수동 선택값을 우선한다.
- **번역 출처**: `ko`가 원본, `en`은 1차 기준 번역. 나머지 언어는 초안(LLM 생성)이며 출시 전 원어민 검수 권장 — 뉘앙스가 중요한 동기부여 문구는 코드 주석으로 `// REVIEW` 표시.

## 아키텍처

### `i18n/index.ts`
- `i18n-js`의 `I18n` 인스턴스 생성, 12개 로케일 import해 등록.
- `defaultLocale`/`fallbacks`: 키 누락 시 `en` → `ko` 순 폴백(`enableFallback = true`).
- `resolveDeviceLocale()`: `expo-localization`의 `getLocales()[0]`에서 languageCode(+region/tag)로 지원 로케일 매핑(zh-Hant/zh-Hans 구분, pt→pt-BR). 지원 안 되면 `en`.
- `setI18nLocale(locale)`, `t(key, options)`.

### `i18n/locales/<code>.ts` (12개 + en 기준)
- 각 파일은 동일한 키 구조의 객체를 default export. 키는 화면/도메인 네임스페이스(`common.*`, `home.*`, `addRoutine.*`, `stats.*`, `paywall.*`, `settings.*`, `routine.*`, `progress.*`, `heatmap.*`).
- 복수형 키는 i18n-js 규칙(`{ one, other }`) 사용.
- `ko.ts`가 키의 정본. 나머지는 동일 키 세트를 채운다.

### `store/languageStore.ts` (zustand + MMKV)
- 기존 MMKV 영속 패턴 재사용(별도 id `language-store`).
- 상태: `language: 'system' | <지원 로케일 코드>`(기본 `'system'`), `setLanguage`, `getEffectiveLocale()`.

### 언어 즉시 반영 (`app/_layout.tsx`)
- 루트 레이아웃이 `language`를 구독, 변경 시 `i18n.locale` 갱신 + 하위 트리 `key={effectiveLocale}` 리마운트.

## 설정 화면 (`app/settings.tsx`, 신설)
- 홈 헤더에 ⚙️ 버튼 → `/settings`.
- 언어 목록: 시스템 기본 + 12개(각 언어 자국어 명칭). 선택 즉시 적용·저장.

## 문자열 추출 범위
`app/index.tsx`, `app/add-routine.tsx`, `app/stats.tsx`, `app/paywall.tsx`, `components/RoutineItem.tsx`, `components/ProgressRing.tsx`, `components/StreakHeatmap.tsx` 전부. 동적 문구는 보간(`%{name}`)·복수형 처리.

## 날짜/로케일 처리
`utils/dateUtils.ts`의 한국어 날짜 표기를 `Intl.DateTimeFormat(locale, ...)` 기반으로 변경.

## 앱 메타데이터
`app.json`에 `expo.locales` 추가(최소 영어 앱 이름 "Routine Check").

## 의존성/빌드 영향
`expo-localization`은 네이티브 모듈 → EAS 재빌드 필요. `i18n-js`는 순수 JS.

## 엣지 케이스
- 키 누락 시 en→ko 폴백. 지원 안 되는 기기 로케일 → en. 중국어 간체/번체 region·tag로 구분. 언어 선택 영속.

## 검증
자동 테스트 없음(방침). `npx tsc --noEmit` + 수동 시나리오(기기 언어 감지, 수동 전환, 재시작 유지, 동적 문구).
