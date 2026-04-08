# 루틴 체크 위젯 앱 MVP

## 프로젝트 구조
```
routine-check-app/
├── app/
│   ├── _layout.tsx          # 루트 레이아웃
│   ├── index.tsx            # 메인 홈 화면
│   └── add-routine.tsx      # 루틴 추가 화면
├── components/
│   ├── RoutineItem.tsx      # 루틴 아이템 컴포넌트
│   ├── StreakHeatmap.tsx    # 스트릭 히트맵
│   └── ProgressRing.tsx    # 오늘 진행률 링
├── store/
│   └── routineStore.ts     # Zustand 상태 관리
├── utils/
│   └── dateUtils.ts        # 날짜 유틸 함수
└── widgets/
    └── RoutineWidget.tsx   # 홈 위젯 (iOS/Android)
```

## 설치 방법
```bash
npx create-expo-app routine-check-app --template blank-typescript
cd routine-check-app

# 필수 패키지 설치
npx expo install expo-notifications
npm install zustand
npm install react-native-mmkv
npm install @shopify/react-native-skia  # 히트맵/차트용
npm install react-native-reanimated
npm install expo-haptics
```

## 실행
```bash
npx expo start
```
