# 🔧 Firebase 보안 규칙 수동 설정 (2분)

## 가장 빠른 방법!

### 1단계: Firebase Console 열기
👉 **이 링크를 클릭하세요:** https://console.firebase.google.com/project/quadbet/database/quadbet-default-rtdb/rules

> 바로 보안 규칙 페이지로 이동합니다!

### 2단계: 로그인
- Google 계정으로 로그인 (quadbet 프로젝트 소유자 계정)

### 3단계: 규칙 붙여넣기
현재 보이는 규칙을 **모두 삭제**하고, 아래 코드를 **복사 & 붙여넣기:**

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### 4단계: 게시
- **"게시"** 버튼 클릭
- 확인 팝업 → "게시" 클릭

### 5단계: 완료! ✅
이제 https://wjdtjq1121.github.io/Quadbet/ 에서:
1. F5로 새로고침
2. 방 만들기 → **성공!** 🎉

---

## 📋 복사용 규칙 (Ctrl+C로 복사)

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

## ⚠️ 주의사항

이 규칙은 **개발/테스트용**입니다.
실제 서비스 배포 시에는 더 안전한 규칙이 필요합니다.

---

## 🔗 직접 링크

**Firebase Realtime Database 규칙 페이지:**
https://console.firebase.google.com/project/quadbet/database/quadbet-default-rtdb/rules

**Firebase 프로젝트 홈:**
https://console.firebase.google.com/project/quadbet/overview

---

## 📸 스크린샷 가이드

1. 링크 클릭 → 로그인
2. 왼쪽에 규칙 에디터가 보임
3. 기존 코드 모두 삭제
4. 위의 규칙 복사 & 붙여넣기
5. 우측 상단 "게시" 버튼 클릭
6. 완료!

---

## ❓ 문제 해결

### "권한이 없습니다" 에러
- quadbet 프로젝트의 소유자 또는 편집자 권한이 있는 Google 계정으로 로그인하세요

### "프로젝트를 찾을 수 없습니다"
- Firebase Console에서 직접 quadbet 프로젝트를 선택하세요
- Realtime Database → 규칙 탭

### 게시 후에도 방 만들기가 안 됨
1. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
2. F5로 새로고침
3. 다시 시도

---

**소요 시간:** 약 2분
**난이도:** ⭐ (매우 쉬움)
