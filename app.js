// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
    console.error('전역 에러 발생:', message, '파일:', source, '라인:', lineno);
    alert('에러 발생: ' + message);
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
    if (!currentRoom.isHost) return;

    const roomRef = database.ref(`rooms/${currentRoom.code}`);

    // Initialize game state
    const gameState = initializeGameState();

    roomRef.update({
        gameStarted: true,
        gameState: gameState
    });
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
    MAHJONG: { name: 'Mah Jong', value: 1, points: 0, isSpecial: true },
    DOG: { name: 'Dog', value: 0, points: 0, isSpecial: true },
    PHOENIX: { name: 'Phoenix', value: -1, points: -25, isSpecial: true },
    DRAGON: { name: 'Dragon', value: 15, points: 25, isSpecial: true }
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
    const deck = shuffleDeck(createDeck());
    const hands = { 0: [], 1: [], 2: [], 3: [] };

    // Deal cards
    for (let i = 0; i < 56; i++) {
        const playerIndex = i % 4;
        hands[playerIndex].push(deck[i]);
    }

    // Sort hands
    Object.keys(hands).forEach(playerIndex => {
        sortHand(hands[playerIndex]);
    });

    // Find player with Mahjong
    let startPlayer = 0;
    Object.entries(hands).forEach(([index, hand]) => {
        const hasMahjong = hand.some(card => card.isSpecial && card.name === 'Mah Jong');
        if (hasMahjong) {
            startPlayer = parseInt(index);
        }
    });

    return {
        hands: hands,
        currentPlayer: startPlayer,
        currentPlay: null,
        consecutivePasses: 0,
        finishedPlayers: [],
        tichuCalls: { 0: null, 1: null, 2: null, 3: null },
        totalScores: { team1: 0, team2: 0 },
        roundActive: true
    };
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

function startMultiplayerGame(room) {
    console.log('🎮 게임 시작!', room);

    showScreen('game-screen');
    gameState = room.gameState;

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

    // Listen to game state changes
    const gameStateRef = database.ref(`rooms/${currentRoom.code}/gameState`);
    gameStateRef.on('value', (snapshot) => {
        const newGameState = snapshot.val();
        if (newGameState) {
            console.log('📡 게임 상태 업데이트 수신');
            gameState = newGameState;
            renderGame();

            // Trigger bot play if it's a bot's turn
            if (botPlayers[gameState.currentPlayer] && gameState.roundActive) {
                console.log('🤖 봇 턴 감지 - 플레이 시작');
                setTimeout(() => triggerBotPlay(), 100); // Small delay for rendering
            }
        }
    });

    renderGame();

    // Trigger initial bot play if needed
    if (botPlayers[gameState.currentPlayer] && gameState.roundActive) {
        console.log('🤖 초기 봇 턴 - 플레이 시작');
        setTimeout(() => triggerBotPlay(), 500);
    }
}

function getCardDisplay(card) {
    if (card.isSpecial) {
        const symbols = {
            'Mah Jong': '🀄',
            'Dog': '🐕',
            'Phoenix': '🔥',
            'Dragon': '🐉'
        };
        return { display: symbols[card.name] || card.name, suit: 'special' };
    }

    const valueNames = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
    const display = valueNames[card.value] || card.value.toString();
    const suit = SUITS[card.suit.toUpperCase()];
    return { display, suit: suit ? suit.symbol : '', color: card.suit };
}

function renderCard(card, clickable = false) {
    const cardEl = document.createElement('div');
    const { display, suit, color } = getCardDisplay(card);

    cardEl.className = `card ${color}`;
    cardEl.innerHTML = `
        <div class="card-value">${display}</div>
        ${suit ? `<div class="card-suit">${suit}</div>` : ''}
    `;

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
    } else {
        selectedCards.push(card);
        cardEl.classList.add('selected');
    }
}

