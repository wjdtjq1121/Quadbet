# Quadbet - 티추 온라인 카드 게임

🎴 4인 전용 온라인 멀티플레이어 카드 게임

**라이브 데모:** https://wjdtjq1121.github.io/Quadbet/

**현재 버전:** v1.7.3

📱 **모바일 앱 지원:** iOS & Android PWA (앱스토어/플레이스토어 출시 준비 완료)

---

## ⚠️ 중요: 첫 실행 전 필수 설정!

방 만들기가 작동하지 않는다면, **Firebase 보안 규칙 설정이 필요합니다.**

### 🚀 자동 설정 (가장 빠름!)

**Windows:**
```bash
deploy.bat
```

**Mac/Linux:**
```bash
./deploy.sh
```

이 스크립트가 자동으로:
1. Firebase CLI 설치 확인 (없으면 설치)
2. Firebase 로그인
3. 보안 규칙 배포

를 해줍니다!

---

### 수동 설정 (5분 소요)

1. **Firebase Console 접속**
   - https://console.firebase.google.com/
   - `quadbet` 프로젝트 선택

2. **Realtime Database 보안 규칙 설정**
   - 왼쪽 메뉴: "Realtime Database" → "규칙" 탭
   - 아래 규칙 복사 & 붙여넣기:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

3. **"게시" 버튼 클릭**

4. **페이지 새로고침** 후 테스트

⚠️ **주의:** 위 규칙은 개발/테스트용입니다. 프로덕션 배포 시 더 안전한 규칙이 필요합니다.

---

## 🎨 앱 아이콘 생성 (PWA 필수!)

PWA로 작동하려면 **앱 아이콘이 필요합니다**. 아직 생성하지 않았다면:

### 🌐 온라인 도구로 5분 만에 생성 (가장 쉬움!)

1. **SVG → PNG 변환**
   - https://svgtopng.com/ 접속
   - `icon-template.svg` 업로드
   - 512x512 크기로 다운로드

2. **모든 크기 자동 생성**
   - https://realfavicongenerator.net/ 접속
   - 512x512 PNG 업로드
   - 생성된 아이콘 다운로드 및 프로젝트 폴더에 복사

**자세한 가이드:** [ICONS_README.md](ICONS_README.md)

---

## 🚀 사용 방법

### 1. 게임 시작
1. https://wjdtjq1121.github.io/Quadbet/ 접속
2. 닉네임 입력
3. "게임 시작" 클릭

### 2. 방 만들기 (혼자 테스트)
1. "방 만들기" 클릭
2. **"🤖 봇으로 채우기"** 버튼 클릭 (빈 자리를 AI가 채움)
3. "게임 시작" 클릭
4. 봇과 함께 게임 플레이!

### 3. 친구와 함께 플레이
1. 한 명이 "방 만들기"
2. 화면에 표시된 **6자리 방 코드** 공유
3. 친구들이 "방 참가하기"에서 방 코드 입력
4. 4명이 모두 준비되면 게임 시작!

---

## 🎮 주요 기능

### 게임 기능
- ✅ 실시간 멀티플레이어 (4인)
- ✅ 방 생성 및 참가 (6자리 코드)
- ✅ AI 봇 플레이어 (테스트용)
- ✅ 베팅 시스템 (그랜드/쿼드)
- ✅ 점수 계산 및 승리 조건
- ✅ 소원 시스템, 폭탄, 특수 카드

### 모바일 최적화 (NEW! 🔥)
- ✅ PWA (Progressive Web App) 지원
- ✅ 완전한 반응형 디자인 (태블릿/폰)
- ✅ 터치 최적화 UI
- ✅ 오프라인 지원 (Service Worker)
- ✅ 홈 화면 추가 가능
- ✅ 앱처럼 실행 (전체화면)
- ✅ iOS/Android 앱스토어 출시 준비 완료

---

## 📱 모바일 앱으로 설치하기

### iOS (iPhone/iPad)
1. Safari에서 게임 접속
2. 공유 버튼 탭 (⬆️)
3. "홈 화면에 추가" 선택
4. "추가" 탭
5. 홈 화면에서 앱처럼 실행!

### Android
1. Chrome에서 게임 접속
2. 메뉴(⋮) → "홈 화면에 추가"
3. "설치" 또는 "추가" 탭
4. 앱 서랍에서 Quadbet 실행!

