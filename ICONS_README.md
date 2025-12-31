# 🎨 Quadbet 아이콘 생성 가이드

## 빠른 시작 (3가지 방법)

### ✨ 방법 1: 온라인 도구 (가장 쉬움!)

1. **SVG를 PNG로 변환**
   - https://svgtopng.com/ 또는 https://cloudconvert.com/svg-to-png 접속
   - `icon-template.svg` 파일 업로드
   - Width: 512, Height: 512 설정
   - 다운로드 → `icon-512.png`로 저장

2. **모든 크기 자동 생성**
   - https://realfavicongenerator.net/ 접속
   - `icon-512.png` 업로드
   - "Generate icons and HTML code" 클릭
   - 다운로드 받은 ZIP 파일에서 필요한 크기 추출:
     - `icon-72.png`
     - `icon-96.png`
     - `icon-128.png`
     - `icon-144.png`
     - `icon-152.png`
     - `icon-192.png`
     - `icon-384.png`
     - `icon-512.png`

3. **프로젝트 폴더에 복사**
   - 생성된 PNG 파일들을 `Quadbet/` 폴더에 복사

✅ **완료!** 이제 PWA가 아이콘을 사용할 수 있습니다.

---

### 🖥️ 방법 2: 스크립트 사용 (ImageMagick 필요)

#### Windows

1. **ImageMagick 설치**
   ```powershell
   # Chocolatey 사용
   choco install imagemagick

   # 또는 수동 설치
   # https://imagemagick.org/script/download.php#windows
   ```

2. **스크립트 실행**
   ```powershell
   cd C:\Users\PC\Desktop\js--work\publish-app\Quadbet
   .\create-icons.ps1
   ```

#### macOS / Linux

1. **ImageMagick 설치**
   ```bash
   # macOS
   brew install imagemagick

   # Ubuntu/Debian
   sudo apt install imagemagick

   # Fedora
   sudo dnf install imagemagick
   ```

2. **스크립트 실행**
   ```bash
   cd /path/to/Quadbet
   ./create-icons.sh
   ```

---

### 🎨 방법 3: Canva로 직접 디자인

1. **Canva 접속**
   - https://www.canva.com/

2. **새 디자인 만들기**
   - "사용자 지정 크기" → 512 x 512

3. **디자인**
   - 배경: 그라데이션 (#667eea → #764ba2)
   - 텍스트: "Q" 또는 "🎴"
   - 스타일: 굵게, 중앙 정렬

4. **다운로드**
   - PNG, 512x512
   - `icon-512.png`로 저장

5. **크기 조정**
   - https://imageresizer.com/ 접속
   - 512x512 PNG 업로드
   - 각 크기별로 다운로드 (72, 96, 128, 144, 152, 192, 384, 512)

---

## 필요한 아이콘 크기

```
✅ icon-72.png     (72x72)    - iOS 작은 아이콘
✅ icon-96.png     (96x96)    - Android 작은 아이콘
✅ icon-128.png    (128x128)  - Windows 타일
✅ icon-144.png    (144x144)  - Windows 타일
✅ icon-152.png    (152x152)  - iOS 홈 화면
✅ icon-192.png    (192x192)  - Android 홈 화면 (필수)
✅ icon-384.png    (384x384)  - 고해상도
✅ icon-512.png    (512x512)  - PWA 기본 (필수)
```

---

## 확인 방법

### 1. 파일 확인
```bash
ls -lh icon-*.png
```

다음 파일들이 있어야 합니다:
- icon-72.png
- icon-96.png
- icon-128.png
- icon-144.png
- icon-152.png
- icon-192.png
- icon-384.png
- icon-512.png

### 2. manifest.json 확인
`manifest.json` 파일을 열어서 경로가 정확한지 확인:

```json
{
  "icons": [
    {
      "src": "icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 3. PWA 테스트

#### 로컬 테스트 (HTTPS 필요)
```bash
# Firebase Hosting으로 배포
firebase deploy --only hosting

# 또는 로컬 HTTPS 서버
npx http-server -S -C cert.pem -o
```

#### Chrome DevTools 확인
1. F12 → Application 탭
2. Manifest 확인
3. 모든 아이콘이 로드되는지 확인
4. Install 버튼이 나타나는지 확인

---

## 문제 해결

### ❌ "아이콘이 보이지 않아요"

**원인**: 파일 경로 또는 캐시 문제

**해결**:
1. 파일명 확인 (대소문자 주의)
2. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
3. Service Worker 재등록
4. HTTPS 환경에서 테스트

### ❌ "PWA 설치 버튼이 안 나와요"

**원인**: HTTPS 필요, 아이콘 누락, manifest.json 오류

**해결**:
1. HTTPS 환경 확인
2. icon-192.png, icon-512.png 필수 존재 확인
3. manifest.json 문법 확인
4. Chrome DevTools → Application → Manifest 에러 확인

### ❌ "ImageMagick 설치 안 돼요"

**해결**: 방법 1 (온라인 도구) 사용하세요!
- https://realfavicongenerator.net/ 가장 쉬움

---

## 디자인 팁

### 색상 가이드
- Primary: `#667eea` (보라색)
- Secondary: `#764ba2` (진한 보라)
- Background: `#1e3c72` (남색)

### 안전 영역
- 아이콘 가장자리에서 **50px 여백** 유지
- iOS는 자동으로 둥근 모서리 적용
- 중요한 요소는 중앙 **300x300 영역** 안에 배치

### 권장 스타일
- 심플한 디자인 (작은 크기에서도 선명)
- 명확한 대비 (배경 vs 전경)
- 텍스트는 굵게 (가독성)

---

## 앱스토어 제출용 추가 크기

### iOS App Store
- **1024x1024** PNG (투명도 없음)

### Android Play Store
- **512x512** PNG (고해상도 아이콘)

온라인 도구나 스크립트로 생성 가능

---

## 참고 문서

- [ICON_CREATION.md](ICON_CREATION.md) - 상세 아이콘 제작 가이드
- [MOBILE_APP_GUIDE.md](MOBILE_APP_GUIDE.md) - 앱스토어 출시 가이드
- [README.md](README.md) - 프로젝트 전체 문서

---

## 도움이 필요하신가요?

이슈를 남겨주세요: https://github.com/your-repo/issues

---

**🎉 즐거운 개발 되세요!**
