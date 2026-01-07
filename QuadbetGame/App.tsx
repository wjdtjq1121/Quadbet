import React, { useState } from 'react';
import { Alert, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MainMenuScreen } from './src/screens/MainMenuScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { GameScreen } from './src/screens/GameScreen';
import FirebaseService from './src/services/FirebaseService';
import { Player } from './src/types/GameTypes';
import { initializeGameState } from './src/utils/GameLogic';

type AppState = 'menu' | 'lobby' | 'game' | 'developer';

interface UserInfo {
  id: string;
  nickname: string;
}

interface GameInfo {
  roomCode: string;
  isHost: boolean;
  position: number;
}

const generateUserId = (): string => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const generateBotId = (): string => {
  return 'bot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const generateBotName = (): string => {
  const botNames = [
    '🤖 알파봇', '🤖 베타봇', '🤖 감마봇', '🤖 델타봇'
  ];
  return botNames[Math.floor(Math.random() * botNames.length)];
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('menu');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);

  const handleNicknameSet = async (nickname: string) => {
    // 일반 사용자
    if (!nickname.startsWith('Dev_')) {
      setUserInfo({
        id: generateUserId(),
        nickname
      });
      setAppState('lobby');
      return;
    }

    // 개발자 모드
    const devUser = {
      id: generateUserId(),
      nickname
    };
    setUserInfo(devUser);

    try {
      // 개발자 모드용 방 생성
      const roomCode = 'DEV001';
      
      const hostPlayer: Player = {
        id: devUser.id,
        nickname: devUser.nickname,
        position: 0, // 남쪽
        ready: true,
        hand: []
      };

      await FirebaseService.createRoom(roomCode, hostPlayer);

      // 봇 3명 추가
      for (let i = 1; i <= 3; i++) {
        const bot: Player = {
          id: generateBotId(),
          nickname: generateBotName(),
          position: i,
          ready: true,
          isBot: true,
          hand: []
        };
        
        await FirebaseService.addBot(roomCode, bot);
      }

      // 게임 시작
      const gameState = initializeGameState();
      await FirebaseService.startGame(roomCode, gameState);

      setGameInfo({
        roomCode,
        isHost: true,
        position: 0
      });
      
      setAppState('developer');
      
    } catch (error) {
      console.error('개발자 모드 실행 실패:', error);
      Alert.alert('오류', '개발자 모드 실행 중 오류가 발생했습니다.');
    }
  };

  const handleCreateRoom = async (roomCode: string) => {
    if (!userInfo) return;

    try {
      const hostPlayer: Player = {
        id: userInfo.id,
        nickname: userInfo.nickname,
        position: 0,
        ready: false,
        hand: []
      };

      await FirebaseService.createRoom(roomCode, hostPlayer);
      
      setGameInfo({
        roomCode,
        isHost: true,
        position: 0
      });
      
      setAppState('game');
      
    } catch (error) {
      console.error('방 생성 실패:', error);
      Alert.alert('오류', '방 생성에 실패했습니다.');
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    if (!userInfo) return;

    try {
      const player: Player = {
        id: userInfo.id,
        nickname: userInfo.nickname,
        position: 0, // FirebaseService에서 자동 할당
        ready: false,
        hand: []
      };

      const success = await FirebaseService.joinRoom(roomCode, player);
      
      if (success) {
        setGameInfo({
          roomCode,
          isHost: false,
          position: player.position
        });
        
        setAppState('game');
      } else {
        Alert.alert('오류', '방 참가에 실패했습니다. 방이 가득 찼거나 존재하지 않습니다.');
      }
      
    } catch (error) {
      console.error('방 참가 실패:', error);
      Alert.alert('오류', '방 참가에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    setUserInfo(null);
    setGameInfo(null);
    setAppState('menu');
  };

  const handleLeaveGame = () => {
    setGameInfo(null);
    setAppState('lobby');
  };

  const renderCurrentScreen = () => {
    switch (appState) {
      case 'menu':
        return (
          <MainMenuScreen
            onNicknameSet={handleNicknameSet}
          />
        );

      case 'lobby':
        return userInfo ? (
          <LobbyScreen
            nickname={userInfo.nickname}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onLogout={handleLogout}
          />
        ) : null;

      case 'game':
      case 'developer':
        return (userInfo && gameInfo) ? (
          <GameScreen
            roomCode={gameInfo.roomCode}
            userId={userInfo.id}
            nickname={userInfo.nickname}
            onLeaveGame={handleLeaveGame}
          />
        ) : null;

      default:
        return <MainMenuScreen onNicknameSet={handleNicknameSet} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      {renderCurrentScreen()}
    </SafeAreaProvider>
  );
};

export default App;