function validateCombination(cards) {
    if (cards.length === 0) return null;
    if (cards.length === 1) {
        return { type: 'single', value: cards[0].value, cards };
    }

    // Check for pair
    if (cards.length === 2) {
        if (cards[0].value === cards[1].value) {
            return { type: 'pair', value: cards[0].value, cards };
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
        const sorted = [...cards].sort((a, b) => a.value - b.value);
        let isConsecutive = true;
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].value !== sorted[i-1].value + 1) {
                isConsecutive = false;
                break;
            }
        }
        if (isConsecutive) {
            const sameSuit = sorted.every(card => !card.isSpecial && card.suit === sorted[0].suit);
            if (sameSuit) {
                return { type: 'bomb-straight', value: sorted[sorted.length - 1].value, cards };
            }
            return { type: 'straight', value: sorted[sorted.length - 1].value, cards };
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

    if (newPlay.type !== currentPlay.type) return false;
    if (newPlay.cards.length !== currentPlay.cards.length) return false;
    return newPlay.value > currentPlay.value;
}

function playCards() {
    if (!isMyTurn()) {
        alert('당신의 차례가 아닙니다!');
        return;
    }

    if (selectedCards.length === 0) {
        alert('카드를 선택해주세요!');
        return;
    }

    const combination = validateCombination(selectedCards);
    if (!combination) {
        alert('유효하지 않은 조합입니다!');
        return;
    }

    if (!isValidPlay(combination, gameState.currentPlay)) {
        alert('현재 플레이보다 높은 카드를 내야 합니다!');
        return;
    }

    // Remove cards from hand
    const myHand = gameState.hands[currentRoom.playerPosition];
    selectedCards.forEach(card => {
        const index = myHand.findIndex(c => JSON.stringify(c) === JSON.stringify(card));
        if (index > -1) myHand.splice(index, 1);
    });

    // Update game state
    gameState.currentPlay = combination;
    gameState.consecutivePasses = 0;
    selectedCards = [];

    // Check if player finished
    if (myHand.length === 0) {
        gameState.finishedPlayers.push(currentRoom.playerPosition);

        if (gameState.finishedPlayers.length === 3) {
            endRound();
            syncGameState();
            return;
        }
    }

    nextTurn();
    syncGameState();
}

function passTurn() {
    if (!isMyTurn()) {
        alert('당신의 차례가 아닙니다!');
        return;
    }

    gameState.consecutivePasses++;

    if (gameState.consecutivePasses === 3) {
        gameState.currentPlay = null;
        gameState.consecutivePasses = 0;
    }

    nextTurn();
    syncGameState();
}

function nextTurn() {
    do {
        gameState.currentPlayer = (gameState.currentPlayer + 1) % 4;
    } while (gameState.finishedPlayers.includes(gameState.currentPlayer));
}

function isMyTurn() {
    return gameState.currentPlayer === currentRoom.playerPosition;
}

function syncGameState() {
    console.log('🔄 syncGameState - 게임 상태 동기화 중...');

    if (!currentRoom.code) {
        console.error('❌ 방 코드가 없습니다!');
        return;
    }

    database.ref(`rooms/${currentRoom.code}/gameState`).set(gameState)
        .then(() => {
            console.log('✅ 게임 상태 동기화 성공');
        })
        .catch((error) => {
            console.error('❌ 게임 상태 동기화 실패:', error);
            alert('게임 상태 동기화 실패: ' + error.message);
        });
}

function endRound() {
    gameState.roundActive = false;

    // Calculate scores (simplified)
    let team1Points = 0;
    let team2Points = 0;

    // Check for one-two finish
    if (gameState.finishedPlayers.length >= 2) {
        const first = gameState.finishedPlayers[0];
        const second = gameState.finishedPlayers[1];

        if (first % 2 === second % 2) {
            if (first % 2 === 0) {
                team1Points = 200;
            } else {
                team2Points = 200;
            }
        }
    }

    gameState.totalScores.team1 += team1Points;
    gameState.totalScores.team2 += team2Points;

    if (gameState.totalScores.team1 >= 1000 || gameState.totalScores.team2 >= 1000) {
        const winner = gameState.totalScores.team1 > gameState.totalScores.team2 ? '팀 1' : '팀 2';
        alert(`게임 종료! ${winner} 승리!`);
    }
}

