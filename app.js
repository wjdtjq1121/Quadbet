// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
    console.error('============ 전역 에러 발생 ============');
    console.error('메시지:', message);
    console.error('파일:', source);
    console.error('라인:', lineno, '컬럼:', colno);
    console.error('에러 객체:', error);
    if (error && error.stack) {
        console.error('스택 트레이스:', error.stack);
    }
    console.error('=====================================');

    // Show more detailed error message
    const errorMsg = error ? (error.message || message) : message;
    alert('에러 발생: ' + errorMsg + '\n\n콘솔(F12)에서 자세한 내용을 확인하세요.');
    return false;
};

console.log('=== app.js 로드 시작 ===');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2jz0vIq-bxyxHaYU7L_mrYgWC0Du5A1U",
    authDomain: "quadbet.firebaseapp.com",
    projectId: "quadbet",
    storageBucket: "quadbet.firebasestorage.app",
    messagingSenderId: "523137720350",
    appId: "1:523137720350:web:a520ff5da7e4505f324e0f",
    measurementId: "G-MTN4L65HFJ"
};

console.log('Firebase 설정:', firebaseConfig);

// Initialize Firebase
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('Firebase 초기화 성공');

    // Test database connection
    database.ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() === true) {
            console.log('Firebase 데이터베이스 연결됨');
        } else {
            console.log('Firebase 데이터베이스 연결 끊김');
        }
    });
} catch (error) {
    console.error('Firebase 초기화 실패:', error);
    alert('Firebase 초기화 실패: ' + error.message);
}

// Global variables
let currentUser = {
    id: null,
    nickname: null
};

let currentRoom = {
    code: null,
    isHost: false,
    playerPosition: null // 0: south, 1: west, 2: north, 3: east
};

let roomListeners = [];
let botPlayers = {}; // Track which players are bots
let botTimers = {}; // Track bot play timers
let autoPassPending = false; // Prevent duplicate auto-pass calls

// ==================== UTILITY FUNCTIONS ====================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateBotId() {
    return 'bot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateBotName() {
    const botNames = [
        '🤖 알파봇', '🤖 베타봇', '🤖 감마봇', '🤖 델타봇',
        '🤖 제타봇', '🤖 오메가봇', '🤖 시그마봇', '🤖 뮤봇'
    ];
    return botNames[Math.floor(Math.random() * botNames.length)];
}

// ==================== NICKNAME SCREEN ====================

// Load saved nickname on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedNickname = localStorage.getItem('tichu_nickname');
    if (savedNickname) {
        document.getElementById('nickname-input').value = savedNickname;
    }
});

function setNickname() {
    const nickname = document.getElementById('nickname-input').value.trim();

    if (!nickname) {
        alert('닉네임을 입력해주세요!');
        return;
    }

    if (nickname.length < 2) {
        alert('닉네임은 2자 이상이어야 합니다!');
        return;
    }

    currentUser.nickname = nickname;
    currentUser.id = generateUserId();
    localStorage.setItem('tichu_nickname', nickname);

    document.getElementById('lobby-player-name').textContent = `👤 ${nickname}`;
    showScreen('lobby-screen');
    startListeningToRooms();
}

function logout() {
    if (confirm('로그아웃하시겠습니까?')) {
        currentUser = { id: null, nickname: null };
        showScreen('nickname-screen');
        stopListeningToRooms();
    }
}

// ==================== LOBBY SCREEN ====================

function startListeningToRooms() {
    const roomsRef = database.ref('rooms');

    roomsRef.on('value', (snapshot) => {
        const rooms = snapshot.val();
        updateRoomList(rooms);
    });
}

function stopListeningToRooms() {
    database.ref('rooms').off();
}

function updateRoomList(rooms) {
    const roomListEl = document.getElementById('room-list');

    if (!rooms) {
        roomListEl.innerHTML = '<p style="text-align: center; color: #999;">대기 중인 방이 없습니다</p>';
        return;
    }

    const roomsArray = Object.entries(rooms).filter(([code, room]) => {
        return !room.gameStarted && room.playerCount < 4;
    });

    if (roomsArray.length === 0) {
        roomListEl.innerHTML = '<p style="text-align: center; color: #999;">대기 중인 방이 없습니다</p>';
        return;
    }

    roomListEl.innerHTML = roomsArray.map(([code, room]) => {
        return `
            <div class="room-item">
                <div class="room-info">
                    <div class="room-code">${code}</div>
                    <div class="room-players">${room.playerCount}/4 플레이어</div>
                </div>
                <button class="btn btn-success" onclick="joinRoom('${code}')">참가</button>
            </div>
        `;
    }).join('');
}

function createRoom() {
    console.log('createRoom 호출됨');
    console.log('현재 사용자:', currentUser);

    if (!currentUser.id || !currentUser.nickname) {
        alert('사용자 정보가 없습니다. 닉네임을 다시 설정해주세요.');
        showScreen('nickname-screen');
        return;
    }

    const roomCode = generateRoomCode();
    const roomRef = database.ref('rooms/' + roomCode);

    console.log('생성할 방 코드:', roomCode);

    const roomData = {
        code: roomCode,
        host: currentUser.id,
        playerCount: 1,
        gameStarted: false,
        players: {
            0: {
                id: currentUser.id,
                nickname: currentUser.nickname,
                ready: true, // Host is always ready
                position: 0
            }
        }
    };

    console.log('방 데이터:', roomData);
    console.log('Firebase에 데이터 쓰기 시도 중...');

    // Add timeout to detect if Firebase is hanging
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firebase 응답 시간 초과. 보안 규칙을 확인해주세요.')), 5000);
    });

    Promise.race([
        roomRef.set(roomData),
        timeoutPromise
    ]).then(() => {
        console.log('✅ 방 생성 성공!');
        currentRoom.code = roomCode;
        currentRoom.isHost = true;
        currentRoom.playerPosition = 0;

        // Handle disconnect
        roomRef.onDisconnect().remove();

        joinWaitingRoom(roomCode);
    }).catch((error) => {
        console.error('❌ 방 생성 에러:', error);
        console.error('에러 코드:', error.code);
        console.error('에러 메시지:', error.message);

        let errorMessage = '방 생성에 실패했습니다.\n\n';

        if (error.code === 'PERMISSION_DENIED' || error.message.includes('permission') || error.message.includes('Permission')) {
            errorMessage += '⚠️ Firebase 보안 규칙이 설정되지 않았습니다!\n\n';
            errorMessage += '해결 방법:\n';
            errorMessage += '1. 프로젝트 폴더에서 "deploy.bat" 실행\n';
            errorMessage += '2. 또는 우측 하단 "❓" 버튼 클릭\n\n';
            errorMessage += '자세한 안내를 보시겠습니까?';

            if (confirm(errorMessage)) {
                window.location.href = 'setup.html';
            }
        } else if (error.message.includes('시간 초과')) {
            errorMessage += '⏱️ Firebase 연결이 느립니다.\n\n';
            errorMessage += '가능한 원인:\n';
            errorMessage += '- 인터넷 연결 확인\n';
            errorMessage += '- Firebase 보안 규칙 미설정\n';
            errorMessage += '- Firebase 서비스 상태 확인\n\n';
            errorMessage += '설정 가이드를 보시겠습니까?';

            if (confirm(errorMessage)) {
                window.location.href = 'setup.html';
            }
        } else {
            errorMessage += '에러: ' + error.message;
            alert(errorMessage);
        }
    });
}

function joinRoomByCode() {
    const roomCode = document.getElementById('room-code-input').value.trim();

    if (!roomCode || roomCode.length !== 6) {
        alert('올바른 6자리 방 코드를 입력해주세요!');
        return;
    }

    joinRoom(roomCode);
}

function joinRoom(roomCode) {
    const roomRef = database.ref('rooms/' + roomCode);

    roomRef.once('value').then((snapshot) => {
        const room = snapshot.val();

        if (!room) {
            alert('방을 찾을 수 없습니다!');
            return;
        }

        if (room.gameStarted) {
            alert('이미 게임이 시작되었습니다!');
            return;
        }

        if (room.playerCount >= 4) {
            alert('방이 가득 찼습니다!');
            return;
        }

        // Find available position
        let availablePosition = -1;
        for (let i = 0; i < 4; i++) {
            if (!room.players || !room.players[i]) {
                availablePosition = i;
                break;
            }
        }

        if (availablePosition === -1) {
            alert('방이 가득 찼습니다!');
            return;
        }

        // Add player to room
        const updates = {};
        updates[`rooms/${roomCode}/players/${availablePosition}`] = {
            id: currentUser.id,
            nickname: currentUser.nickname,
            ready: false,
            position: availablePosition
        };
        updates[`rooms/${roomCode}/playerCount`] = room.playerCount + 1;

        database.ref().update(updates).then(() => {
            currentRoom.code = roomCode;
            currentRoom.isHost = false;
            currentRoom.playerPosition = availablePosition;

            // Handle disconnect
            database.ref(`rooms/${roomCode}/players/${availablePosition}`).onDisconnect().remove();
            database.ref(`rooms/${roomCode}/playerCount`).onDisconnect().set(firebase.database.ServerValue.increment(-1));

            joinWaitingRoom(roomCode);
        });
    });
}

// ==================== WAITING ROOM ====================

function joinWaitingRoom(roomCode) {
    showScreen('waiting-screen');
    document.getElementById('waiting-room-code').textContent = roomCode;

    // Listen to room changes
    const roomRef = database.ref('rooms/' + roomCode);

    roomRef.on('value', (snapshot) => {
        const room = snapshot.val();

        if (!room) {
            alert('방이 삭제되었습니다!');
            showScreen('lobby-screen');
            return;
        }

        updateWaitingRoom(room);

        // Check if game started
        if (room.gameStarted) {
            startMultiplayerGame(room);
        }
    });

    // Enable/disable buttons
    const readyBtn = document.getElementById('ready-btn');
    const startBtn = document.getElementById('start-btn');
    const fillBotsBtn = document.getElementById('fill-bots-btn');

    if (currentRoom.isHost) {
        readyBtn.style.display = 'none';
        startBtn.style.display = 'inline-block';
        startBtn.disabled = true;
        fillBotsBtn.style.display = 'inline-block';
    } else {
        readyBtn.style.display = 'inline-block';
        readyBtn.disabled = false;
        startBtn.style.display = 'none';
        fillBotsBtn.style.display = 'none';
    }
}

