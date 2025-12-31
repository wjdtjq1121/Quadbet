# 📱 Quadbet 모바일 앱 출시 가이드

## 🎯 개요
Quadbet은 PWA (Progressive Web App)로 개발되어 **앱스토어**와 **플레이스토어**에 모두 출시할 수 있습니다.

---

## ✅ 이미 구현된 모바일 최적화 기능

### 1. **반응형 디자인**
- 768px 이하: 태블릿 최적화
- 576px 이하: 스마트폰 최적화
- 가로 모드: 별도 레이아웃
- 세로 플레이어(좌/우)는 모바일에서 자동 숨김

### 2. **터치 최적화**
- 최소 버튼 크기: 50px (터치 친화적)
- 탭 하이라이트 제거
- Double-tap 줌 방지
- Pull-to-refresh 방지
- 텍스트 선택 방지 (입력 필드 제외)

### 3. **PWA 기능**
- ✅ 오프라인 지원 (Service Worker)
- ✅ 홈 화면 추가 가능
- ✅ 앱처럼 실행 (standalone 모드)
- ✅ 자동 업데이트
- ✅ 캐싱 시스템

### 4. **모바일 UI 개선**
- 하단 고정 컨트롤 바
- 작은 카드 크기 (45x65px on mobile)
- 2열 그리드 버튼 레이아웃
- 모바일 주소창 대응 (--vh CSS 변수)

---

## 📦 앱스토어 출시 준비

### 필요한 아이콘 생성

다음 크기의 앱 아이콘이 필요합니다:
```
icon-72.png    (72x72)
icon-96.png    (96x96)
icon-128.png   (128x128)
icon-144.png   (144x144)
icon-152.png   (152x152)
icon-192.png   (192x192)  ← PWA 기본
icon-384.png   (384x384)
icon-512.png   (512x512)  ← PWA 기본
```

### 아이콘 생성 방법

#### 온라인 도구 사용:
1. **Canva** (canva.com)
   - 512x512 정사각형 디자인 생성
   - 배경: 그라데이션 (#667eea → #764ba2)
   - 텍스트: "Quadbet" 또는 "🎴"
   - Export → PNG → 512x512

2. **PWA Asset Generator** (pwa-asset-generator.js.org)
   ```bash
   npx pwa-asset-generator icon-source.png ./
   ```

3. **ImageMagick** (명령줄 도구)
   ```bash
   convert icon-512.png -resize 192x192 icon-192.png
   convert icon-512.png -resize 144x144 icon-144.png
   convert icon-512.png -resize 128x128 icon-128.png
   convert icon-512.png -resize 96x96 icon-96.png
   convert icon-512.png -resize 72x72 icon-72.png
   ```

### 스크린샷 생성

앱스토어 제출 시 필요:
- **세로 스크린샷**: 540x720, 1080x1920
- **가로 스크린샷**: 1280x720

---

## 🍎 iOS 앱스토어 출시 (Apple)

### 방법 1: PWA Builder
1. **PWA Builder** 방문 (pwabuilder.com)
2. URL 입력: `https://your-domain.com`
3. "Download iOS Package" 클릭
4. Xcode로 프로젝트 열기
5. Apple Developer 계정으로 서명
6. App Store Connect에 업로드

### 방법 2: Capacitor 사용
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap open ios
```

### iOS 요구사항
- Apple Developer 계정 ($99/년)
- macOS + Xcode
- 개인정보처리방침 URL
- 지원 이메일

---

## 🤖 Google Play 스토어 출시 (Android)

### 방법 1: Trusted Web Activity (TWA)
1. **Bubblewrap** 설치
   ```bash
   npm install -g @bubblewrap/cli
   bubblewrap init --manifest https://your-domain.com/manifest.json
   bubblewrap build
   ```

2. APK 서명
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore \
     -alias quadbet -keyalg RSA -keysize 2048 -validity 10000
   ```

3. Google Play Console 업로드

### 방법 2: PWA Builder
1. pwabuilder.com 방문
2. "Download Android Package" 클릭
3. Android Studio로 빌드
4. Google Play Console에 업로드

### Android 요구사항
- Google Play Developer 계정 ($25 일회성)
- 키스토어 파일 (.jks)
- 개인정보처리방침 URL
- 앱 설명 및 스크린샷

---

## 🌐 Firebase 호스팅 배포

### 1. Firebase CLI 설치
```bash
npm install -g firebase-tools
firebase login
```

### 2. 프로젝트 초기화
```bash
cd /path/to/Quadbet
firebase init hosting
```

### 3. firebase.json 설정
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

### 4. 배포
```bash
firebase deploy --only hosting
```

---

## 🔒 HTTPS 필수!

PWA는 **반드시 HTTPS**에서만 작동합니다:
- ✅ Firebase Hosting (자동 HTTPS)
- ✅ Netlify (자동 HTTPS)
- ✅ Vercel (자동 HTTPS)
- ✅ GitHub Pages (자동 HTTPS)

---

## 📊 앱스토어 제출 체크리스트

### 공통
- [ ] 앱 아이콘 (모든 크기)
- [ ] 스크린샷 (세로/가로)
- [ ] 앱 설명 (한국어/영어)
- [ ] 개인정보처리방침 URL
- [ ] 지원 이메일
- [ ] 키워드/카테고리

### iOS 추가
- [ ] Apple Developer 계정
- [ ] Bundle ID
- [ ] 앱 미리보기 비디오 (선택)

### Android 추가
- [ ] Google Play Developer 계정
- [ ] 서명 키스토어
- [ ] Content Rating 설정

---

## 🎨 브랜딩 가이드라인

### 앱 이름
- **공식**: Quadbet - 티추 게임
- **짧은**: Quadbet

### 컬러 테마
- **Primary**: #667eea (보라색)
- **Secondary**: #764ba2 (진한 보라)
- **Background**: #1e3c72 (남색)

### 설명 (예시)
```
🎴 Quadbet - 친구들과 함께하는 티추 카드 게임!

4명이서 즐기는 전략 카드 게임 티추를
온라인으로 실시간 멀티플레이!

✨ 주요 기능:
• 실시간 온라인 멀티플레이어
• 친구 초대 (방 코드)
• AI 봇 지원
• 베팅 시스템
• 아름다운 UI/UX

📱 언제 어디서나 친구들과 함께
   티추의 재미를 즐겨보세요!
```

---

## 🚀 출시 후 관리

### 업데이트 배포
1. 버전 업데이트
   - `manifest.json` → version 수정
   - `sw.js` → CACHE_NAME 수정
   - `index.html` → version badge 수정

2. Firebase 재배포
   ```bash
   firebase deploy --only hosting
   ```

3. Service Worker 자동 업데이트
   - 사용자가 앱을 다시 열면 자동 업데이트

### 성능 모니터링
- Firebase Analytics
- Google Play Console 통계
- App Store Connect 통계

---

## 📞 지원

궁금한 점이 있으면:
- Email: your-email@example.com
- GitHub Issues: github.com/your-repo/issues

---

## 📄 라이센스

MIT License - 자유롭게 사용하세요!
