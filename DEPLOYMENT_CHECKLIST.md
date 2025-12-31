# 🚀 Quadbet PWA 배포 체크리스트

완전한 모바일 앱으로 출시하기 전에 확인해야 할 항목들입니다.

---

## ✅ 필수 작업 (PWA 작동에 필요)

### 1. 앱 아이콘 생성 ⚠️ **가장 중요!**

**현재 상태**: ❌ 아직 생성 안 됨

**방법**:
- **가장 쉬운 방법**: [ICONS_README.md](ICONS_README.md) 참고
- 온라인 도구: https://realfavicongenerator.net/
- 또는 스크립트 실행:
  ```bash
  # Windows
  .\create-icons.ps1

  # Mac/Linux
  ./create-icons.sh
  ```

**확인**:
```bash
ls icon-*.png
```

다음 파일들이 있어야 합니다:
- [ ] icon-72.png
- [ ] icon-96.png
- [ ] icon-128.png
- [ ] icon-144.png
- [ ] icon-152.png
- [ ] icon-192.png ⭐ 필수
- [ ] icon-384.png
- [ ] icon-512.png ⭐ 필수

---

### 2. HTTPS 환경에서 배포

**현재 상태**: GitHub Pages (HTTPS ✅)

PWA는 **반드시 HTTPS**에서만 작동합니다.

**배포 옵션**:

#### 옵션 A: GitHub Pages (현재 사용 중)
```bash
git add .
git commit -m "Add PWA icons and mobile optimization"
git push origin main
```

URL: https://wjdtjq1121.github.io/Quadbet/

#### 옵션 B: Firebase Hosting (권장)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

**장점**:
- 더 빠른 속도
- Firebase Realtime Database와 통합
- 커스텀 도메인 무료

---

### 3. Service Worker 확인

**파일**: `sw.js` (이미 생성됨 ✅)

**테스트**:
1. Chrome에서 앱 열기
2. F12 → Application → Service Workers
3. "Status: activated and is running" 확인

**문제 발생 시**:
- 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
- Service Worker Unregister 후 재로드

---

### 4. manifest.json 확인

**파일**: `manifest.json` (이미 생성됨 ✅)

**테스트**:
1. F12 → Application → Manifest
2. 에러가 없는지 확인
3. 아이콘이 모두 로드되는지 확인

---

## 🧪 PWA 작동 테스트

### 로컬 테스트 (아이콘 생성 후)

1. **HTTPS 서버 실행**
   ```bash
   # Python 3
   python -m http.server 8000

   # 또는 npx
   npx http-server -p 8000
   ```

2. **Chrome에서 접속**
   - localhost:8000 (HTTPS 아니지만 localhost는 예외)

3. **설치 프롬프트 확인**
   - 주소창 오른쪽에 설치 아이콘(+) 나타나는지 확인
   - 또는 메뉴 → "앱 설치" 옵션 확인

4. **모바일 테스트**
   - Chrome DevTools → 모바일 시뮬레이션
   - 또는 실제 모바일 기기에서 접속

---

## 📱 모바일 기기 테스트

### iOS (Safari)

1. **접속**: Safari에서 HTTPS URL 열기
2. **홈 화면 추가**:
   - 공유 버튼(⬆️) 탭
   - "홈 화면에 추가" 선택
3. **앱 실행**: 홈 화면에서 Quadbet 아이콘 탭
4. **확인**:
   - [ ] 전체 화면으로 실행 (주소창 없음)
   - [ ] 아이콘이 제대로 표시됨
   - [ ] 게임이 정상 작동

### Android (Chrome)

1. **접속**: Chrome에서 HTTPS URL 열기
2. **설치 프롬프트**: "홈 화면에 추가" 배너 확인
3. **수동 설치**:
   - 메뉴(⋮) → "홈 화면에 추가"
4. **확인**:
   - [ ] 앱 서랍에 Quadbet 나타남
   - [ ] 스플래시 화면 표시
   - [ ] 오프라인 지원 (인터넷 끊고 테스트)

---

## 🎯 앱스토어 출시 준비

### 추가 준비물