function updateWaitingRoom(room) {
    const positions = ['남', '서', '북', '동'];
    const positionEmojis = ['🧭', '🌅', '⭐', '🌄'];

    for (let i = 0; i < 4; i++) {
        const slotEl = document.getElementById(`slot-${i}`);
        const player = room.players ? room.players[i] : null;

        if (player) {
            slotEl.classList.add('connected');

            const isHost = player.id === room.host;
            const hostBadge = isHost ? '<span class="host-badge">👑 방장</span>' : '';

            slotEl.innerHTML = `
                <div class="player-position">${positionEmojis[i]} ${positions[i]}</div>
                <div class="player-name">${player.nickname}${hostBadge}</div>
                <div class="player-status">${player.ready ? '✅ 준비 완료' : '⏳ 대기 중'}</div>
            `;

            if (player.ready) {
                slotEl.classList.add('ready');
            } else {
                slotEl.classList.remove('ready');
            }
        } else {
            slotEl.classList.remove('connected', 'ready');
            slotEl.innerHTML = `
                <div class="player-position">${positionEmojis[i]} ${positions[i]}</div>
                <div class="player-name">대기 중...</div>
                <div class="player-status"></div>
            `;
        }
    }

    // Update start button for host
    if (currentRoom.isHost) {
        const startBtn = document.getElementById('start-btn');
        const allReady = room.players && Object.values(room.players).every(p => p.ready);
        const hasEnoughPlayers = room.playerCount === 4;

        startBtn.disabled = !(allReady && hasEnoughPlayers);
    }
}

function toggleReady() {
    const roomRef = database.ref(`rooms/${currentRoom.code}/players/${currentRoom.playerPosition}`);

    roomRef.once('value').then((snapshot) => {
        const player = snapshot.val();
        roomRef.update({ ready: !player.ready });
    });
}

function startGame() {
    console.log('🎮 startGame 호출됨');

    if (!currentRoom.isHost) {
        console.log('❌ 방장이 아님');
        return;
    }

    console.log('🔍 검증 시작...');

    // Validation checks
    if (!currentRoom.code) {
        console.error('❌ 방 코드가 없습니다!');
        alert('에러: 방 코드가 없습니다. 방을 다시 만들어주세요.');
        return;
    }

    if (!database) {
        console.error('❌ Firebase 데이터베이스가 초기화되지 않았습니다!');
        alert('에러: Firebase 연결 실패. 페이지를 새로고침해주세요.');
        return;
    }

    console.log('✅ 검증 통과');

    try {
        console.log('🎲 게임 상태 초기화 중...');
        const gameState = initializeGameState();
        console.log('✅ 게임 상태 생성 완료:', gameState);

        console.log('💾 Firebase에 게임 시작 데이터 쓰기 중...');
        const roomRef = database.ref(`rooms/${currentRoom.code}`);

        roomRef.update({
            gameStarted: true,
            gameState: gameState
        })
        .then(() => {
            console.log('✅ 게임 시작 성공!');
        })
        .catch((error) => {
            console.error('❌ Firebase 업데이트 실패:', error);
            alert('게임 시작 실패: ' + error.message);
        });

    } catch (error) {
        console.error('❌ startGame 에러:', error);
        console.error('에러 스택:', error.stack);
        alert('게임 시작 중 에러 발생: ' + error.message + '\n\n콘솔(F12)에서 자세한 내용을 확인하세요.');
    }
}

function leaveRoom() {
    if (confirm('방을 나가시겠습니까?')) {
        const roomRef = database.ref(`rooms/${currentRoom.code}`);

        if (currentRoom.isHost) {
            // Host leaving - delete room
            roomRef.remove();
        } else {
            // Regular player leaving
            database.ref(`rooms/${currentRoom.code}/players/${currentRoom.playerPosition}`).remove();
            database.ref(`rooms/${currentRoom.code}/playerCount`).set(firebase.database.ServerValue.increment(-1));
        }

        // Clean up
        roomRef.off();
        currentRoom = { code: null, isHost: false, playerPosition: null };

        showScreen('lobby-screen');
    }
}

// ==================== BOT FUNCTIONS ====================

function fillWithBots() {
    if (!currentRoom.isHost) {
        alert('방장만 봇을 추가할 수 있습니다!');
        return;
    }

    const roomRef = database.ref(`rooms/${currentRoom.code}`);

    roomRef.once('value').then((snapshot) => {
        const room = snapshot.val();
        if (!room) return;

        const updates = {};
        let addedBots = 0;

        // Find empty positions and add bots
        for (let i = 0; i < 4; i++) {
            if (!room.players || !room.players[i]) {
                const botId = generateBotId();
                const botName = generateBotName();

                updates[`rooms/${currentRoom.code}/players/${i}`] = {
                    id: botId,
                    nickname: botName,
                    ready: true,
                    position: i,
                    isBot: true
                };

                botPlayers[i] = true;
                addedBots++;
            }
        }

        if (addedBots > 0) {
            updates[`rooms/${currentRoom.code}/playerCount`] = (room.playerCount || 0) + addedBots;

            database.ref().update(updates).then(() => {
                console.log(`${addedBots}개의 봇이 추가되었습니다.`);
            });
        } else {
            alert('이미 모든 자리가 차있습니다!');
        }
    });
}

// ==================== GAME LOGIC ====================

const SUITS = {
    JADE: { name: 'jade', symbol: '♦', color: 'jade' },
    SWORD: { name: 'sword', symbol: '♠', color: 'sword' },
    PAGODA: { name: 'pagoda', symbol: '♥', color: 'pagoda' },
    STAR: { name: 'star', symbol: '♣', color: 'star' }
};

const SPECIAL_CARDS = {
    MAHJONG: { name: 'One', value: 1, points: 0, isSpecial: true },
    DOG: { name: 'Cat', value: 0, points: 0, isSpecial: true },
    PHOENIX: { name: 'Joker', value: -1, points: -25, isSpecial: true },
    DRAGON: { name: 'Agni', value: 15, points: 25, isSpecial: true }
};

let gameState = null;
let selectedCards = [];

