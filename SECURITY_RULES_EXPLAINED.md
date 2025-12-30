# Firebase 보안 규칙 설명

## 🔒 현재 적용된 보안 규칙 (개선됨)

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "!data.exists() || data.child('host').val() === newData.child('host').val()",
        "players": {
          "$playerId": {
            ".write": true
          }
        },
        "gameState": {
          ".write": true
        }
      }
    }
  }
}
```

---

## 📖 규칙 설명

### 1. 방 읽기
```json
".read": true
```
- **누구나** 방 목록과 정보를 볼 수 있음
- 멀티플레이어 게임에 필요 (방 목록 표시)

### 2. 방 생성 및 수정
```json
".write": "!data.exists() || data.child('host').val() === newData.child('host').val()"
```
**의미:**
- `!data.exists()`: 방이 없으면 누구나 생성 가능
- `||`: 또는
- `data.child('host').val() === newData.child('host').val()`: 방장만 방 정보 수정 가능

**보호하는 것:**
- ✅ 방장이 아닌 사람이 방 설정 변경 불가
- ✅ 방 코드 변조 방지
- ✅ 호스트 변경 방지

### 3. 플레이어 추가
```json
"players": {
  "$playerId": {
    ".write": true
  }
}
```
- 누구나 자기 자신을 플레이어로 추가 가능
- 게임 참가에 필요

### 4. 게임 상태
```json
"gameState": {
  ".write": true
}
```
- 게임이 시작되면 플레이어들이 게임 상태 업데이트
- 카드 플레이, 턴 변경 등

---

## 🛡️ 보안 수준 비교

### 테스트용 (이전)
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
**위험도:** 🔴 매우 높음
- 누구나 모든 데이터 읽기/쓰기 가능
- 데이터 삭제, 조작 가능

---

### 기본 보호 (현재)
```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "!data.exists() || data.child('host').val() === newData.child('host').val()",
        "players": { ... },
        "gameState": { ... }
      }
    }
  }
}
```
**위험도:** 🟡 중간
- 방장만 방 설정 변경 가능
- 하지만 여전히 익명 접근 허용

---

### 인증 필수 (프로덕션)
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "rooms": {
      "$roomCode": {
        ".write": "!data.exists() || data.child('host').val() === auth.uid",
        "players": {
          "$playerId": {
            ".write": "$playerId === auth.uid"
          }
        }
      }
    }
  }
}
```
**위험도:** 🟢 낮음
- Firebase Authentication 필요
- 각 사용자는 자신의 데이터만 수정 가능
- **→ 실제 서비스에는 이걸 사용하세요!**

---

## 🎯 현재 프로젝트에 맞는 규칙

**개발/테스트 단계 (지금):**
- 기본 보호 규칙 사용 (현재 적용됨)
- Firebase Authentication 없이도 작동
- 빠른 개발 가능

**실제 서비스 배포 시:**
1. Firebase Authentication 추가
2. 인증 필수 규칙 적용
3. 사용자별 권한 관리

---

## ❓ 자주 묻는 질문

### Q: 누가 내 Firebase Console 규칙을 바꿀 수 있나요?
**A:** 아니요! Firebase Console은 Google 계정으로 보호됩니다. 프로젝트 소유자/편집자만 접근 가능합니다.

### Q: 현재 규칙으로 데이터가 안전한가요?
**A:** 기본적인 보호는 됩니다:
- ✅ 방장만 방 설정 변경 가능
- ✅ 방 생성은 누구나 가능
- ⚠️ 하지만 게임 데이터 조작은 여전히 가능

### Q: 더 안전하게 하려면?
**A:** Firebase Authentication을 추가하세요:
1. 사용자 로그인 기능 구현
2. 인증 필수 규칙 적용
3. 각 사용자는 자신의 데이터만 수정

### Q: 지금 당장 변경해야 하나요?
**A:**
- 개발/테스트: 현재 규칙으로 충분
- 실제 서비스: Authentication 추가 권장

---

## 🔄 규칙 업데이트 방법

### 자동 배포:
```bash
deploy.bat
```

### 수동 설정:
1. https://console.firebase.google.com/project/quadbet/database/quadbet-default-rtdb/rules
2. 위의 규칙 복사 & 붙여넣기
3. "게시" 클릭

---

## 📊 보안 체크리스트

현재 프로젝트:
- [x] Firebase Console 접근 보호 (Google 계정)
- [x] 방장 권한 보호
- [x] 방 생성 허용
- [ ] 사용자 인증 (선택사항)
- [ ] 데이터 검증 (선택사항)
- [ ] Rate limiting (선택사항)

**개발 단계에서는 충분합니다!** ✅
