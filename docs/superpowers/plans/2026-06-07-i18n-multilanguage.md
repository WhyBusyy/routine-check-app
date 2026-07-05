# 다국어(i18n) 지원 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** 앱을 기기 언어 자동 감지 + 설정 화면 수동 전환으로 12개 언어(ko·en·ja·zh-Hans·zh-Hant·es·fr·de·pt-BR·ru·it·id·vi) 지원.

**Architecture:** `expo-localization`(기기 감지) + `i18n-js`(번역 조회). `ko.ts`가 키 정본, 화면 문자열을 `t('namespace.key')`로 교체. 언어 선택은 zustand+MMKV `languageStore`에 영속, 루트 레이아웃이 `key`로 리마운트해 즉시 반영.

**Tech Stack:** Expo SDK 52, React Native, TypeScript, i18n-js@4, expo-localization@16, zustand+MMKV, expo-router.

**검증:** 자동 테스트 없음(방침). 각 태스크 `npx tsc --noEmit` 통과 + UI 태스크는 수동 확인.

**키 네이밍:** `common.*`, `home.*`, `addRoutine.*`, `stats.*`, `paywall.*`, `settings.*`, `routine.*`, `progress.*`, `heatmap.*`. 보간 `%{name}`, 복수형 i18n-js `{ one, other }` + `t(key,{count})`.

**불변 규칙:** 문자열을 `t()`로 교체할 때마다 같은 키를 `i18n/locales/ko.ts`(원문)와 `en.ts`(영역)에 동시 추가. 나머지 10개 언어는 Task 10에서 일괄 생성.

**신규/수정 파일:** 신규 `i18n/index.ts`, `i18n/locales/{ko,en,ja,zh-Hans,zh-Hant,es,fr,de,pt-BR,ru,it,id,vi}.ts`, `store/languageStore.ts`, `app/settings.tsx`. 수정 `app/_layout.tsx`, `app/index.tsx`, `app/add-routine.tsx`, `app/stats.tsx`, `app/paywall.tsx`, `components/{RoutineItem,ProgressRing,StreakHeatmap}.tsx`, `utils/dateUtils.ts`, `app.json`, `package.json`.

---

## Task 1: i18n 인프라 + 스토어 + 루트 배선
- deps: `npx expo install expo-localization && npm install i18n-js`
- `i18n/locales/ko.ts`: `{ common: { cancel:'취소', save:'저장', delete:'삭제', edit:'수정' } }`
- `i18n/locales/en.ts`: `{ common: { cancel:'Cancel', save:'Save', delete:'Delete', edit:'Edit' } }`
- 11개 스텁(`import en from './en'; const locale = en; export default locale`)
- `i18n/index.ts`: `SUPPORTED_LOCALES`(13), `SupportedLocale`, `i18n=new I18n({...})` `enableFallback=true` `defaultLocale='en'`, `resolveDeviceLocale()`(zh→Hant/Hans tag·region, pt→pt-BR, 직접매치, else en), `setI18nLocale()`, `t()`.
- `store/languageStore.ts`: zustand persist over `new MMKV({id:'language-store'})`, `language:'system'|SupportedLocale`(기본 system), `setLanguage`, `getEffectiveLocale()`.
- `app/_layout.tsx`: `const effectiveLocale = useLanguageStore(s=>s.getEffectiveLocale()); setI18nLocale(effectiveLocale)`; `<GestureHandlerRootView key={effectiveLocale}>` + 기존 Stack 옵션 유지.
- 검증: `npx tsc --noEmit` 0. 커밋: `feat(i18n): i18n-js + expo-localization 인프라 및 languageStore 추가`

## Task 2: 설정 화면 + 언어 선택
- `settings.*` 키 ko/en 추가(title/language/systemDefault).
- `app/settings.tsx`: `LANGUAGE_NAMES` 자국어 명칭(한국어/English/日本語/简体中文/繁體中文/Español/Français/Deutsch/Português (BR)/Русский/Italiano/Bahasa Indonesia/Tiếng Việt), 옵션 = 시스템기본 + SUPPORTED_LOCALES, 선택 시 `setLanguage`, 현재 선택 체크. 다크 테마.
- 커밋: `feat(settings): 언어 선택 설정 화면 추가`