function createDeck() {
    const deck = [];

    // Add special cards
    deck.push({ ...SPECIAL_CARDS.MAHJONG, suit: 'special' });
    deck.push({ ...SPECIAL_CARDS.DOG, suit: 'special' });
    deck.push({ ...SPECIAL_CARDS.PHOENIX, suit: 'special' });
    deck.push({ ...SPECIAL_CARDS.DRAGON, suit: 'special' });

    // Add regular cards (2-14 for each suit)
    Object.values(SUITS).forEach(suit => {
        for (let value = 2; value <= 14; value++) {
            deck.push({
                suit: suit.name,
                value: value,
                points: value === 5 ? 5 : (value === 10 || value === 13) ? 10 : 0,
                isSpecial: false
            });
        }
    });

    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function initializeGameState() {
    try {
        console.log('📦 덱 생성 중...');
        const deck = createDeck();
        console.log('✅ 덱 생성 완료:', deck.length, '장');

        console.log('🔀 덱 섞는 중...');
        const shuffledDeck = shuffleDeck(deck);
        console.log('✅ 덱 섞기 완료');

        console.log('🎴 카드 분배 중...');
        const hands = { 0: [], 1: [], 2: [], 3: [] };

        // Deal cards
        if (shuffledDeck.length !== 56) {
            throw new Error(`덱 카드 수가 잘못되었습니다: ${shuffledDeck.length}장 (56장이어야 함)`);
        }

        for (let i = 0; i < 56; i++) {
            const playerIndex = i % 4;
            if (!shuffledDeck[i]) {
                throw new Error(`카드 ${i}가 존재하지 않습니다`);
            }
            hands[playerIndex].push(shuffledDeck[i]);
        }

        console.log('✅ 카드 분배 완료 (각 플레이어 14장)');

        console.log('🔢 손패 정렬 중...');
        // Sort hands
        Object.keys(hands).forEach(playerIndex => {
            sortHand(hands[playerIndex]);
        });
        console.log('✅ 손패 정렬 완료');

        console.log('🎴 소원(숫자 1) 찾는 중...');
        // Find player with Wish card (One)
        let startPlayer = 0;
        Object.entries(hands).forEach(([index, hand]) => {
            const hasWish = hand.some(card =>
                card.isSpecial && (card.name === 'One' || card.name === 'Mah Jong')
            );
            if (hasWish) {
                startPlayer = parseInt(index);
                console.log(`✅ 소원(숫자 1) 발견: 플레이어 ${index}가 선 플레이어입니다`);
            }
        });

        const newGameState = {
            hands: hands,
            currentPlayer: startPlayer,
            currentPlay: null,
            consecutivePasses: 0,
            finishedPlayers: [],
            bettingCalls: { 0: null, 1: null, 2: null, 3: null }, // 'grand' or 'quad'
            totalScores: { team1: 0, team2: 0 },
            roundActive: true,
            wish: null, // Mah Jong wish (숫자 1 소원)
            cardsPlayed: { 0: false, 1: false, 2: false, 3: false }, // Track if player has played a card
            wonCards: { 0: [], 1: [], 2: [], 3: [] }, // Cards won by each player
            currentTrickCards: [], // Cards currently on the table
            lastPlayerToPlay: null // Last player who played cards (wins the trick)
        };

        console.log('✅ 게임 상태 초기화 완료');
        return newGameState;

    } catch (error) {
        console.error('❌ initializeGameState 에러:', error);
        throw new Error('게임 상태 초기화 실패: ' + error.message);
    }
}

function sortHand(hand) {
    hand.sort((a, b) => {
        if (a.name === 'Dog') return -1;
        if (b.name === 'Dog') return 1;
        if (a.name === 'Phoenix') return a.value - b.value;
        if (b.name === 'Phoenix') return a.value - b.value;
        return a.value - b.value;
    });
}

function normalizeGameState(state) {
    // Firebase may convert numeric-keyed objects to arrays
    // Convert hands back to object format if needed
    if (Array.isArray(state.hands)) {
        console.log('⚠️ hands가 배열로 변환되었습니다. 객체로 변환 중...');
        const handsObj = {};
        state.hands.forEach((hand, index) => {
            handsObj[index] = hand || [];
        });
        state.hands = handsObj;
    }

    // Ensure all 4 players have hands
    if (!state.hands) {
        console.error('❌ hands가 없습니다!');
        state.hands = { 0: [], 1: [], 2: [], 3: [] };
    } else {
        for (let i = 0; i < 4; i++) {
            if (!state.hands[i]) {
                console.warn(`⚠️ 플레이어 ${i}의 손패가 없습니다. 빈 배열로 초기화합니다.`);
                state.hands[i] = [];
            }
        }
    }

    // Same for bettingCalls (renamed from tichuCalls)
    if (Array.isArray(state.bettingCalls)) {
        const callsObj = {};
        state.bettingCalls.forEach((call, index) => {
            callsObj[index] = call;
        });
        state.bettingCalls = callsObj;
    }

    // Handle legacy tichuCalls
    if (state.tichuCalls && !state.bettingCalls) {
        state.bettingCalls = state.tichuCalls;
    }

    if (!state.bettingCalls) {
        state.bettingCalls = { 0: null, 1: null, 2: null, 3: null };
    } else {
        for (let i = 0; i < 4; i++) {
            if (state.bettingCalls[i] === undefined) {
                state.bettingCalls[i] = null;
            }
        }
    }

    // Handle cardsPlayed
    if (!state.cardsPlayed) {
        state.cardsPlayed = { 0: false, 1: false, 2: false, 3: false };
    } else {
        for (let i = 0; i < 4; i++) {
            if (state.cardsPlayed[i] === undefined) {
                state.cardsPlayed[i] = false;
            }
        }
    }

    // Handle wonCards
    if (!state.wonCards) {
        state.wonCards = { 0: [], 1: [], 2: [], 3: [] };
    } else {
        for (let i = 0; i < 4; i++) {
            if (!state.wonCards[i]) {
                state.wonCards[i] = [];
            }
        }
    }

    // Handle currentTrickCards
    if (!state.currentTrickCards) {
        state.currentTrickCards = [];
    }

    // Handle lastPlayerToPlay
    if (state.lastPlayerToPlay === undefined) {
        state.lastPlayerToPlay = null;
    }

    return state;
}

function startMultiplayerGame(room) {
    console.log('🎮 게임 시작!', room);

    showScreen('game-screen');

    // Normalize game state to handle Firebase serialization
    gameState = normalizeGameState(room.gameState);
    console.log('✅ 게임 상태 정규화 완료:', gameState);

    // Clear bot players tracking
    botPlayers = {};

    // Set player names and track bots
    const positions = ['south', 'west', 'north', 'east'];
    positions.forEach((pos, index) => {
        const player = room.players[index];
        if (player) {
            document.getElementById(`${pos}-name`).textContent = player.nickname;
            if (player.isBot) {
                botPlayers[index] = true;
                console.log(`🤖 위치 ${index} (${pos})는 봇입니다:`, player.nickname);
            } else {
                console.log(`👤 위치 ${index} (${pos})는 사람입니다:`, player.nickname);
            }
        }
    });

    console.log('🤖 봇 플레이어 목록:', botPlayers);
    console.log('🎯 시작 플레이어:', gameState.currentPlayer);

    // Listen to game state changes
    const gameStateRef = database.ref(`rooms/${currentRoom.code}/gameState`);
    gameStateRef.on('value', (snapshot) => {
        const newGameState = snapshot.val();
        if (newGameState) {
            console.log('📡 게임 상태 업데이트 수신 - 현재 플레이어:', newGameState.currentPlayer);
            gameState = normalizeGameState(newGameState);
            renderGame();

            // Trigger bot play if it's a bot's turn
            checkAndTriggerBotPlay();
        }
    });

    renderGame();

    // Trigger initial bot play if needed
    console.log('🔍 초기 봇 턴 체크 중...');
    checkAndTriggerBotPlay();
}

// Helper function to check and trigger bot play
function checkAndTriggerBotPlay() {
    if (!gameState || !gameState.roundActive) {
        console.log('❌ 게임 상태가 없거나 라운드가 비활성화됨');
        return;
    }

    const currentPlayer = gameState.currentPlayer;
    const currentHand = gameState.hands[currentPlayer];

    // Check if current player has no cards left - auto pass
    if (!currentHand || currentHand.length === 0) {
        console.log(`⏭️ 플레이어 ${currentPlayer}는 카드가 없어서 자동 패스`);
        // Make sure they're in finishedPlayers
        if (!gameState.finishedPlayers.includes(currentPlayer)) {
            gameState.finishedPlayers.push(currentPlayer);

            // Check if a team has both players finished
            if (checkTeamFinished()) {
                console.log('🎊 라운드 종료! (한 팀 완료)');
                endRound();
                syncGameState();
                return;
            }
        }
        // Auto pass
        gameState.consecutivePasses++;
        const requiredPasses = getRequiredPasses();
        if (gameState.consecutivePasses >= requiredPasses) {
            console.log(`🧹 테이블 클리어! (${requiredPasses}연속 패스)`);

            // Award trick to last player who played cards
            if (gameState.lastPlayerToPlay !== null && gameState.currentTrickCards && gameState.currentTrickCards.length > 0) {
                const winner = gameState.lastPlayerToPlay;
                console.log(`🏆 플레이어 ${winner}가 트릭의 ${gameState.currentTrickCards.length}장 카드를 획득했습니다!`);

                if (!gameState.wonCards) gameState.wonCards = { 0: [], 1: [], 2: [], 3: [] };
                if (!gameState.wonCards[winner]) gameState.wonCards[winner] = [];

                gameState.wonCards[winner].push(...gameState.currentTrickCards);

                // Log cards won
                const cardNames = gameState.currentTrickCards.map(c => {
                    if (c.isSpecial) return c.name;
                    const valueNames = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
                    return (valueNames[c.value] || c.value) + c.suit[0].toUpperCase();
                }).join(', ');
                console.log(`📥 획득한 카드: ${cardNames}`);
            }

            gameState.currentPlay = null;
            gameState.consecutivePasses = 0;
            gameState.wish = null;
            gameState.currentTrickCards = [];
            gameState.lastPlayerToPlay = null;
        }
        nextTurn();
        syncGameState();
        return;
    }

    const isBot = botPlayers[currentPlayer];

    console.log(`🔍 턴 체크 - 플레이어 ${currentPlayer}, 봇: ${isBot ? 'O' : 'X'}, 라운드 활성: ${gameState.roundActive ? 'O' : 'X'}`);

    if (isBot) {
        console.log('🤖 봇 턴 감지! triggerBotPlay 호출 예약...');
        // Cancel any existing bot timer
        if (botTimers[currentPlayer]) {
            clearTimeout(botTimers[currentPlayer]);
        }
        // Trigger bot play with a small delay (빠른 테스트용: 200ms)
        botTimers[currentPlayer] = setTimeout(() => {
            console.log('🎯 봇 플레이 타이머 실행됨');
            triggerBotPlay();
        }, 200);
    } else {
        console.log('👤 사람 턴 - 봇 플레이 안 함');
    }
}

function getCardDisplay(card) {
    if (card.isSpecial) {
        const symbols = {
            'One': '1',           // 소원 → 숫자 1
            'Cat': '🐕',          // 고양이 → 강아지
            'Joker': '🔥',        // 조커 → 불 (불사조)
            'Agni': '🐉',         // 아그니 → 용
            // 구버전 호환
            'Mah Jong': '1',
            'Dog': '🐕',
            'Phoenix': '🔥',
            'Dragon': '🐉',
            'Tiger': '🐉'
        };
        return { display: symbols[card.name] || card.name, suit: 'special', cardName: card.name };
    }

    const valueNames = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
    const display = valueNames[card.value] || card.value.toString();
    const suit = SUITS[card.suit.toUpperCase()];
    return { display, suit: suit ? suit.symbol : '', color: card.suit };
}

function renderCard(card, clickable = false) {
    const cardEl = document.createElement('div');
    const { display, suit, color, cardName } = getCardDisplay(card);

    // Set card class - use 'special' for special cards, otherwise use color
    cardEl.className = `card ${color || 'special'}`;

    // Check if it's a special card and render accordingly
    if (display === '🔥') {
        // Phoenix/Joker card - big emoji, fill entire card (불/불사조)
        cardEl.innerHTML = `<div class="card-value" style="font-size: 2.8em; display: flex; align-items: center; justify-content: center; height: 100%;">${display}</div>`;
    } else if (display === '🐉') {
        // Dragon/Agni card - big emoji, fill entire card (용)
        cardEl.innerHTML = `<div class="card-value" style="font-size: 2.8em; display: flex; align-items: center; justify-content: center; height: 100%;">${display}</div>`;
    } else if (display === '🐕') {
        // Dog/Cat card - big emoji, fill entire card (강아지)
        cardEl.innerHTML = `<div class="card-value" style="font-size: 2.5em; display: flex; align-items: center; justify-content: center; height: 100%;">${display}</div>`;
    } else if (display === '1') {
        // Wish card (숫자 1) - big number with label (scaled for smaller cards)
        cardEl.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div class="card-value" style="font-size: 2.5em; font-weight: bold;">${display}</div>
                <div style="font-size: 0.8em; margin-top: 3px;">소원</div>
            </div>
        `;
    } else {
        // Regular cards
        cardEl.innerHTML = `
            <div class="card-value">${display}</div>
            ${suit && suit !== 'special' ? `<div class="card-suit">${suit}</div>` : ''}
        `;
    }

    if (clickable) {
        cardEl.onclick = () => toggleCardSelection(card, cardEl);

        // Check if already selected
        if (selectedCards.some(c => JSON.stringify(c) === JSON.stringify(card))) {
            cardEl.classList.add('selected');
        }
    }

    return cardEl;
}

function toggleCardSelection(card, cardEl) {
    const cardIndex = selectedCards.findIndex(c => JSON.stringify(c) === JSON.stringify(card));

    if (cardIndex > -1) {
        selectedCards.splice(cardIndex, 1);
        cardEl.classList.remove('selected');
        console.log(`🔽 카드 선택 해제:`, card.isSpecial ? card.name : `${card.value}${card.suit[0]}`, '(현재:', selectedCards.length, '장)');
    } else {
        selectedCards.push(card);
        cardEl.classList.add('selected');
        console.log(`🔼 카드 선택:`, card.isSpecial ? card.name : `${card.value}${card.suit[0]}`, '(현재:', selectedCards.length, '장)');
    }
}

function validateCombination(cards) {
    if (cards.length === 0) return null;
    if (cards.length === 1) {
        const card = cards[0];
        console.log(`🃏 싱글 카드 검증:`, {
            value: card.value,
            isSpecial: card.isSpecial,
            name: card.name
        });

        // Cat/Dog card cannot be played as a regular single
        // It must be handled separately in playCards()
        if (card.isSpecial && (card.name === 'Cat' || card.name === 'Dog')) {
            console.error('❌ 고양이 카드는 일반 싱글로 낼 수 없습니다! (특수 처리 필요)');
            return null;
        }

        return { type: 'single', value: card.value, cards };
    }

    // Check for pair
    if (cards.length === 2) {
        console.log(`🃏 페어 검증: card1=${cards[0].value}, card2=${cards[1].value}`);
        if (cards[0].value === cards[1].value) {
            console.log(`✅ 유효한 페어: value=${cards[0].value}`);
            return { type: 'pair', value: cards[0].value, cards };
        } else {
            console.log(`❌ 페어 아님: value가 다름`);
        }
    }

    // Check for three of a kind
    if (cards.length === 3) {
        if (cards[0].value === cards[1].value && cards[1].value === cards[2].value) {
            return { type: 'triple', value: cards[0].value, cards };
        }
    }

    // Check for four of a kind (bomb)
    if (cards.length === 4) {
        if (cards[0].value === cards[1].value &&
            cards[1].value === cards[2].value &&
            cards[2].value === cards[3].value) {
            return { type: 'bomb-quad', value: cards[0].value, cards };
        }
    }

    // Check for full house
    if (cards.length === 5) {
        const sorted = [...cards].sort((a, b) => a.value - b.value);
        if ((sorted[0].value === sorted[1].value && sorted[1].value === sorted[2].value &&
             sorted[3].value === sorted[4].value) ||
            (sorted[0].value === sorted[1].value &&
             sorted[2].value === sorted[3].value && sorted[3].value === sorted[4].value)) {
            return { type: 'fullhouse', value: Math.max(sorted[2].value, sorted[3].value), cards };
        }
    }

    // Check for straight (5+ consecutive cards)
    if (cards.length >= 5) {
        console.log('🎴 스트레이트 검증 시작:', cards.length, '장');

        // Separate jokers from regular cards
        const jokers = cards.filter(c => c.isSpecial && (c.name === 'Joker' || c.name === 'Phoenix'));
        const regularCards = cards.filter(c => !c.isSpecial || (c.name !== 'Joker' && c.name !== 'Phoenix'));

        console.log('  조커:', jokers.length, '장');
        console.log('  일반 카드:', regularCards.length, '장');

        // Sort regular cards by value
        const sorted = [...regularCards].sort((a, b) => a.value - b.value);
        console.log('  정렬된 카드:', sorted.map(c => c.value).join(', '));

        if (sorted.length === 0 && jokers.length >= 5) {
            // All jokers - invalid straight
            console.log('❌ 조커만으로는 스트레이트 불가');
            return null;
        }

        // Calculate total gaps between consecutive cards
        let totalGaps = 0;
        for (let i = 1; i < sorted.length; i++) {
            const gap = sorted[i].value - sorted[i-1].value - 1;
            console.log(`  ${sorted[i-1].value} -> ${sorted[i].value}: gap ${gap}`);

            if (gap < 0) {
                // Duplicate values - not a valid straight
                console.log('❌ 중복된 값 발견');
                return null;
            }

            totalGaps += gap;
        }

        console.log('  총 gap:', totalGaps, ', 필요한 조커:', totalGaps, ', 보유 조커:', jokers.length);

        // Check if total length matches
        const expectedLength = sorted.length + jokers.length;
        const actualSpan = sorted[sorted.length - 1].value - sorted[0].value + 1;

        console.log('  예상 길이:', expectedLength, ', 실제 범위:', actualSpan);

        if (totalGaps === jokers.length && expectedLength === actualSpan) {
            console.log('✅ 유효한 스트레이트!');
            const highestValue = sorted[sorted.length - 1].value;

            // Check if it's a straight flush (same suit + joker doesn't break it)
            const nonJokerSuit = sorted.length > 0 ? sorted[0].suit : null;
            const sameSuit = sorted.every(card => card.suit === nonJokerSuit);

            if (sameSuit && nonJokerSuit) {
                console.log('💣 스트레이트 플러시!');
                return { type: 'bomb-straight', value: highestValue, cards };
            }

            return { type: 'straight', value: highestValue, cards };
        } else {
            console.log('❌ 조커가 부족하여 스트레이트 불가');
        }
    }

    // Check for consecutive pairs (stairs)
    if (cards.length >= 4 && cards.length % 2 === 0) {
        const sorted = [...cards].sort((a, b) => a.value - b.value);
        let isStairs = true;
        for (let i = 0; i < sorted.length; i += 2) {
            if (i + 1 >= sorted.length || sorted[i].value !== sorted[i + 1].value) {
                isStairs = false;
                break;
            }
            if (i + 2 < sorted.length && sorted[i + 1].value + 1 !== sorted[i + 2].value) {
                isStairs = false;
                break;
            }
        }
        if (isStairs) {
            return { type: 'stairs', value: sorted[sorted.length - 1].value, cards };
        }
    }

    return null;
}

function isValidPlay(newPlay, currentPlay) {
    if (!currentPlay) return newPlay !== null;

    // Bombs can be played on anything
    if (newPlay.type.startsWith('bomb-')) {
        if (!currentPlay.type.startsWith('bomb-')) return true;
        if (newPlay.type === 'bomb-straight' && currentPlay.type === 'bomb-quad') return true;
        if (newPlay.type === currentPlay.type) return newPlay.value > currentPlay.value;
        return false;
    }

    if (newPlay.type !== currentPlay.type) {
        console.log(`❌ 타입이 다름: new=${newPlay.type}, current=${currentPlay.type}`);
        return false;
    }
    if (newPlay.cards.length !== currentPlay.cards.length) {
        console.log(`❌ 카드 수가 다름: new=${newPlay.cards.length}, current=${currentPlay.cards.length}`);
        return false;
    }

    // Special rule: Phoenix/Joker cannot beat Dragon/Agni
    if (newPlay.type === 'single' && currentPlay.type === 'single') {
        const currentIsDragon = currentPlay.cards.some(c =>
            c.isSpecial && (c.name === 'Agni' || c.name === 'Dragon' || c.name === 'Tiger')
        );
        const newIsPhoenix = newPlay.cards.some(c =>
            c.isSpecial && (c.name === 'Joker' || c.name === 'Phoenix')
        );

        if (currentIsDragon && newIsPhoenix) {
            console.log('❌ 봉황은 용을 이길 수 없습니다! 폭탄만 가능합니다.');
            return false;
        }
    }

    const isValid = newPlay.value > currentPlay.value;
    console.log(`🔍 밸류 비교: new=${newPlay.value} vs current=${currentPlay.value}, 결과: ${isValid ? '✅' : '❌'}`);
    return isValid;
}

// Helper: Check if cards contain Mah Jong (숫자 1)
function containsMahJong(cards) {
    return cards.some(card =>
        card.isSpecial && (card.name === 'One' || card.name === 'Mah Jong')
    );
}

// Helper: Check if hand has the wished card (or Joker)
function hasWishCard(hand, wish) {
    if (!wish) return false;

    // Check for the wished value
    const hasValue = hand.some(card => !card.isSpecial && card.value === wish);

    // Check for Joker (can substitute any card)
    const hasJoker = hand.some(card =>
        card.isSpecial && (card.name === 'Joker' || card.name === 'Phoenix')
    );

    return hasValue || hasJoker;
}

// Helper: Check if combination contains the wished card (or Joker)
function combinationContainsWish(combination, wish) {
    if (!wish || !combination || !combination.cards) return false;

    // Check if any card in the combination matches the wish value
    const hasWishValue = combination.cards.some(card =>
        !card.isSpecial && card.value === wish
    );

    // Check if Joker is used (can substitute the wish)
    const hasJoker = combination.cards.some(card =>
        card.isSpecial && (card.name === 'Joker' || card.name === 'Phoenix')
    );

    return hasWishValue || hasJoker;
}

// Helper: Check if combination is a bomb
function isBomb(combination) {
    if (!combination || !combination.type) return false;
    return combination.type === 'bomb-quad' || combination.type === 'bomb-straight';
}

async function playCards() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎴 playCards() 호출됨');
    console.log('  selectedCards 길이:', selectedCards.length);
    console.log('  selectedCards 내용:', selectedCards.map(c => {
        if (c.isSpecial) return c.name;
        return `${c.value}${c.suit[0]}`;
    }).join(', '));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (selectedCards.length === 0) {
        alert('카드를 선택해주세요!');
        return;
    }

    // Clear auto-pass flag (user is manually playing cards)
    autoPassPending = false;

    // Check if it's a Cat (Dog) card FIRST - before other validations
    console.log('🔍 고양이 카드 체크 시작');
    console.log('  선택된 카드 수:', selectedCards.length);
    if (selectedCards.length === 1) {
        const card = selectedCards[0];
        console.log('  카드 정보:', {
            isSpecial: card.isSpecial,
            name: card.name,
            value: card.value
        });
    }

    const isCat = selectedCards.length === 1 && selectedCards[0].isSpecial &&
                  (selectedCards[0].name === 'Cat' || selectedCards[0].name === 'Dog');

    console.log('  고양이 카드 여부:', isCat);

    if (isCat) {
        console.log('🐱 고양이 카드 감지! 파트너에게 턴 전달');
        console.log('  현재 플레이:', gameState.currentPlay);
        console.log('  내 턴:', isMyTurn());

        // Only allowed when leading a new trick
        if (gameState.currentPlay !== null) {
            console.error('❌ 고양이는 새 트릭에서만 가능 (현재 플레이:', gameState.currentPlay.type, ')');
            alert('고양이는 새로운 트릭을 시작할 때만 낼 수 있습니다!');
            return;
        }

        // Must be my turn
        if (!isMyTurn()) {
            console.error('❌ 내 턴이 아님');
            alert('당신의 차례가 아닙니다!');
            return;
        }

        console.log('✅ 고양이 카드 검증 통과!');

        // Remove cat from hand
        const myHand = gameState.hands[currentRoom.playerPosition];
        const index = myHand.findIndex(c => JSON.stringify(c) === JSON.stringify(selectedCards[0]));
        if (index > -1) myHand.splice(index, 1);
        selectedCards = [];

        // Find partner (opposite player)
        const myPosition = currentRoom.playerPosition;
        let partnerPosition = (myPosition + 2) % 4;

        console.log(`🔍 내 위치: ${myPosition}, 파트너 위치: ${partnerPosition}`);

        // Check if partner has finished
        if (gameState.finishedPlayers.includes(partnerPosition)) {
            console.log('⚠️ 파트너가 이미 나갔습니다. 시계방향으로 이동...');

            // Move clockwise from partner until we find someone who hasn't finished
            let nextPlayer = (partnerPosition + 1) % 4;
            let attempts = 0;

            while (gameState.finishedPlayers.includes(nextPlayer) && attempts < 4) {
                console.log(`⏭️ 플레이어 ${nextPlayer}도 나갔습니다. 계속 이동...`);
                nextPlayer = (nextPlayer + 1) % 4;
                attempts++;
            }

            gameState.currentPlayer = nextPlayer;
            console.log(`✅ 턴이 플레이어 ${nextPlayer}에게 넘어갑니다`);
        } else {
            // Partner is still playing, give turn to partner
            gameState.currentPlayer = partnerPosition;
            console.log(`✅ 파트너(${partnerPosition})에게 턴 전달! 원하는 조합을 낼 수 있습니다.`);
        }

        // Cat doesn't set currentPlay - new trick starts
        gameState.currentPlay = null;
        gameState.consecutivePasses = 0;

        syncGameState();
        return;
    }

    // ========== Normal card play (not Cat) ==========

    console.log('🎴 일반 카드 플레이 시도:', selectedCards.length, '장');
    console.log('🎴 선택된 카드:', selectedCards.map(c => {
        if (c.isSpecial) return c.name;
        return `${c.value}${c.suit[0]} (type: ${typeof c.value})`;
    }).join(', '));

    // Validate combination
    const combination = validateCombination(selectedCards);
    if (!combination) {
        console.error('❌ 유효하지 않은 조합!');
        alert('유효하지 않은 조합입니다!');
        return;
    }

    console.log('✅ 유효한 조합:', combination.type, 'value:', combination.value, '(type:', typeof combination.value, ')');

    // Check if it's a bomb - bombs can be played anytime!
    const isBombPlay = isBomb(combination);

    if (isBombPlay) {
        console.log('💣 폭탄 감지! 언제든지 낼 수 있습니다.');

        // Check if it can beat the current bomb (if any)
        if (gameState.currentPlay && isBomb(gameState.currentPlay)) {
            if (!isValidPlay(combination, gameState.currentPlay)) {
                alert('현재 폭탄보다 더 강한 폭탄을 내야 합니다!');
                return;
            }
        }
    } else {
        // Not a bomb - normal turn checking
        if (!isMyTurn()) {
            alert('당신의 차례가 아닙니다! (폭탄만 언제든지 낼 수 있습니다)');
            return;
        }

        console.log('🎴 카드 내기 시도:', combination.type, '현재 플레이:', gameState.currentPlay ? gameState.currentPlay.type : 'null (새 트릭)');

        // Check if there's an active wish that must be fulfilled
        if (gameState.wish) {
            const myHand = gameState.hands[currentRoom.playerPosition];
            const hasWish = hasWishCard(myHand, gameState.wish);
            const containsWish = combinationContainsWish(combination, gameState.wish);

            if (hasWish && !containsWish) {
                const valueNames = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
                const wishName = valueNames[gameState.wish] || gameState.wish;
                alert(`소원 카드(${wishName})가 손에 있으면 반드시 포함시켜야 합니다!`);
                return;
            }

            if (containsWish) {
                console.log('✅ 소원 카드 포함됨! 소원이 성취되었습니다.');
            }
        }

        const validPlay = isValidPlay(combination, gameState.currentPlay);
        console.log('🔍 isValidPlay 결과:', validPlay);
        console.log('🔍 현재 플레이:', gameState.currentPlay ? `${gameState.currentPlay.type} (value: ${gameState.currentPlay.value}, type: ${typeof gameState.currentPlay.value})` : 'null');
        console.log('🔍 내 조합:', `${combination.type} (value: ${combination.value}, type: ${typeof combination.value})`);

        if (!validPlay) {
            if (gameState.currentPlay) {
                console.error(`❌ 현재 플레이보다 낮음: ${combination.value} <= ${gameState.currentPlay.value}`);
                alert(`현재 플레이(${gameState.currentPlay.type})보다 높은 카드를 내야 합니다!`);
            } else {
                console.error('❌ 유효하지 않은 플레이 (이유 불명)');
                alert('유효하지 않은 플레이입니다!');
            }
            return;
        }

        console.log('✅ 유효한 플레이!');
    }

    // Check if Wish card (숫자 1) is played - ask for wish
    if (containsMahJong(selectedCards)) {
        console.log('🎴 소원(숫자 1) 카드 발견! 소원을 빌 수 있습니다.');

        const wishValue = await showWishModal();

        if (wishValue) {
            gameState.wish = wishValue;
            const valueNames = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
            const wishName = valueNames[wishValue] || wishValue;
            console.log(`🌟 소원이 설정되었습니다: ${wishName}`);
        } else {
            console.log('❌ 소원을 빌지 않았습니다.');
        }
    }

    // Add cards to current trick
    if (!gameState.currentTrickCards) gameState.currentTrickCards = [];
    gameState.currentTrickCards.push(...selectedCards);
    console.log(`📥 트릭에 카드 추가: ${selectedCards.length}장 (총 ${gameState.currentTrickCards.length}장)`);

    // Remove cards from hand
    const myHand = gameState.hands[currentRoom.playerPosition];
    selectedCards.forEach(card => {
        const index = myHand.findIndex(c => JSON.stringify(c) === JSON.stringify(card));
        if (index > -1) myHand.splice(index, 1);
    });

    // Mark that this player has played a card (disables grand betting)
    gameState.cardsPlayed[currentRoom.playerPosition] = true;

    // Update game state
    gameState.currentPlay = combination;
    gameState.lastPlayerToPlay = currentRoom.playerPosition;
    gameState.consecutivePasses = 0;
    console.log('🔄 연속 패스 카운터 리셋: 0');

    // If bomb, take the turn!
    if (isBombPlay) {
        gameState.currentPlayer = currentRoom.playerPosition;
        console.log(`💣 폭탄으로 턴 획득! 현재 플레이어: ${currentRoom.playerPosition}`);
    }

    // Clear wish if it was fulfilled
    if (gameState.wish && combinationContainsWish(combination, gameState.wish)) {
        console.log('✅ 소원이 성취되었습니다! 소원 클리어.');
        gameState.wish = null;
    }

    selectedCards = [];

    // Check if player finished
    if (myHand.length === 0) {
        console.log('🏁 플레이어가 모든 카드를 냈습니다!');
        gameState.finishedPlayers.push(currentRoom.playerPosition);

        // Check if a team has both players finished
        if (checkTeamFinished()) {
            console.log('🎊 라운드 종료! (한 팀 완료)');
            endRound();
            syncGameState();
            return;
        }
    }

    // For bombs, we already set the turn above, so just sync
    // For normal plays, move to next turn
    if (!isBombPlay) {
        nextTurn();
    }
    syncGameState();
}

// Helper function to check if a team has both players finished
function checkTeamFinished() {
    const finished = gameState.finishedPlayers || [];

    // Team 1: players 0 and 2 (남북)
    const team1Finished = finished.includes(0) && finished.includes(2);

    // Team 2: players 1 and 3 (동서)
    const team2Finished = finished.includes(1) && finished.includes(3);

    if (team1Finished) {
        console.log('🏆 팀 1 (남북) 완료! 게임 즉시 종료');
        return true;
    }

    if (team2Finished) {
        console.log('🏆 팀 2 (동서) 완료! 게임 즉시 종료');
        return true;
    }

    return false;
}

// Helper function to calculate required passes
function getRequiredPasses() {
    // Number of players still in the game
    const activePlayers = 4 - (gameState.finishedPlayers ? gameState.finishedPlayers.length : 0);
    // Required passes = active players - 1
    const required = Math.max(1, activePlayers - 1);
    console.log(`🎯 필요한 패스 수: ${required} (활성 플레이어: ${activePlayers})`);
    return required;
}

function passTurn() {
    if (!isMyTurn()) {
        alert('당신의 차례가 아닙니다!');
        return;
    }

    console.log('👋 패스 호출');
    console.log('  선택된 카드 (패스 전):', selectedCards.map(c => {
        if (c.isSpecial) return c.name;
        return `${c.value}${c.suit[0]}`;
    }).join(', '));

    // Clear auto-pass flag
    autoPassPending = false;

    // IMPORTANT: Clear selected cards FIRST before any logic
    selectedCards.splice(0, selectedCards.length); // Clear array completely
    console.log('  ✅ 선택 카드 초기화 완료, 현재 길이:', selectedCards.length);

    gameState.consecutivePasses++;

    const requiredPasses = getRequiredPasses();
    console.log(`📊 연속 패스: ${gameState.consecutivePasses}/${requiredPasses}`);

    if (gameState.consecutivePasses >= requiredPasses) {
        console.log(`🧹 테이블 클리어! (${requiredPasses}연속 패스) - 새로운 조합을 낼 수 있습니다!`);

        // Award trick to last player who played cards
        if (gameState.lastPlayerToPlay !== null && gameState.currentTrickCards && gameState.currentTrickCards.length > 0) {
            const winner = gameState.lastPlayerToPlay;
            console.log(`🏆 플레이어 ${winner}가 트릭의 ${gameState.currentTrickCards.length}장 카드를 획득했습니다!`);

            if (!gameState.wonCards) gameState.wonCards = { 0: [], 1: [], 2: [], 3: [] };
            if (!gameState.wonCards[winner]) gameState.wonCards[winner] = [];

            gameState.wonCards[winner].push(...gameState.currentTrickCards);

            // Log cards won
            const cardNames = gameState.currentTrickCards.map(c => {
                if (c.isSpecial) return c.name;
                const valueNames = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
                return (valueNames[c.value] || c.value) + c.suit[0].toUpperCase();
            }).join(', ');
            console.log(`📥 획득한 카드: ${cardNames}`);
        }

        gameState.currentPlay = null;
        gameState.consecutivePasses = 0;
        gameState.wish = null; // Clear wish when table is cleared
        gameState.currentTrickCards = []; // Clear trick cards
        gameState.lastPlayerToPlay = null;
        console.log('✨ 소원도 클리어되었습니다.');
    }

    nextTurn();
    syncGameState();
}

function nextTurn() {
    const startPlayer = gameState.currentPlayer;
    let attempts = 0;

    do {
        gameState.currentPlayer = (gameState.currentPlayer + 1) % 4;
        attempts++;

        // Prevent infinite loop
        if (attempts > 4) {
            console.error('❌ nextTurn 무한 루프 방지! 완료된 플레이어:', gameState.finishedPlayers);
            break;
        }
    } while (gameState.finishedPlayers && gameState.finishedPlayers.includes(gameState.currentPlayer));

    // Reset auto-pass flag when turn changes
    autoPassPending = false;

    console.log(`⏭️ nextTurn: ${startPlayer} → ${gameState.currentPlayer}`);
}

function isMyTurn() {
    return gameState.currentPlayer === currentRoom.playerPosition;
}

function syncGameState() {
    console.log('🔄 syncGameState - 게임 상태 동기화 중...');
    console.log('📤 동기화 할 상태 - 현재 플레이어:', gameState.currentPlayer, '라운드 활성:', gameState.roundActive);

    if (!currentRoom.code) {
        console.error('❌ 방 코드가 없습니다!');
        return;
    }

    database.ref(`rooms/${currentRoom.code}/gameState`).set(gameState)
        .then(() => {
            console.log('✅ 게임 상태 동기화 성공 - Firebase에 업데이트됨');
        })
        .catch((error) => {
            console.error('❌ 게임 상태 동기화 실패:', error);
            alert('게임 상태 동기화 실패: ' + error.message);
        });
}

function endRound() {
    gameState.roundActive = false;

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          🎊 라운드 종료 - 점수 계산 시작 🎊               ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    const positionNames = ['남(0)', '서(1)', '북(2)', '동(3)'];

    // Initialize won cards if missing
    if (!gameState.wonCards) {
        gameState.wonCards = { 0: [], 1: [], 2: [], 3: [] };
    }

    // Calculate card points for each player
    let team1CardPoints = 0;
    let team2CardPoints = 0;

    console.log('📊 각 플레이어가 획득한 카드 점수:');
    console.log('─────────────────────────────────────────────────────');

    for (let i = 0; i < 4; i++) {
        const wonCards = gameState.wonCards[i] || [];
        let playerPoints = 0;
        let cardDetails = [];

        wonCards.forEach(card => {
            if (card.points !== undefined && card.points !== 0) {
                playerPoints += card.points;
                const cardName = card.isSpecial ? card.name :
                    (card.value === 11 ? 'J' : card.value === 12 ? 'Q' : card.value === 13 ? 'K' : card.value === 14 ? 'A' : card.value);
                cardDetails.push(`${cardName}(${card.points > 0 ? '+' : ''}${card.points})`);
            }
        });

        const team = i % 2 === 0 ? 'team1' : 'team2';
        if (team === 'team1') {
            team1CardPoints += playerPoints;
        } else {
            team2CardPoints += playerPoints;
        }

        console.log(`  ${positionNames[i]}: ${wonCards.length}장 획득, ${playerPoints > 0 ? '+' : ''}${playerPoints}점`);
        if (cardDetails.length > 0) {
            console.log(`    점수 카드: ${cardDetails.join(', ')}`);
        }
    }

    console.log('');
    console.log('🏁 완료 순서:');
    console.log('─────────────────────────────────────────────────────');
    gameState.finishedPlayers.forEach((player, index) => {
        console.log(`  ${index + 1}등: ${positionNames[player]}`);
    });

    // Initialize score calculation
    let team1Points = 0;
    let team2Points = 0;

    // Check for one-two finish (1-2등 독식)
    let oneTwoFinish = false;
    if (gameState.finishedPlayers.length >= 2) {
        const first = gameState.finishedPlayers[0];
        const second = gameState.finishedPlayers[1];

        // Team 1: players 0 and 2 (남, 북)
        // Team 2: players 1 and 3 (서, 동)
        const team1 = [0, 2];
        const team2 = [1, 3];

        if (team1.includes(first) && team1.includes(second)) {
            console.log('');
            console.log('🎉 1-2등 독식! 팀 1 (남-북)이 1-2등을 차지했습니다!');
            team1Points = 200;
            oneTwoFinish = true;
        } else if (team2.includes(first) && team2.includes(second)) {
            console.log('');
            console.log('🎉 1-2등 독식! 팀 2 (서-동)이 1-2등을 차지했습니다!');
            team2Points = 200;
            oneTwoFinish = true;
        }
    }

    // If not one-two finish, use card points
    if (!oneTwoFinish) {
        console.log('');
        console.log('📊 카드 점수 합산:');
        console.log(`  팀 1 (남-북): ${team1CardPoints > 0 ? '+' : ''}${team1CardPoints}점`);
        console.log(`  팀 2 (서-동): ${team2CardPoints > 0 ? '+' : ''}${team2CardPoints}점`);
        team1Points = team1CardPoints;
        team2Points = team2CardPoints;
    }

    // Calculate betting bonuses/penalties
    console.log('');
    console.log('🎲 베팅 결과:');
    console.log('─────────────────────────────────────────────────────');

    let hasBetting = false;
    if (gameState.bettingCalls && gameState.finishedPlayers.length > 0) {
        const firstPlayer = gameState.finishedPlayers[0];

        for (let i = 0; i < 4; i++) {
            const bet = gameState.bettingCalls[i];
            if (bet) {
                hasBetting = true;
                const isWinner = (i === firstPlayer);
                const team = i % 2 === 0 ? 'team1' : 'team2';
                const betName = bet === 'grand' ? '그랜드 베팅' : '쿼드 베팅';
                const points = bet === 'grand' ? 200 : 100;

                if (isWinner) {
                    console.log(`  ✅ ${positionNames[i]}: ${betName} 성공! +${points}점`);
                    if (team === 'team1') {
                        team1Points += points;
                    } else {
                        team2Points += points;
                    }
                } else {
                    console.log(`  ❌ ${positionNames[i]}: ${betName} 실패! -${points}점`);
                    if (team === 'team1') {
                        team1Points -= points;
                    } else {
                        team2Points -= points;
                    }
                }
            }
        }
    }

    if (!hasBetting) {
        console.log('  (베팅 없음)');
    }

    // Update total scores
    gameState.totalScores.team1 += team1Points;
    gameState.totalScores.team2 += team2Points;

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📊 이번 라운드 점수:`);
    console.log(`   팀 1 (남-북): ${team1Points > 0 ? '+' : ''}${team1Points}점`);
    console.log(`   팀 2 (서-동): ${team2Points > 0 ? '+' : ''}${team2Points}점`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(`🏆 현재 총점:`);
    console.log(`   팀 1 (남-북): ${gameState.totalScores.team1}점`);
    console.log(`   팀 2 (서-동): ${gameState.totalScores.team2}점`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    if (gameState.totalScores.team1 >= 1000 || gameState.totalScores.team2 >= 1000) {
        const winner = gameState.totalScores.team1 > gameState.totalScores.team2 ? '팀 1 (남-북)' : '팀 2 (서-동)';
        console.log(`🎊🎊🎊 게임 종료! ${winner} 승리! 🎊🎊🎊`);
        alert(`게임 종료! ${winner} 승리!`);
    }
}

function renderGame() {
    try {
        console.log('🎨 renderGame 호출됨');

        if (!gameState) {
            console.log('❌ gameState가 없습니다');
            return;
        }

        if (!gameState.hands) {
            console.error('❌ gameState.hands가 없습니다!', gameState);
            return;
        }

        const positions = ['south', 'west', 'north', 'east'];

        positions.forEach((pos, index) => {
            try {
                const handEl = document.getElementById(`${pos}-hand`);
                const countEl = document.getElementById(`${pos}-count`);

                if (!handEl || !countEl) {
                    console.warn(`⚠️ DOM 요소 없음: ${pos}-hand 또는 ${pos}-count`);
                    return;
                }

                // Safety check for hands
                const hand = gameState.hands[index];
                if (!hand || !Array.isArray(hand)) {
                    console.error(`❌ 플레이어 ${index}의 손패가 없거나 배열이 아닙니다:`, hand);
                    handEl.innerHTML = '';
                    countEl.textContent = '0';
                    return; // Skip this player
                }

                handEl.innerHTML = '';
                countEl.textContent = hand.length;

                if (index === currentRoom.playerPosition) {
                    // Show player's cards (clickable)
                    hand.forEach(card => {
                        try {
                            handEl.appendChild(renderCard(card, true));
                        } catch (err) {
                            console.error('카드 렌더링 에러:', err, card);
                        }
                    });

                    // Clean up selectedCards - remove cards that are no longer in hand
                    const cleanedCards = selectedCards.filter(selectedCard =>
                        hand.some(handCard => JSON.stringify(handCard) === JSON.stringify(selectedCard))
                    );

                    if (cleanedCards.length !== selectedCards.length) {
                        console.log(`🧹 선택 카드 정리: ${selectedCards.length} → ${cleanedCards.length}장`);
                        selectedCards = cleanedCards;
                    }
                } else {
                    // Show other players' cards (for debugging - not clickable)
                    hand.forEach(card => {
                        try {
                            handEl.appendChild(renderCard(card, false));
                        } catch (err) {
                            console.error('카드 렌더링 에러:', err, card);
                        }
                    });
                }

                // Highlight active player
                const playerEl = document.getElementById(`player-${pos}`);
                if (playerEl) {
                    if (gameState.currentPlayer === index) {
                        playerEl.classList.add('active');
                    } else {
                        playerEl.classList.remove('active');
                    }
                }

                // Update Betting badges
                const bettingEl = document.getElementById(`${pos}-tichu`); // Using same DOM element
                if (bettingEl && gameState.bettingCalls && gameState.bettingCalls[index]) {
                    const type = gameState.bettingCalls[index] === 'grand' ? 'grand' : '';
                    const text = gameState.bettingCalls[index] === 'grand' ? 'GB' : 'QB'; // Grand Betting / Quad Betting
                    bettingEl.innerHTML = `<span class="tichu-badge ${type}">${text}</span>`;
                } else if (bettingEl) {
                    bettingEl.innerHTML = '';
                }
            } catch (err) {
                console.error(`❌ renderGame 루프 에러 (${pos}):`, err);
            }
        });

        // Render current play
        const playedCardsEl = document.getElementById('played-cards');
        const combinationTypeEl = document.getElementById('combination-type');

        if (playedCardsEl && combinationTypeEl) {
            playedCardsEl.innerHTML = '';

            if (gameState.currentPlay && gameState.currentPlay.cards) {
                gameState.currentPlay.cards.forEach(card => {
                    try {
                        playedCardsEl.appendChild(renderCard(card));
                    } catch (err) {
                        console.error('현재 플레이 카드 렌더링 에러:', err, card);
                    }
                });

                const typeNames = {
                    'single': '싱글',
                    'pair': '페어',
                    'triple': '트리플',
                    'straight': '스트레이트',
                    'fullhouse': '풀하우스',
                    'stairs': '계단',
                    'bomb-quad': '폭탄 (4장)',
                    'bomb-straight': '폭탄 (스트레이트 플러시)'
                };
                const typeName = typeNames[gameState.currentPlay.type] || gameState.currentPlay.type;

                // Calculate required passes based on active players
                const activePlayers = 4 - (gameState.finishedPlayers ? gameState.finishedPlayers.length : 0);
                const requiredPasses = Math.max(1, activePlayers - 1);
                const passInfo = gameState.consecutivePasses > 0 ? ` (패스 ${gameState.consecutivePasses}/${requiredPasses})` : '';

                // Add wish info if active
                const valueNames = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
                const wishInfo = gameState.wish ? ` ✨소원: ${valueNames[gameState.wish] || gameState.wish}` : '';

                combinationTypeEl.textContent = typeName + passInfo + wishInfo;
            } else {
                // No current play - new trick
                const activePlayers = 4 - (gameState.finishedPlayers ? gameState.finishedPlayers.length : 0);
                const requiredPasses = Math.max(1, activePlayers - 1);
                const passInfo = gameState.consecutivePasses > 0 ? `패스 ${gameState.consecutivePasses}/${requiredPasses} - ` : '';

                // Add wish info if active
                const valueNames = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
                const wishInfo = gameState.wish ? ` ✨소원: ${valueNames[gameState.wish] || gameState.wish}` : '';

                combinationTypeEl.textContent = passInfo + (gameState.consecutivePasses === 0 ? '새 트릭 - 아무 조합이나 가능' : '') + wishInfo;
            }
        }

        // Show finished players
        const finishedEl = document.getElementById('finished-players');
        const positionNames = ['남', '서', '북', '동'];
        if (finishedEl && gameState.finishedPlayers) {
            if (gameState.finishedPlayers.length > 0) {
                finishedEl.innerHTML = '완료: ' + gameState.finishedPlayers.map((p, i) =>
                    `<span class="finished-player">${i + 1}등: ${positionNames[p]}</span>`
                ).join('');
            } else {
                finishedEl.innerHTML = '';
            }
        }

        // Update scores
        const team1ScoreEl = document.getElementById('team1-score');
        const team2ScoreEl = document.getElementById('team2-score');
        if (team1ScoreEl && team2ScoreEl && gameState.totalScores) {
            team1ScoreEl.textContent = gameState.totalScores.team1 || 0;
            team2ScoreEl.textContent = gameState.totalScores.team2 || 0;
        }

        // Update play info
        const playInfoEl = document.getElementById('play-info');
        if (playInfoEl && typeof gameState.currentPlayer === 'number') {
            const currentPlayerName = positionNames[gameState.currentPlayer];
            playInfoEl.textContent = `${currentPlayerName}의 턴`;
        }

        // Update game info
        const gameInfoEl = document.getElementById('game-info');
        if (gameInfoEl && typeof gameState.currentPlayer === 'number') {
            const currentPlayerName = positionNames[gameState.currentPlayer];
            gameInfoEl.textContent = isMyTurn() ? '당신의 차례입니다!' : `${currentPlayerName}의 차례입니다`;
        }

        // Update button states
        const btnPlay = document.getElementById('btn-play');
        const btnBomb = document.getElementById('btn-bomb');
        const btnPass = document.getElementById('btn-pass');
        const btnBetting = document.getElementById('btn-tichu'); // Using same button

        // Check if current player (me) has no cards left
        const myHand = gameState.hands[currentRoom.playerPosition];
        const hasNoCards = !myHand || myHand.length === 0;

        if (hasNoCards && isMyTurn() && gameState.roundActive && !autoPassPending) {
            // Auto pass if I have no cards
            console.log('🎴 내 카드가 없어서 자동 패스 예약');
            autoPassPending = true;
            setTimeout(() => {
                if (autoPassPending) {
                    console.log('🎴 자동 패스 실행');
                    autoPassPending = false;
                    passTurn();
                }
            }, 500); // Small delay for visual clarity
        }

        if (btnPlay) btnPlay.disabled = !isMyTurn() || !gameState.roundActive || hasNoCards;
        if (btnPass) btnPass.disabled = !isMyTurn() || !gameState.roundActive || hasNoCards;

        // Bomb button is always enabled during active round (can play bombs anytime)
        if (btnBomb) {
            btnBomb.disabled = !gameState.roundActive;
        }

        if (btnBetting && gameState.bettingCalls && currentRoom.playerPosition !== null) {
            // Can't bet if already bet or round is not active
            btnBetting.disabled = gameState.bettingCalls[currentRoom.playerPosition] !== null || !gameState.roundActive;

            // Update button text based on whether player has played cards
            const hasPlayedCards = gameState.cardsPlayed && gameState.cardsPlayed[currentRoom.playerPosition];
            if (hasPlayedCards) {
                btnBetting.textContent = '🎲 쿼드 베팅'; // Only Quad betting available
            } else {
                btnBetting.textContent = '🎲 베팅'; // Both available - will prompt
            }
        }

        console.log('📊 렌더링 완료 - 현재 플레이어:', gameState.currentPlayer, '봇 여부:', !!botPlayers[gameState.currentPlayer], '라운드 활성:', gameState.roundActive);

    } catch (error) {
        console.error('❌ renderGame 전체 에러:', error);
        console.error('에러 스택:', error.stack);
    }
}

function declareBetting() {
    if (gameState.bettingCalls[currentRoom.playerPosition] !== null) {
        alert('이미 베팅하셨습니다!');
        return;
    }

    if (!gameState.roundActive) {
        alert('라운드가 활성화되지 않았습니다!');
        return;
    }

    const hasPlayedCards = gameState.cardsPlayed && gameState.cardsPlayed[currentRoom.playerPosition];

    // Check if Grand Betting is available (only if no cards played yet - first 8 cards)
    if (!hasPlayedCards) {
        // Both Grand and Quad betting available
        const choice = confirm('그랜드 베팅(성공 +200점, 실패 -200점)을 하시겠습니까?\n\n취소를 누르면 쿼드 베팅(성공 +100점, 실패 -100점)을 선택할 수 있습니다.');

        if (choice) {
            gameState.bettingCalls[currentRoom.playerPosition] = 'grand';
            syncGameState();
            alert('🎰 그랜드 베팅 선언! 1등으로 모든 카드를 내야 합니다.\n성공: +200점 | 실패: -200점');
        } else {
            const quadChoice = confirm('쿼드 베팅(성공 +100점, 실패 -100점)을 하시겠습니까?');
            if (quadChoice) {
                gameState.bettingCalls[currentRoom.playerPosition] = 'quad';
                syncGameState();
                alert('🎲 쿼드 베팅 선언! 1등으로 모든 카드를 내야 합니다.\n성공: +100점 | 실패: -100점');
            }
        }
    } else {
        // Only Quad betting available (already played cards)
        const choice = confirm('쿼드 베팅(성공 +100점, 실패 -100점)을 하시겠습니까?');
        if (choice) {
            gameState.bettingCalls[currentRoom.playerPosition] = 'quad';
            syncGameState();
            alert('🎲 쿼드 베팅 선언! 1등으로 모든 카드를 내야 합니다.\n성공: +100점 | 실패: -100점');
        }
    }
}

// Legacy function name for compatibility
function declareTichu() {
    declareBetting();
}

function startNewRound() {
    if (!currentRoom.isHost) {
        alert('방장만 새 라운드를 시작할 수 있습니다!');
        return;
    }

    const newGameState = initializeGameState();
    newGameState.totalScores = gameState.totalScores;

    database.ref(`rooms/${currentRoom.code}/gameState`).set(newGameState);
}

function leaveGame() {
    if (confirm('게임을 나가시겠습니까?')) {
        leaveRoom();
    }
}

// ==================== BOT AI ====================

function triggerBotPlay() {
    console.log('🤖 triggerBotPlay 호출됨');

    if (!gameState || !gameState.roundActive) {
        console.log('❌ 게임 상태가 없거나 라운드가 비활성화됨');
        return;
    }

    const botPosition = gameState.currentPlayer;
    console.log('🤖 현재 플레이어:', botPosition, '봇 여부:', botPlayers[botPosition]);

    if (!botPlayers[botPosition]) {
        console.log('❌ 현재 플레이어는 봇이 아닙니다');
        return;
    }

    // Clear any existing timer for this bot
    if (botTimers[botPosition]) {
        clearTimeout(botTimers[botPosition]);
    }

    // Add delay to simulate thinking (1-2 seconds)
    const delay = 1000 + Math.random() * 1000;
    console.log(`⏱️ 봇이 ${Math.round(delay)}ms 후에 플레이합니다`);

    botTimers[botPosition] = setTimeout(() => {
        try {
            executeBotPlay(botPosition);
        } catch (error) {
            console.error('❌ 봇 플레이 중 에러:', error);
            // 에러 발생 시 패스 처리
            passBotTurn(botPosition);
        }
    }, delay);
}

function executeBotPlay(botPosition) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎮 executeBotPlay 시작');
    console.log('봇 위치:', botPosition);
    console.log('현재 플레이어:', gameState ? gameState.currentPlayer : 'undefined');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!gameState || !gameState.roundActive) {
        console.log('❌ 게임 상태가 없거나 라운드가 비활성화됨');
        return;
    }

    if (gameState.currentPlayer !== botPosition) {
        console.log('❌ 현재 턴이 아닙니다. 현재:', gameState.currentPlayer, '봇:', botPosition);
        return;
    }

    const hand = gameState.hands[botPosition];
    if (!hand || hand.length === 0) {
        console.log('❌ 봇의 손패가 없거나 비어있습니다');
        return;
    }

    console.log('🃏 봇의 카드 수:', hand.length);
    console.log('🎯 현재 플레이:', gameState.currentPlay ? `${gameState.currentPlay.type} (${gameState.currentPlay.value})` : 'null (새 트릭)');

    try {
        console.log('🔍 findBotPlay 호출 중...');
        // Bot AI logic - try to find a valid play
        const validPlay = findBotPlay(hand, gameState.currentPlay);

        if (validPlay) {
            console.log('✅ 봇이 낼 카드를 찾았습니다:', validPlay.type, validPlay.cards.length, '장');
            console.log('카드 상세:', validPlay.cards.map(c => `${c.value}${c.suit}`).join(', '));
            // Bot plays cards
            playBotCards(botPosition, validPlay);
        } else {
            console.log('⏭️ 봇이 낼 카드가 없어서 패스합니다');
            // Bot passes
            passBotTurn(botPosition);
        }
    } catch (error) {
        console.error('❌ executeBotPlay 에러:', error);
        console.error('스택:', error.stack);
        // 에러 발생 시 패스
        passBotTurn(botPosition);
    }
}

function findBotPlay(hand, currentPlay) {
    try {
        if (!hand || hand.length === 0) {
            console.error('❌ findBotPlay: 손패가 없습니다');
            return null;
        }

        // If no current play, try to play combinations first (pair, triple) then single
        if (!currentPlay) {
            // Check if we must fulfill a wish
            if (gameState.wish && hasWishCard(hand, gameState.wish)) {
                console.log('🤖 봇: 소원 카드를 우선적으로 냅니다');
                // Try to play the wish card
                for (let card of hand) {
                    if (!card.isSpecial && card.value === gameState.wish) {
                        return { type: 'single', value: card.value, cards: [card] };
                    }
                }
                // If not found, try Joker
                for (let card of hand) {
                    if (card.isSpecial && (card.name === 'Joker' || card.name === 'Phoenix')) {
                        return { type: 'single', value: card.value, cards: [card] };
                    }
                }
            }

            // Try to find combinations (prefer triple > pair > single)
            // Try triple first
            for (let i = 0; i < hand.length - 2; i++) {
                if (!hand[i].isSpecial && !hand[i + 1].isSpecial && !hand[i + 2].isSpecial &&
                    hand[i].value === hand[i + 1].value && hand[i + 1].value === hand[i + 2].value) {
                    console.log('🤖 봇: 트리플 발견!');
                    return { type: 'triple', value: hand[i].value, cards: [hand[i], hand[i + 1], hand[i + 2]] };
                }
            }

            // Try pair next
            for (let i = 0; i < hand.length - 1; i++) {
                if (!hand[i].isSpecial && !hand[i + 1].isSpecial &&
                    hand[i].value === hand[i + 1].value) {
                    console.log('🤖 봇: 페어 발견!');
                    return { type: 'pair', value: hand[i].value, cards: [hand[i], hand[i + 1]] };
                }
            }

            // Finally play single lowest non-special card (avoid wasting special cards at start)
            for (let i = 0; i < hand.length; i++) {
                if (!hand[i].isSpecial && hand[i].value !== undefined) {
                    console.log('🤖 봇: 싱글 카드 (value: ' + hand[i].value + ')');
                    return { type: 'single', value: hand[i].value, cards: [hand[i]] };
                }
            }

            // If only special cards left, play the first available one
            if (hand[0] && hand[0].value !== undefined) {
                const card = hand[0];
                // For special cards, use appropriate value
                const value = card.isSpecial && (card.name === 'Joker' || card.name === 'Phoenix') ? 2 : card.value;
                console.log('🤖 봇: 특수 카드 싱글 (value: ' + value + ')');
                return { type: 'single', value: value, cards: [card] };
            } else {
                console.error('❌ findBotPlay: 유효한 카드가 없습니다', hand[0]);
                return null;
            }
        }

        // Try to find a valid play that beats current play
        const playType = currentPlay.type;
        const playValue = currentPlay.value;
        const playLength = currentPlay.cards ? currentPlay.cards.length : 0;

        // Check if we must fulfill a wish
        const mustFulfillWish = gameState.wish && hasWishCard(hand, gameState.wish);

        // Try single cards
        if (playType === 'single' && playLength === 1) {
            // Check if current play is Dragon (cannot beat with Phoenix)
            const currentIsDragon = currentPlay.cards.some(c =>
                c.isSpecial && (c.name === 'Agni' || c.name === 'Dragon' || c.name === 'Tiger')
            );

            // If wish is active, try wish card first
            if (mustFulfillWish) {
                for (let card of hand) {
                    if (!card.isSpecial && card.value === gameState.wish && card.value > playValue) {
                        console.log('🤖 봇: 소원 카드로 플레이');
                        return { type: 'single', value: card.value, cards: [card] };
                    }
                }
                // Try Joker - can be used as any value (but not against Dragon)
                if (!currentIsDragon) {
                    for (let card of hand) {
                        if (card.isSpecial && (card.name === 'Joker' || card.name === 'Phoenix')) {
                            // Use joker with value higher than current play
                            const jokerValue = Math.max(playValue + 1, gameState.wish || 0);
                            console.log('🤖 봇: 조커로 소원 성취');
                            return { type: 'single', value: jokerValue, cards: [card] };
                        }
                    }
                }
            }

            // Normal play - try regular cards first
            for (let card of hand) {
                if (!card.isSpecial && card.value > playValue) {
                    return { type: 'single', value: card.value, cards: [card] };
                }
            }

            // If no regular card works, try Joker (only if current play is NOT Dragon)
            if (!currentIsDragon) {
                for (let card of hand) {
                    if (card.isSpecial && (card.name === 'Joker' || card.name === 'Phoenix')) {
                        // Use joker with value slightly higher than current play
                        const jokerValue = playValue + 1;
                        console.log('🤖 봇: 조커 사용 (value: ' + jokerValue + ')');
                        return { type: 'single', value: jokerValue, cards: [card] };
                    }
                }
            } else {
                console.log('🤖 봇: 용이 나와서 봉황을 사용할 수 없습니다');
            }
        }

        // Try pairs
        if (playType === 'pair' && playLength === 2) {
            for (let i = 0; i < hand.length - 1; i++) {
                if (hand[i].value === hand[i + 1].value && hand[i].value > playValue) {
                    // Check if wish is fulfilled
                    const combination = { type: 'pair', value: hand[i].value, cards: [hand[i], hand[i + 1]] };
                    if (mustFulfillWish && !combinationContainsWish(combination, gameState.wish)) {
                        continue; // Skip this if wish not fulfilled
                    }
                    return combination;
                }
            }
        }

        // Try triples
        if (playType === 'triple' && playLength === 3) {
            for (let i = 0; i < hand.length - 2; i++) {
                if (hand[i].value === hand[i + 1].value &&
                    hand[i + 1].value === hand[i + 2].value &&
                    hand[i].value > playValue) {
                    // Check if wish is fulfilled
                    const combination = { type: 'triple', value: hand[i].value, cards: [hand[i], hand[i + 1], hand[i + 2]] };
                    if (mustFulfillWish && !combinationContainsWish(combination, gameState.wish)) {
                        continue; // Skip this if wish not fulfilled
                    }
                    return combination;
                }
            }
        }

        // For more complex combinations, just pass for now
        // TODO: Implement straight, fullhouse, stairs detection

        return null;

    } catch (error) {
        console.error('❌ findBotPlay 에러:', error);
        return null;
    }
}

function playBotCards(botPosition, combination) {
    console.log('🎴 playBotCards 시작 - 위치:', botPosition, '조합:', combination ? combination.type : 'null');

    try {
        if (!gameState || !gameState.hands) {
            console.error('❌ gameState 또는 hands가 없습니다');
            return;
        }

        if (!combination || !combination.cards || combination.cards.length === 0) {
            console.error('❌ 유효하지 않은 combination:', combination);
            return;
        }

        // Check if bot is playing Wish card (숫자 1) - make a wish
        if (containsMahJong(combination.cards)) {
            console.log('🤖 봇이 소원(숫자 1)을 냈습니다! 소원을 빕니다.');
            // Bot makes a random wish (2-14)
            const wishValue = Math.floor(Math.random() * 13) + 2; // 2~14
            gameState.wish = wishValue;
            const valueNames = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
            const wishName = valueNames[wishValue] || wishValue;
            console.log(`🌟 봇의 소원: ${wishName}`);
        }

        // Remove cards from bot's hand
        const botHand = gameState.hands[botPosition];
        if (!botHand || !Array.isArray(botHand)) {
            console.error('❌ 봇의 손패가 없거나 배열이 아닙니다');
            return;
        }

        const originalLength = botHand.length;

        combination.cards.forEach(card => {
            const index = botHand.findIndex(c =>
                c.value === card.value &&
                c.suit === card.suit &&
                c.name === card.name
            );
            if (index > -1) {
                botHand.splice(index, 1);
                console.log('✂️ 카드 제거:', card.value, card.suit);
            } else {
                console.warn('⚠️ 제거할 카드를 찾지 못함:', card);
            }
        });

        console.log(`📉 봇 손패: ${originalLength} → ${botHand.length}`);

        // Add cards to current trick
        if (!gameState.currentTrickCards) gameState.currentTrickCards = [];
        gameState.currentTrickCards.push(...combination.cards);
        console.log(`📥 봇 트릭에 카드 추가: ${combination.cards.length}장 (총 ${gameState.currentTrickCards.length}장)`);

        // Mark that this bot has played a card (disables grand betting)
        gameState.cardsPlayed[botPosition] = true;

        // Update game state
        gameState.currentPlay = combination;
        gameState.lastPlayerToPlay = botPosition;
        gameState.consecutivePasses = 0;

        // Clear wish if it was fulfilled
        if (gameState.wish && combinationContainsWish(combination, gameState.wish)) {
            console.log('✅ 봇이 소원을 성취했습니다! 소원 클리어.');
            gameState.wish = null;
        }

        // Check if bot finished
        if (botHand.length === 0) {
            console.log('🏁 봇이 모든 카드를 냈습니다!');
            if (!gameState.finishedPlayers) gameState.finishedPlayers = [];
            gameState.finishedPlayers.push(botPosition);

            // Check if a team has both players finished
            if (checkTeamFinished()) {
                console.log('🎊 라운드 종료! (한 팀 완료)');
                endRound();
                syncGameState();
                return;
            }
        }

        nextTurn();
        syncGameState();
    } catch (error) {
        console.error('❌ playBotCards 에러:', error);
        console.error('스택:', error.stack);
        // Don't throw, just log and try to continue
        try {
            passBotTurn(botPosition);
        } catch (e) {
            console.error('❌ 패스 처리도 실패:', e);
        }
    }
}

function passBotTurn(botPosition) {
    console.log('⏭️ passBotTurn - 위치:', botPosition);

    try {
        if (!gameState) {
            console.error('❌ gameState가 없습니다');
            return;
        }

        if (gameState.consecutivePasses === undefined) {
            gameState.consecutivePasses = 0;
        }

        gameState.consecutivePasses++;

        const requiredPasses = getRequiredPasses();
        console.log(`📊 연속 패스: ${gameState.consecutivePasses}/${requiredPasses}`);

        if (gameState.consecutivePasses >= requiredPasses) {
            console.log(`🧹 테이블 클리어! (${requiredPasses}연속 패스) - 새로운 조합을 낼 수 있습니다!`);

            // Award trick to last player who played cards
            if (gameState.lastPlayerToPlay !== null && gameState.currentTrickCards && gameState.currentTrickCards.length > 0) {
                const winner = gameState.lastPlayerToPlay;
                console.log(`🏆 플레이어 ${winner}가 트릭의 ${gameState.currentTrickCards.length}장 카드를 획득했습니다!`);

                if (!gameState.wonCards) gameState.wonCards = { 0: [], 1: [], 2: [], 3: [] };
                if (!gameState.wonCards[winner]) gameState.wonCards[winner] = [];

                gameState.wonCards[winner].push(...gameState.currentTrickCards);

                // Log cards won
                const cardNames = gameState.currentTrickCards.map(c => {
                    if (c.isSpecial) return c.name;
                    const valueNames = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
                    return (valueNames[c.value] || c.value) + c.suit[0].toUpperCase();
                }).join(', ');
                console.log(`📥 획득한 카드: ${cardNames}`);
            }

            gameState.currentPlay = null;
            gameState.consecutivePasses = 0;
            gameState.wish = null; // Clear wish when table is cleared
            gameState.currentTrickCards = []; // Clear trick cards
            gameState.lastPlayerToPlay = null;
            console.log('✨ 소원도 클리어되었습니다.');
        }

        nextTurn();
        syncGameState();
    } catch (error) {
        console.error('❌ passBotTurn 에러:', error);
        console.error('스택:', error.stack);
        // Don't throw, just log
    }
}

// ==================== WISH SELECTION MODAL ====================

function showWishModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('wish-modal');
        modal.style.display = 'flex';

        const wishButtons = document.querySelectorAll('.wish-btn');
        const noWishBtn = document.getElementById('wish-no-btn');

        const handleWishSelect = (value) => {
            modal.style.display = 'none';
            // Remove event listeners
            wishButtons.forEach(btn => btn.replaceWith(btn.cloneNode(true)));
            noWishBtn.replaceWith(noWishBtn.cloneNode(true));
            resolve(value);
        };

        // Re-attach event listeners (after cloning to avoid duplicates)
        setTimeout(() => {
            document.querySelectorAll('.wish-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = parseInt(btn.getAttribute('data-value'));
                    console.log(`✨ 소원 선택: ${value}`);
                    handleWishSelect(value);
                });
            });

            document.getElementById('wish-no-btn').addEventListener('click', () => {
                console.log('❌ 소원 없이 진행');
                handleWishSelect(null);
            });
        }, 0);
    });
}