### 앱스토어/플레이스토어 출시
현재 PWA로 완성되었으며, 앱스토어 출시를 준비 중입니다!

**출시 가이드:** [MOBILE_APP_GUIDE.md](MOBILE_APP_GUIDE.md)

---

## 🐛 문제 해결

### "방 만들기"를 눌러도 아무 반응이 없어요

**원인:** Firebase 보안 규칙이 설정되지 않음

**해결:**
1. 브라우저에서 F12 (개발자 도구)
2. Console 탭 확인
3. "Permission denied" 에러가 있다면 → 위의 "Firebase 보안 규칙 설정" 진행

### Firebase 연결이 안돼요

**해결:**
1. 인터넷 연결 확인
2. F12 → Console에서 다음 로그 확인:
   - `Firebase 초기화 성공` ✓
   - `Firebase 데이터베이스 연결됨` ✓

### 자세한 디버깅이 필요해요

**테스트 페이지 사용:**
- https://wjdtjq1121.github.io/Quadbet/test.html
- 단계별 진단 도구 제공

---

## 📁 프로젝트 구조

```
Quadbet/
├── index.html              # 메인 멀티플레이어 페이지
├── app.js                  # 게임 로직 & Firebase 연동
├── manifest.json           # PWA 매니페스트
├── sw.js                   # Service Worker (오프라인 지원)
├── magician.png            # 아그니 카드 이미지
├── icon-template.svg       # 아이콘 SVG 템플릿
├── icon-*.png              # 앱 아이콘 (72px ~ 512px) ⚠️ 생성 필요!
├── create-icons.sh         # 아이콘 생성 스크립트 (Bash)
├── create-icons.ps1        # 아이콘 생성 스크립트 (PowerShell)
├── ICONS_README.md         # 아이콘 생성 빠른 가이드
├── MOBILE_APP_GUIDE.md     # 앱스토어 출시 가이드
├── ICON_CREATION.md        # 아이콘 생성 상세 가이드
├── FIREBASE_SETUP.md       # Firebase 상세 설정 가이드
├── CLAUDE.md               # 개발 문서
└── README.md               # 이 파일
```

---

## 🔧 기술 스택

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Firebase Realtime Database
- **Hosting:** GitHub Pages / Firebase Hosting
- **PWA:** Service Worker, Web App Manifest
- **Mobile:** 반응형 디자인, Touch 최적화
- **게임 로직:** 티추 카드 게임 규칙

---

## 📖 게임 규칙 (티추)

- 4명이서 2:2 팀으로 플레이
- 각 플레이어는 14장의 카드를 받음
- 목표: 1000점을 먼저 달성
- 특수 카드: 마작(🀄), 개(🐕), 피닉스(🔥), 드래곤(🐉)
- 카드 조합: 싱글, 페어, 트리플, 스트레이트, 풀하우스, 폭탄 등

자세한 규칙은 게임 내 "게임 방법" 메뉴 참고

---

## 📝 버전 히스토리

**v1.7.3** (2025-12-31) - 📱 모바일 앱 릴리즈
- **PWA 완전 구현**
  - Service Worker (오프라인 지원)
  - Web App Manifest
  - 홈 화면 추가 기능
- **모바일 UI 최적화**
  - 완전 반응형 디자인
  - 터치 최적화
  - 세로/가로 모드 지원
  - 하단 고정 컨트롤 바
- **조커 스트레이트 버그 수정**
- **카드 크기 최적화** (모바일: 45x65px)
- **앱스토어/플레이스토어 출시 준비 완료**

**v1.7.0** (2025-12-30)
- 베팅 시스템 개편
- 봇 AI 개선
- 폭탄 시스템 구현

**v1.6.0** (2025-12-30)
- 소원(숫자 1) 기능 완전 구현
- UI 개선

**v1.0.0** (2025-12-30)
- 초기 릴리즈
- 멀티플레이어 기능
- 기본 게임 로직

전체 버전 히스토리: [CLAUDE.md](CLAUDE.md) 참고

---

## 🤝 기여

버그 리포트 및 기능 제안은 이슈로 남겨주세요!

---

## 📄 라이선스

MIT License

---

## 👨‍💻 개발

Built with ❤️ using Claude Code

🤖 Generated with [Claude Code](https://claude.com/claude-code)
