# Quadbet - React Native 티추 게임

React Native로 완전히 리팩토링된 4인 온라인 티추 카드 게임입니다.

## 🎯 주요 변경사항

### ✅ 완료된 작업

1. **React Native 완전 변환**
   - HTML/CSS/JS → React Native TypeScript
   - Clean Code 아키텍처 적용
   - 컴포넌트 기반 설계

2. **특수 카드 정리**
   - 고양이 → 강아지로 통합 (파트너 턴 전달)
   - 호랑이 → 용으로 변경 (가장 높은 카드)
   - 4개 특수카드: 소원(1), 강아지🐕, 봉황🔥, 용🐉

3. **Firebase 최적화**
   - React Native Firebase 사용
   - 타입 안전성 확보
   - 실시간 동기화 개선

4. **게임 로직 개선**
   - TypeScript로 타입 안전성 확보
   - 모듈화된 게임 로직
   - 개선된 봇 AI 시스템

## 📁 프로젝트 구조

```
QuadbetGame/
├── src/
│   ├── components/          # UI 컴포넌트
│   │   ├── Card.tsx        # 카드 컴포넌트
│   │   └── GameBoard.tsx   # 게임 보드
│   ├── screens/            # 화면 컴포넌트
│   │   ├── MainMenuScreen.tsx
│   │   ├── LobbyScreen.tsx
│   │   └── GameScreen.tsx
│   ├── services/           # 외부 서비스
│   │   └── FirebaseService.ts
│   ├── hooks/              # React 훅
│   │   └── useFirebase.ts
│   ├── utils/              # 유틸리티 함수
│   │   ├── CardUtils.ts    # 카드 관련 함수
│   │   ├── GameLogic.ts    # 게임 로직
│   │   └── BotAI.ts        # 봇 AI
│   ├── types/              # TypeScript 타입 정의
│   │   └── GameTypes.ts
│   └── constants/          # 상수
│       └── SpecialCards.ts # 특수 카드 정의
├── App.tsx                 # 메인 앱 컴포넌트
└── package.json
```

## 🎮 특수 카드 시스템

### 소원 카드 (1)
- 가장 낮은 값의 카드
- 소원 시스템: 원하는 숫자(2-14) 지정 가능
- 다른 플레이어는 소원 카드를 우선적으로 내야 함

### 강아지 🐕 (Dog)
- 파트너에게 턴 전달
- 새 트릭 시작 시에만 사용 가능
- 파트너가 나갔으면 다음 플레이어에게 전달

### 봉황 🔥 (Phoenix)  
- 와일드카드 기능
- -25점 가치
- 모든 조합에 사용 가능

### 용 🐉 (Dragon)
- 가장 높은 카드 (value: 15)
- +25점 가치
- 트릭을 이기면 상대팀에게 카드 전달

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 16+
- React Native CLI
- Android Studio / Xcode
- Firebase 프로젝트

### 설치
```bash
cd QuadbetGame
npm install

# iOS (macOS만)
cd ios && pod install && cd ..

# Android
npx react-native run-android

# iOS  
npx react-native run-ios
```

### Firebase 설정
1. Firebase Console에서 새 프로젝트 생성
2. Realtime Database 활성화  
3. `google-services.json` (Android) / `GoogleService-Info.plist` (iOS) 추가
4. 보안 규칙 설정:

```json
{
  "rules": {
    ".read": true,
    ".write": true  
  }
}
```

## 🎯 게임 특징

### 베팅 시스템
- **그랜드 베팅**: 첫 8장 받은 후 선언 (±200점)
- **쿼드 베팅**: 게임 중 언제든 선언 (±100점)
- 1등으로 끝내야 성공

### 팀 구성
- **팀 1**: 남(0) + 북(2) 
- **팀 2**: 서(1) + 동(3)
- 대각선 파트너십

### 점수 계산
- 5: 5점, 10/K: 10점
- 같은 팀 1-2등: 200점 (다른 점수 무시)
- 1000점 먼저 달성하는 팀 승리

## 🤖 개발자 모드

빠른 테스트를 위한 개발자 모드:
- 닉네임을 `Dev_`로 시작하면 자동 활성화
- 봇 3명과 즉시 게임 시작
- Firebase 연결 불필요

## 🏗️ 아키텍처 특징

### Clean Code 적용
- **단일 책임 원칙**: 각 컴포넌트/함수가 하나의 책임만
- **의존성 역전**: Firebase를 서비스 레이어로 추상화
- **타입 안전성**: TypeScript로 런타임 에러 방지

### 성능 최적화
- React hooks를 통한 효율적인 상태 관리
- Firebase 리스너 최적화
- 불필요한 리렌더링 방지

### 확장성
- 모듈화된 구조로 새 기능 추가 용이
- 플랫폼별 네이티브 기능 확장 가능
- 다양한 카드 게임 룰 적용 가능

## 📱 플랫폼 지원

- ✅ Android
- ✅ iOS  
- ✅ 반응형 UI (다양한 화면 크기)
- ✅ 오프라인 모드 (개발자 모드)

## 🔧 개발 가이드

### 새 특수 카드 추가
1. `SpecialCards.ts`에 카드 정의 추가
2. `CardUtils.ts`에 로직 구현
3. `Card.tsx`에 UI 렌더링 추가

### 새 게임 모드 추가
1. `GameTypes.ts`에 타입 정의
2. `GameLogic.ts`에 로직 구현
3. 해당 Screen 컴포넌트 수정

## 📞 문의

프로젝트 관련 문의나 버그 리포트는 GitHub Issues를 활용해 주세요.

---

**v2.0.0 React Native** - 완전히 새롭게 태어난 티추 게임을 즐겨보세요! 🎴