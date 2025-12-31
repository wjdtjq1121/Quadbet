# Quadbet Icon Generator (PowerShell)
# Generates all required PWA icon sizes from SVG template

Write-Host "🎨 Quadbet 아이콘 생성 스크립트" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if ImageMagick is installed
$magickInstalled = Get-Command magick -ErrorAction SilentlyContinue

if (-not $magickInstalled) {
    Write-Host "❌ ImageMagick이 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "설치 방법:" -ForegroundColor Yellow
    Write-Host "  1. https://imagemagick.org/script/download.php#windows 방문"
    Write-Host "  2. Windows Installer 다운로드"
    Write-Host "  3. 설치 시 'Add to PATH' 옵션 선택"
    Write-Host ""
    Write-Host "또는 Chocolatey 사용:"
    Write-Host "  choco install imagemagick" -ForegroundColor Green
    Write-Host ""
    exit 1
}

# Check if source SVG exists
if (-not (Test-Path "icon-template.svg")) {
    Write-Host "❌ icon-template.svg 파일을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "현재 디렉토리: $PWD"
    exit 1
}

# Icon sizes needed for PWA
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

Write-Host "📦 생성할 아이콘 크기: $($sizes -join ', ')"
Write-Host ""

# Create icons
foreach ($size in $sizes) {
    $output = "icon-$size.png"

    Write-Host "  ⏳ $output 생성 중..." -NoNewline

    try {
        & magick convert icon-template.svg -resize "${size}x${size}" $output 2>$null

        if (Test-Path $output) {
            Write-Host " ✅" -ForegroundColor Green
        } else {
            Write-Host " ❌ 실패" -ForegroundColor Red
        }
    } catch {
        Write-Host " ❌ 실패: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ 아이콘 생성 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "생성된 파일:" -ForegroundColor Cyan
Get-ChildItem icon-*.png -ErrorAction SilentlyContinue | Format-Table Name, Length -AutoSize
Write-Host ""
Write-Host "📱 다음 단계:" -ForegroundColor Yellow
Write-Host "  1. manifest.json이 올바른 경로를 참조하는지 확인"
Write-Host "  2. HTTPS 환경에서 PWA 테스트"
Write-Host "  3. Chrome DevTools → Application → Manifest 확인"
Write-Host ""
