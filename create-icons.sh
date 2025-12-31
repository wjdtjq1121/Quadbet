#!/bin/bash
# Quadbet Icon Generator
# Generates all required PWA icon sizes from SVG template

echo "🎨 Quadbet 아이콘 생성 스크립트"
echo "================================"
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick이 설치되어 있지 않습니다."
    echo ""
    echo "설치 방법:"
    echo "  macOS:   brew install imagemagick"
    echo "  Ubuntu:  sudo apt install imagemagick"
    echo "  Fedora:  sudo dnf install imagemagick"
    echo ""
    exit 1
fi

# Check if source SVG exists
if [ ! -f "icon-template.svg" ]; then
    echo "❌ icon-template.svg 파일을 찾을 수 없습니다."
    echo "현재 디렉토리: $(pwd)"
    exit 1
fi

# Icon sizes needed for PWA
SIZES=(72 96 128 144 152 192 384 512)

echo "📦 생성할 아이콘 크기: ${SIZES[@]}"
echo ""

# Create icons
for size in "${SIZES[@]}"; do
    output="icon-${size}.png"

    echo -n "  ⏳ ${output} 생성 중..."

    if convert icon-template.svg -resize ${size}x${size} "$output" 2>/dev/null; then
        echo " ✅"
    else
        echo " ❌ 실패"
    fi
done

echo ""
echo "✨ 아이콘 생성 완료!"
echo ""
echo "생성된 파일:"
ls -lh icon-*.png 2>/dev/null || echo "  (파일 없음)"
echo ""
echo "📱 다음 단계:"
echo "  1. manifest.json이 올바른 경로를 참조하는지 확인"
echo "  2. HTTPS 환경에서 PWA 테스트"
echo "  3. Chrome DevTools → Application → Manifest 확인"
echo ""