// ==================== EVENT LISTENERS ====================

try {
    document.getElementById('btn-play').addEventListener('click', playCards);
    document.getElementById('btn-pass').addEventListener('click', passTurn);
    document.getElementById('btn-tichu').addEventListener('click', declareTichu);
    document.getElementById('btn-new-round').addEventListener('click', startNewRound);
    document.getElementById('btn-leave-game').addEventListener('click', leaveGame);

    // Enter key handlers
    document.getElementById('nickname-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setNickname();
    });

    document.getElementById('room-code-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinRoomByCode();
    });

    console.log('✅ 이벤트 리스너 등록 완료');
} catch (error) {
    console.error('❌ 이벤트 리스너 등록 실패:', error);
}

// Debug: Check if functions are defined
console.log('=== app.js 로드 완료 ===');
console.log('createRoom 함수 정의됨:', typeof createRoom === 'function');
console.log('setNickname 함수 정의됨:', typeof setNickname === 'function');
console.log('showScreen 함수 정의됨:', typeof showScreen === 'function');

// Test log on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log('페이지 로드 완료');
    console.log('Firebase 객체:', typeof firebase !== 'undefined' ? 'OK' : 'NOT FOUND');
    console.log('database 객체:', typeof database !== 'undefined' ? 'OK' : 'NOT FOUND');
});