function renderGame() {
    if (!gameState) return;

    const positions = ['south', 'west', 'north', 'east'];

    positions.forEach((pos, index) => {
        const handEl = document.getElementById(`${pos}-hand`);
        const countEl = document.getElementById(`${pos}-count`);
        const hand = gameState.hands[index];

        handEl.innerHTML = '';
        countEl.textContent = hand.length;

        if (index === currentRoom.playerPosition) {
            // Show player's cards
            hand.forEach(card => {
                handEl.appendChild(renderCard(card, true));
            });
        } else {
            // Show card backs
            for (let i = 0; i < hand.length; i++) {
                const cardBack = document.createElement('div');
                cardBack.className = 'card';
                cardBack.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                cardBack.innerHTML = '<div class="card-value">🎴</div>';
                handEl.appendChild(cardBack);
            }
        }

        // Highlight active player
        const playerEl = document.getElementById(`player-${pos}`);
        if (gameState.currentPlayer === index) {
            playerEl.classList.add('active');
        } else {
            playerEl.classList.remove('active');
        }

        // Update Tichu badges
        const tichuEl = document.getElementById(`${pos}-tichu`);
        if (gameState.tichuCalls[index]) {
            const type = gameState.tichuCalls[index] === 'grand' ? 'grand' : '';
            const text = gameState.tichuCalls[index] === 'grand' ? 'GT' : 'T';
            tichuEl.innerHTML = `<span class="tichu-badge ${type}">${text}</span>`;
        } else {
            tichuEl.innerHTML = '';
        }
    });

    // Render current play
    const playedCardsEl = document.getElementById('played-cards');
    const combinationTypeEl = document.getElementById('combination-type');
    playedCardsEl.innerHTML = '';

    if (gameState.currentPlay) {
        gameState.currentPlay.cards.forEach(card => {
            playedCardsEl.appendChild(renderCard(card));
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
        combinationTypeEl.textContent = typeNames[gameState.currentPlay.type] || gameState.currentPlay.type;
    } else {
        combinationTypeEl.textContent = '';
    }

    // Show finished players
    const finishedEl = document.getElementById('finished-players');
    const positionNames = ['남', '서', '북', '동'];
    if (gameState.finishedPlayers.length > 0) {
        finishedEl.innerHTML = '완료: ' + gameState.finishedPlayers.map((p, i) =>
            `<span class="finished-player">${i + 1}등: ${positionNames[p]}</span>`
        ).join('');
    } else {
        finishedEl.innerHTML = '';
    }

    // Update scores
    document.getElementById('team1-score').textContent = gameState.totalScores.team1;
    document.getElementById('team2-score').textContent = gameState.totalScores.team2;

    // Update play info
    const currentPlayerName = positionNames[gameState.currentPlayer];
    document.getElementById('play-info').textContent = `${currentPlayerName}의 턴`;

    // Update game info
    document.getElementById('game-info').textContent =
        isMyTurn() ? '당신의 차례입니다!' : `${currentPlayerName}의 차례입니다`;

    // Update button states
    document.getElementById('btn-play').disabled = !isMyTurn() || !gameState.roundActive;
    document.getElementById('btn-pass').disabled = !isMyTurn() || !gameState.roundActive;
    document.getElementById('btn-tichu').disabled = gameState.tichuCalls[currentRoom.playerPosition] !== null || !gameState.roundActive;
}

function declareTichu() {
    if (gameState.tichuCalls[currentRoom.playerPosition] === null && gameState.roundActive) {
        gameState.tichuCalls[currentRoom.playerPosition] = 'tichu';
        syncGameState();
        alert('티추를 선언했습니다!');
    }
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
    console.log('🎮 executeBotPlay 시작 - 봇 위치:', botPosition);

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
    console.log('🎯 현재 플레이:', gameState.currentPlay);

    try {
        // Bot AI logic - try to find a valid play
        const validPlay = findBotPlay(hand, gameState.currentPlay);

        if (validPlay) {
            console.log('✅ 봇이 낼 카드를 찾았습니다:', validPlay.type, validPlay.cards.length, '장');
            // Bot plays cards
            playBotCards(botPosition, validPlay);
        } else {
            console.log('⏭️ 봇이 낼 카드가 없어서 패스합니다');
            // Bot passes
            passBotTurn(botPosition);
        }
    } catch (error) {
        console.error('❌ executeBotPlay 에러:', error);
        // 에러 발생 시 패스
        passBotTurn(botPosition);
    }
}

function findBotPlay(hand, currentPlay) {
    // If no current play, play lowest card/combination
    if (!currentPlay) {
        // Just play single lowest card for simplicity
        return { type: 'single', value: hand[0].value, cards: [hand[0]] };
    }

    // Try to find a valid play that beats current play
    const playType = currentPlay.type;
    const playValue = currentPlay.value;
    const playLength = currentPlay.cards.length;

    // Try single cards
    if (playType === 'single' && playLength === 1) {
        for (let card of hand) {
            if (card.value > playValue) {
                return { type: 'single', value: card.value, cards: [card] };
            }
        }
    }

    // Try pairs
    if (playType === 'pair' && playLength === 2) {
        for (let i = 0; i < hand.length - 1; i++) {
            if (hand[i].value === hand[i + 1].value && hand[i].value > playValue) {
                return { type: 'pair', value: hand[i].value, cards: [hand[i], hand[i + 1]] };
            }
        }
    }

    // Try triples
    if (playType === 'triple' && playLength === 3) {
        for (let i = 0; i < hand.length - 2; i++) {
            if (hand[i].value === hand[i + 1].value &&
                hand[i + 1].value === hand[i + 2].value &&
                hand[i].value > playValue) {
                return { type: 'triple', value: hand[i].value, cards: [hand[i], hand[i + 1], hand[i + 2]] };
            }
        }
    }

    // For more complex combinations, just pass for now
    // TODO: Implement straight, fullhouse, stairs detection

    return null;
}

function playBotCards(botPosition, combination) {
    console.log('🎴 playBotCards 시작 - 위치:', botPosition, '조합:', combination.type);

    try {
        // Remove cards from bot's hand
        const botHand = gameState.hands[botPosition];
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

        // Update game state
        gameState.currentPlay = combination;
        gameState.consecutivePasses = 0;

        // Check if bot finished
        if (botHand.length === 0) {
            console.log('🏁 봇이 모든 카드를 냈습니다!');
            gameState.finishedPlayers.push(botPosition);

            if (gameState.finishedPlayers.length === 3) {
                console.log('🎊 라운드 종료! (3명 완료)');
                endRound();
                syncGameState();
                return;
            }
        }

        nextTurn();
        syncGameState();
    } catch (error) {
        console.error('❌ playBotCards 에러:', error);
        throw error;
    }
}

function passBotTurn(botPosition) {
    console.log('⏭️ passBotTurn - 위치:', botPosition);

    try {
        gameState.consecutivePasses++;
        console.log('📊 연속 패스:', gameState.consecutivePasses);

        if (gameState.consecutivePasses === 3) {
            console.log('🧹 테이블 클리어! (3연속 패스)');
            gameState.currentPlay = null;
            gameState.consecutivePasses = 0;
        }

        nextTurn();
        syncGameState();
    } catch (error) {
        console.error('❌ passBotTurn 에러:', error);
        throw error;
    }
}

// ==================== EVENT LISTENERS ====================

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
