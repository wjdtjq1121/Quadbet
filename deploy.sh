#!/bin/bash

echo "========================================"
echo "Firebase 보안 규칙 자동 배포"
echo "========================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo "Firebase CLI가 설치되어 있지 않습니다."
    echo ""
    echo "설치 중..."
    npm install -g firebase-tools
    echo ""
fi

echo "Firebase에 로그인합니다..."
firebase login

echo ""
echo "보안 규칙을 배포합니다..."
firebase deploy --only database

echo ""
echo "========================================"
echo "배포 완료!"
echo "========================================"
echo ""
echo "이제 https://wjdtjq1121.github.io/Quadbet/ 에서"
echo "방 만들기가 정상 작동합니다!"
echo ""
