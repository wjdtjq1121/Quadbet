# 🎨 Quadbet 앱 아이콘 생성 가이드

## 빠른 시작 (5분 완성)

### 온라인 도구로 쉽게 만들기

#### 1️⃣ Canva 사용 (추천)
1. [canva.com](https://www.canva.com) 접속
2. "사용자 지정 크기" → 512 x 512 선택
3. 배경색: **그라데이션** 설정
   - 시작: `#667eea`
   - 끝: `#764ba2`
   - 각도: 135도
4. 텍스트 추가: **"Q"** 또는 **"🎴"**
   - 폰트: Bold, 크기: 300
   - 색상: 흰색
5. 다운로드 → PNG → 512x512

#### 2️⃣ Figma 사용
1. [figma.com](https://www.figma.com) 접속
2. 새 프레임: 512 x 512
3. 사각형 그리기 (512x512)
4. Fill → Linear Gradient
   - Color 1: `#667eea`
   - Color 2: `#764ba2`
5. 텍스트 "Q" 추가 (흰색, Bold, 300pt)
6. Export → PNG → 2x

---

## 전문가용: SVG 템플릿

```svg
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradient Background -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="90" fill="url(#grad)"/>

  <!-- Icon (Q or 🎴) -->
  <text x="256" y="340" font-size="300" font-weight="bold"
        text-anchor="middle" fill="white" font-family="Arial, sans-serif">Q</text>
</svg>
```

이 SVG를 `icon.svg`로 저장하고 온라인 변환기 사용:
- [cloudconvert.com](https://cloudconvert.com/svg-to-png)

---

## 자동 크기 변환

### ImageMagick 사용 (CLI)
```bash
# Install ImageMagick
# macOS: brew install imagemagick
# Ubuntu: sudo apt install imagemagick
# Windows: choco install imagemagick

# Convert to all sizes
convert icon-512.png -resize 384x384 icon-384.png
convert icon-512.png -resize 192x192 icon-192.png
convert icon-512.png -resize 152x152 icon-152.png
convert icon-512.png -resize 144x144 icon-144.png
convert icon-512.png -resize 128x128 icon-128.png
convert icon-512.png -resize 96x96 icon-96.png
convert icon-512.png -resize 72x72 icon-72.png
```

### PWA Asset Generator (자동화)
```bash
npx pwa-asset-generator icon-512.png ./ \
  --background "#667eea" \
  --padding "10%" \
  --type png
```

---

## 디자인 가이드라인

### 색상 팔레트
- **Primary Gradient**: `#667eea` → `#764ba2`
- **White**: `#FFFFFF` (텍스트/아이콘)
- **Dark**: `#1e3c72` (선택사항)

### 안전 영역
- **모서리 반경**: 90px (512x512 기준)
- **패딩**: 최소 50px (가장자리에서)
- **중요 요소**: 중앙 300x300 영역 안에 배치

### 권장 아이콘 스타일

#### 옵션 1: 문자 기반
```
배경: 그라데이션
텍스트: "Q" (흰색, Bold, 중앙)
```

#### 옵션 2: 이모지
```
배경: 그라데이션
이모지: 🎴 또는 ♠️♥️♣️♦️ (중앙)
크기: 250px
```

#### 옵션 3: 카드 형태
```
배경: 그라데이션
도형: 둥근 사각형 (카드 모양)
내부: "Quadbet" 로고 또는 "Q"
```

---

## 플랫폼별 요구사항

### iOS (App Store)
- **1024x1024**: 앱스토어 아이콘
- **투명도**: 불가 (배경 필수)
- **모서리**: 자동 처리 (직사각형으로 제출)

### Android (Google Play)
- **512x512**: 고해상도 아이콘
- **적응형 아이콘** (선택):
  - Foreground: 108x108dp 안전 영역
  - Background: 단색 또는 그라데이션

### PWA
- **192x192**: 최소 크기
- **512x512**: 권장 크기
- **투명 배경**: 가능 (선택사항)

---

## 퀄리티 체크

### ✅ 확인 사항
- [ ] 모든 크기 생성 완료 (72 ~ 512)
- [ ] PNG 형식
- [ ] 정사각형 비율
- [ ] 72 DPI 이상
- [ ] 파일명 정확 (`icon-192.png` 등)
- [ ] 배경 투명하지 않음 (iOS)
- [ ] 중앙 정렬
- [ ] 선명한 엣지

### 🔍 테스트 방법
1. 각 아이콘을 브라우저에서 열기
2. 확대해서 픽셀화 확인
3. 모바일 기기에서 미리보기
4. PWA 설치 테스트

---

## 빠른 생성 스크립트

### Bash (Linux/macOS)
```bash
#!/bin/bash
# create-icons.sh

SOURCE="icon-512.png"
SIZES=(72 96 128 144 152 192 384 512)

for size in "${SIZES[@]}"; do
  convert "$SOURCE" -resize ${size}x${size} "icon-${size}.png"
  echo "✅ Created icon-${size}.png"
done
```

### PowerShell (Windows)
```powershell
# create-icons.ps1

$source = "icon-512.png"
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

foreach ($size in $sizes) {
  magick convert $source -resize "${size}x${size}" "icon-${size}.png"
  Write-Host "✅ Created icon-${size}.png"
}
```

---

## 추천 도구

### 무료 디자인 도구
1. **Canva** - 가장 쉬움
2. **Figma** - 프로페셔널
3. **GIMP** - 오픈소스
4. **Inkscape** - SVG 편집

### 온라인 변환기
1. [realfavicongenerator.net](https://realfavicongenerator.net)
2. [favicon.io](https://favicon.io)
3. [app-icon.net](https://app-icon.net)

### CLI 도구
1. **ImageMagick** - 배치 처리
2. **Sharp** - Node.js
3. **PWA Asset Generator** - 자동화

---

## 예제 다운로드

완성된 아이콘 템플릿:
- [icon-template.svg](링크 추가 필요)
- [icon-512.png](링크 추가 필요)

---

## 문제 해결

### Q: 아이콘이 흐릿하게 보여요
**A**: 512x512에서 시작해서 축소하세요. 확대는 품질 저하!

### Q: iOS에서 모서리가 잘려요
**A**: 안전 영역(50px 패딩) 안에 중요 요소 배치

### Q: 파일 크기가 너무 커요
**A**: PNG 압축 도구 사용
```bash
pngquant icon-*.png --ext .png --force
```

### Q: 앱 아이콘이 안 보여요
**A**:
1. 파일명 확인 (`icon-192.png`)
2. manifest.json 경로 확인
3. 브라우저 캐시 삭제
4. HTTPS 확인

---

## 마지막 체크리스트

배포 전 확인:
- [ ] `/icon-72.png` ~ `/icon-512.png` 파일 존재
- [ ] `manifest.json`에 아이콘 경로 정확
- [ ] HTTPS 환경에서 테스트
- [ ] PWA 설치 테스트 (Chrome DevTools)
- [ ] iOS Safari 홈 화면 추가 테스트
- [ ] 앱스토어 제출용 1024x1024 준비

완료! 🎉
