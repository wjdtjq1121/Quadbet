# Firebase 설정 가이드

## 중요: Firebase Realtime Database 보안 규칙 설정

현재 앱에서 방 만들기가 작동하지 않는다면, Firebase Realtime Database의 보안 규칙을 확인해야 합니다.

### 1. Firebase Console 접속
1. https://console.firebase.google.com/ 접속
2. `quadbet` 프로젝트 선택

### 2. Realtime Database 보안 규칙 설정
1. 왼쪽 메뉴에서 **"Realtime Database"** 클릭
2. **"규칙"** 탭 클릭
3. 아래 규칙 중 하나를 선택하여 적용

#### 옵션 A: 테스트 모드 (개발 중 권장)
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
⚠️ **경고**: 누구나 읽고 쓸 수 있으므로 개발/테스트 용도로만 사용하세요!

#### 옵션 B: 기본 보안 규칙 (프로덕션 권장)
```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true,
        "players": {
          "$playerId": {
            ".write": true
          }
        }
      }
    }
  }
}
```

### 3. 규칙 게시
- **"게시"** 버튼 클릭하여 규칙 적용

### 4. 테스트
1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭 확인
3. index.html 새로고침
4. 다음 메시지가 보이는지 확인:
   - `Firebase 초기화 성공`
   - `Firebase 데이터베이스 연결됨`

### 5. 방 만들기 테스트
1. 닉네임 입력
2. "방 만들기" 클릭
3. Console에서 다음 로그 확인:
   - `createRoom 호출됨`
   - `현재 사용자: {id: "...", nickname: "..."}`
   - `생성할 방 코드: 123456`
   - `방 생성 성공!`

## 문제 해결

### 에러: "Permission denied"
- Firebase 보안 규칙이 올바르게 설정되지 않았습니다
- 위의 "테스트 모드" 규칙을 적용하세요

### 에러: "Firebase 초기화 실패"
- Firebase SDK가 제대로 로드되지 않았습니다
- 인터넷 연결을 확인하세요

### 방 만들기 버튼을 눌러도 아무 반응이 없음
1. 브라우저 Console 확인
2. 에러 메시지 확인
3. Firebase Console에서 Database 탭의 "데이터" 섹션에 rooms가 생성되는지 확인

## 데이터베이스 구조

```
quadbet-database
├── rooms
│   ├── 123456 (방 코드)
│   │   ├── code: "123456"
│   │   ├── host: "user_1234..."
│   │   ├── playerCount: 1
│   │   ├── gameStarted: false
│   │   └── players
│   │       ├── 0 (position)
│   │       │   ├── id: "user_1234..."
│   │       │   ├── nickname: "플레이어1"
│   │       │   ├── ready: true
│   │       │   └── position: 0
│   │       ├── 1
│   │       ├── 2
│   │       └── 3
```

## 추가 도움말

Firebase Realtime Database 공식 문서:
https://firebase.google.com/docs/database/web/start
