# Firebase 보안 규칙 자동 배포 가이드

이제 터미널에서 명령어 하나로 Firebase 보안 규칙을 설정할 수 있습니다!

## 🚀 빠른 설정 (3단계)

### 1단계: Firebase CLI 설치 (최초 1회만)

```bash
npm install -g firebase-tools
```

### 2단계: Firebase 로그인

```bash
firebase login
```

브라우저가 열리면 Google 계정으로 로그인하세요.

### 3단계: 보안 규칙 배포

```bash
firebase deploy --only database
```

끝입니다! ✅

---

## 📋 전체 단계 (자세한 설명)

### 설치 확인

```bash
firebase --version
```

버전이 나오면 이미 설치되어 있습니다.

### 로그인 확인

```bash
firebase projects:list
```

`quadbet` 프로젝트가 보이면 로그인이 되어 있습니다.

### 보안 규칙만 배포

```bash
firebase deploy --only database
```

### 전체 배포 (보안 규칙 + 호스팅)

```bash
firebase deploy
```

---

## 🔍 배포 후 확인

1. **Firebase Console 확인**
   - https://console.firebase.google.com/
   - Realtime Database → 규칙 탭
   - 다음 규칙이 적용되어 있어야 합니다:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

2. **게임 테스트**
   - https://wjdtjq1121.github.io/Quadbet/
   - 방 만들기 → 성공!

---

## ⚠️ 문제 해결

### "You must be authenticated" 에러
```bash
firebase logout
firebase login
```

### "Permission denied" 에러
Google 계정이 Firebase 프로젝트의 소유자/편집자 권한이 있는지 확인

### Firebase CLI가 없다고 나옴
```bash
npm install -g firebase-tools
```

Node.js가 없다면:
- https://nodejs.org/ 에서 다운로드 & 설치
- 설치 후 터미널 재시작

---

## 📁 생성된 파일들

- `database.rules.json` - 보안 규칙 정의
- `firebase.json` - Firebase 프로젝트 설정
- `.firebaserc` - 프로젝트 ID 매핑

이 파일들이 있으면 `firebase deploy` 명령어만으로 자동 배포됩니다!

---

## 🎯 한 줄 요약

```bash
firebase login && firebase deploy --only database
```

이 명령어만 실행하면 모든 설정이 자동으로 완료됩니다!