#### iOS App Store
- [ ] Apple Developer 계정 ($99/년)
- [ ] 1024x1024 아이콘
- [ ] 스크린샷 (세로/가로)
- [ ] 개인정보처리방침 URL
- [ ] 지원 이메일

**가이드**: [MOBILE_APP_GUIDE.md](MOBILE_APP_GUIDE.md#-ios-앱스토어-출시-apple)

#### Google Play Store
- [ ] Google Play Developer 계정 ($25 일회성)
- [ ] 512x512 고해상도 아이콘
- [ ] 스크린샷 (1080x1920, 1280x720)
- [ ] 개인정보처리방침 URL
- [ ] 앱 설명 (한국어/영어)

**가이드**: [MOBILE_APP_GUIDE.md](MOBILE_APP_GUIDE.md#-google-play-스토어-출시-android)

---

## 🐛 문제 해결

### "설치 버튼이 안 나와요"

**확인 사항**:
1. [ ] HTTPS 환경인가? (localhost 제외)
2. [ ] icon-192.png, icon-512.png 존재하나?
3. [ ] manifest.json에 에러 없나? (F12 → Application → Manifest)
4. [ ] Service Worker 등록되었나? (F12 → Application → Service Workers)

### "아이콘이 안 보여요"

**확인 사항**:
1. [ ] 파일명이 정확한가? (대소문자 주의)
2. [ ] manifest.json의 경로가 맞나?
3. [ ] 브라우저 캐시 삭제했나?

### "오프라인에서 작동 안 해요"

**확인 사항**:
1. [ ] Service Worker가 활성화되었나?
2. [ ] sw.js의 캐시 목록에 필요한 파일 포함되었나?
3. [ ] Firebase 연결은 온라인 필요 (게임 데이터)

---

## 📊 현재 진행 상황

### ✅ 완료된 작업

- [x] 모바일 반응형 CSS 구현
- [x] PWA manifest.json 생성
- [x] Service Worker (sw.js) 구현
- [x] 터치 최적화 (줌 방지, 탭 하이라이트 제거)
- [x] 고정 하단 컨트롤 바
- [x] 카드 크기 최적화 (모바일: 45x65px)
- [x] 세로 모드 레이아웃
- [x] 문서화 (README, 가이드 등)
- [x] 아이콘 SVG 템플릿 생성
- [x] 아이콘 생성 스크립트

### ⚠️ 남은 작업

- [ ] **앱 아이콘 PNG 파일 생성** ⭐ 가장 중요!
- [ ] HTTPS 환경에서 PWA 테스트
- [ ] 실제 모바일 기기에서 설치 테스트
- [ ] (선택) Firebase Hosting 배포
- [ ] (선택) 앱스토어/플레이스토어 제출

---

## 🎉 다음 단계

### 지금 바로 할 일:

1. **아이콘 생성** (5분)
   ```bash
   # 가장 쉬운 방법
   # https://realfavicongenerator.net/ 접속
   # icon-template.svg 업로드
   # 생성된 아이콘 다운로드
   ```

2. **Git에 커밋**
   ```bash
   git add icon-*.png
   git commit -m "Add PWA app icons"
   git push origin main
   ```

3. **GitHub Pages에서 테스트**
   ```
   https://wjdtjq1121.github.io/Quadbet/
   ```

4. **모바일에서 설치 테스트**
   - iOS Safari: 홈 화면에 추가
   - Android Chrome: 앱 설치

### 나중에 할 일:

- 개인정보처리방침 작성
- 앱 설명 및 스크린샷 준비
- 앱스토어 개발자 계정 등록
- 앱 제출

---

## 📞 도움이 필요하신가요?

- **아이콘 생성**: [ICONS_README.md](ICONS_README.md)
- **앱스토어 출시**: [MOBILE_APP_GUIDE.md](MOBILE_APP_GUIDE.md)
- **상세 아이콘 가이드**: [ICON_CREATION.md](ICON_CREATION.md)
- **Firebase 설정**: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

---

**🚀 모바일 앱 출시까지 거의 다 왔습니다!**

아이콘만 생성하면 완전한 PWA로 작동합니다! 🎉