## Task 3: 홈(index.tsx) 추출 + ⚙️ 버튼
- `home.*` 키로 인사말·진행률(`%{count}개 남았어요` 등)·빈 상태·시간대 라벨·관리 Alert 추출(공용은 common). `import { t }`.
- 헤더 버튼 묶음에 ⚙️ 추가 → `router.push('/settings')`.
- 커밋: `feat(i18n): 홈 화면 문자열 다국어화 및 설정 진입 버튼`

## Task 4: add-routine.tsx 추출
- `addRoutine.*`: 헤더·섹션 제목(이름/이모지/색상/시간대/알림)·플레이스홀더·시간대 라벨/설명·알림 모드·Alert. ko/en 동시.
- 커밋: `feat(i18n): 루틴 추가/수정 화면 다국어화`

## Task 5: stats.tsx 추출
- 파일 읽고 모든 한국어를 `stats.*`로. 동적 수치 보간/복수형. ko/en 동시.
- 커밋: `feat(i18n): 통계 화면 다국어화`

## Task 6: paywall.tsx 추출
- 모든 한국어를 `paywall.*`로(가격은 RevenueCat 유지, 문구만). ko/en 동시.
- 커밋: `feat(i18n): 결제 화면 다국어화`

## Task 7: 공용 컴포넌트 추출
- RoutineItem(`routine.*`: 시간대 라벨·'알림 꺼짐'), ProgressRing(`progress.*`), StreakHeatmap(`heatmap.*`). 요일 라벨은 Task 8 헬퍼와 정합. ko/en 동시.
- 커밋: `feat(i18n): 공용 컴포넌트 다국어화`

## Task 8: 날짜 로케일화 (dateUtils)
- `formatDate(dateStr, locale='ko')` → `new Intl.DateTimeFormat(locale,{month:'long',day:'numeric',weekday:'long'}).format(...)`. `DAYS` 미사용 시 제거. 요일 약자 필요 시 `Intl.DateTimeFormat(locale,{weekday:'short'})`.
- 호출부 `formatDate(today, i18n.locale)`로 갱신.
- 커밋: `feat(i18n): 날짜 표기 로케일화`

## Task 9: 영어 복수형/보간 정리
- en.ts 개수 보간 항목을 `{one,other}` 복수형으로. 호출부 `t(key,{count})` 확인.
- 커밋: `feat(i18n): 영어 복수형/보간 정리`

## Task 10: 나머지 10개 언어 번역 생성
- ko/en 확정 키 기준으로 ja·zh-Hans·zh-Hant·es·fr·de·pt-BR·ru·it·id·vi 스텁을 실번역으로 교체. ko의 모든 키 포함, 보간/복수형 구조 유지(러시아어 등 복수 규칙 반영), 이모지 유지, 불확실 문구 `// REVIEW`. 키 완전성 검증.
- 커밋: `feat(i18n): 10개 언어 번역 추가`

## Task 11: app.json 로케일 + 최종 검증
- `assets/locales/en.json` `{ "CFBundleDisplayName": "Routine Check" }` + `app.json` `expo.locales: { "en": "./assets/locales/en.json" }`.
- 전체 `npx tsc --noEmit` 0 + 수동 시나리오(감지/수동전환/재시작유지/동적문구·날짜).
- 커밋: `feat(i18n): app.json 영문 앱 이름 로케일 메타데이터`

---

## 비고
- `expo-localization` 네이티브 모듈 → 배포 시 EAS 재빌드(런북: SDK 52는 `eas.json` production `ios.image: "latest"` 필수).
- 상세 인프라 코드는 세션 히스토리/재실행 프롬프트에 전문 보존됨.
