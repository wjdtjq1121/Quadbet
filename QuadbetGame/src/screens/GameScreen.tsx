import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { GameBoard } from '../components/GameBoard';
import { useRoom } from '../hooks/useFirebase';
import { Card, GameState, Player } from '../types/GameTypes';
import { initializeGameState, isValidPlay, getNextPlayer, checkRoundEnd } from '../utils/GameLogic';
import { getCombinationType, containsWishCard } from '../utils/CardUtils';
import { BotAI } from '../utils/BotAI';

interface GameScreenProps {
  roomCode: string;
  userId: string;
  nickname: string;
  onLeaveGame: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  roomCode,
  userId,
  nickname,
  onLeaveGame
}) => {
  const { room, updateGameState, leaveRoom } = useRoom(roomCode);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [localGameState, setLocalGameState] = useState<GameState | null>(null);

  // 현재 사용자 포지션 찾기
  const currentUserPosition = Object.keys(room?.players || {}).find(
    pos => room?.players[parseInt(pos)]?.id === userId
  );
  const currentUserPosNum = currentUserPosition ? parseInt(currentUserPosition) : 0;

  useEffect(() => {
    if (room?.gameState) {
      setLocalGameState(room.gameState);
    }
  }, [room?.gameState]);

  // 봇 자동 플레이 처리
  useEffect(() => {
    if (!localGameState || !room) return;

    const currentPlayer = localGameState.currentPlayer;
    const player = room.players[currentPlayer];
    
    // 봇 플레이어이고 현재 턴이면 자동 플레이
    if (player?.isBot) {
      const timer = setTimeout(() => {
        handleBotPlay(currentPlayer);
      }, 1500); // 1.5초 딜레이

      return () => clearTimeout(timer);
    }
  }, [localGameState?.currentPlayer, localGameState?.turn]);

  const handleBotPlay = useCallback(async (botPosition: number) => {
    if (!localGameState || !room) return;

    const botHand = localGameState.hands[botPosition];
    if (!botHand || botHand.length === 0) return;

    // 봇 AI로 최적의 플레이 결정
    const bestPlay = BotAI.findBestPlay(
      botHand,
      localGameState.currentCombination,
      localGameState.wish
    );

    if (bestPlay) {
      // 봇이 카드 내기
      await playCardsForBot(botPosition, bestPlay);
    } else {
      // 봇이 패스
      await passTurnForBot(botPosition);
    }
  }, [localGameState, room]);

  const playCardsForBot = async (botPosition: number, cards: Card[]) => {
    if (!localGameState) return;

    const combinationType = getCombinationType(cards);
    if (!combinationType) return;

    // 게임 상태 업데이트
    const newHands = [...localGameState.hands];
    newHands[botPosition] = newHands[botPosition].filter(
      card => !cards.some(selectedCard => selectedCard.id === card.id)
    );

    // 소원 처리
    let newWish = localGameState.wish;
    if (containsWishCard(cards)) {
      newWish = BotAI.selectWish(newHands[botPosition]);
    }

    const updatedGameState: GameState = {
      ...localGameState,
      hands: newHands,
      currentCombination: {
        cards,
        type: combinationType,
        player: botPosition
      },
      consecutivePasses: 0,
      wish: newWish,
      currentPlayer: getNextPlayer(botPosition, localGameState.finishedPlayers),
      turn: localGameState.turn + 1
    };

    // 플레이어가 손패를 모두 낸 경우
    if (newHands[botPosition].length === 0) {
      updatedGameState.finishedPlayers = [...localGameState.finishedPlayers, botPosition];
    }

    await updateGameState(updatedGameState);
  };

  const passTurnForBot = async (botPosition: number) => {
    if (!localGameState) return;

    const newConsecutivePasses = localGameState.consecutivePasses + 1;

    let updatedGameState: GameState = {
      ...localGameState,
      consecutivePasses: newConsecutivePasses,
      currentPlayer: getNextPlayer(botPosition, localGameState.finishedPlayers),
      turn: localGameState.turn + 1
    };

    // 3명이 연속으로 패스하면 테이블 클리어
    if (newConsecutivePasses >= 3) {
      updatedGameState.currentCombination = null;
      updatedGameState.consecutivePasses = 0;
      updatedGameState.wish = null;
    }

    await updateGameState(updatedGameState);
  };

  const handleCardSelect = (card: Card) => {
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id);
      if (isSelected) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  };

  const handlePlayCards = async () => {
    if (!localGameState || !room || selectedCards.length === 0) return;

    // 유효한 플레이인지 확인
    const playerHand = localGameState.hands[currentUserPosNum];
    if (!isValidPlay(selectedCards, localGameState.currentCombination, playerHand.length)) {
      Alert.alert('오류', '유효하지 않은 카드 조합입니다.');
      return;
    }

    const combinationType = getCombinationType(selectedCards);
    if (!combinationType) {
      Alert.alert('오류', '올바른 카드 조합이 아닙니다.');
      return;
    }

    // 게임 상태 업데이트
    const newHands = [...localGameState.hands];
    newHands[currentUserPosNum] = newHands[currentUserPosNum].filter(
      card => !selectedCards.some(selectedCard => selectedCard.id === card.id)
    );

    // 소원 처리
    let newWish = localGameState.wish;
    if (containsWishCard(selectedCards)) {
      // TODO: 소원 선택 모달 구현
      newWish = 7; // 임시로 7 설정
    }

    const updatedGameState: GameState = {
      ...localGameState,
      hands: newHands,
      currentCombination: {
        cards: selectedCards,
        type: combinationType,
        player: currentUserPosNum
      },
      consecutivePasses: 0,
      wish: newWish,
      currentPlayer: getNextPlayer(currentUserPosNum, localGameState.finishedPlayers),
      turn: localGameState.turn + 1
    };

    // 플레이어가 손패를 모두 낸 경우
    if (newHands[currentUserPosNum].length === 0) {
      updatedGameState.finishedPlayers = [...localGameState.finishedPlayers, currentUserPosNum];
    }

    setSelectedCards([]);
    await updateGameState(updatedGameState);

    // 라운드 종료 체크
    if (checkRoundEnd(updatedGameState.finishedPlayers)) {
      // TODO: 라운드 종료 처리
      Alert.alert('라운드 종료', '라운드가 끝났습니다!');
    }
  };

  const handlePass = async () => {
    if (!localGameState) return;

    const newConsecutivePasses = localGameState.consecutivePasses + 1;

    let updatedGameState: GameState = {
      ...localGameState,
      consecutivePasses: newConsecutivePasses,
      currentPlayer: getNextPlayer(currentUserPosNum, localGameState.finishedPlayers),
      turn: localGameState.turn + 1
    };

    // 3명이 연속으로 패스하면 테이블 클리어
    if (newConsecutivePasses >= 3) {
      updatedGameState.currentCombination = null;
      updatedGameState.consecutivePasses = 0;
      updatedGameState.wish = null;
    }

    await updateGameState(updatedGameState);
  };

  const handleBetting = async (type: 'grand' | 'quad') => {
    if (!room) return;

    Alert.alert(
      `${type === 'grand' ? '그랜드' : '쿼드'} 베팅`,
      `${type === 'grand' ? '그랜드 베팅 (±200점)' : '쿼드 베팅 (±100점)'}을 선언하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '선언', 
          onPress: () => {
            // TODO: 베팅 처리 구현
            Alert.alert('베팅 선언', `${type === 'grand' ? '그랜드' : '쿼드'} 베팅을 선언했습니다!`);
          }
        }
      ]
    );
  };

  const handleLeaveGame = () => {
    Alert.alert(
      '게임 나가기',
      '정말로 게임을 나가시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '나가기', 
          style: 'destructive',
          onPress: async () => {
            await leaveRoom(currentUserPosNum);
            onLeaveGame();
          }
        }
      ]
    );
  };

  if (!room || !localGameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>게임 로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎴 티추 게임</Text>
        <View style={styles.scoreBoard}>
          <View style={styles.teamScore}>
            <Text style={styles.teamLabel}>팀 1 (남-북)</Text>
            <Text style={styles.score}>{localGameState.scores[0]}</Text>
          </View>
          <View style={styles.teamScore}>
            <Text style={styles.teamLabel}>팀 2 (동-서)</Text>
            <Text style={styles.score}>{localGameState.scores[1]}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.leaveButton}
          onPress={handleLeaveGame}
        >
          <Text style={styles.leaveButtonText}>나가기</Text>
        </TouchableOpacity>
      </View>

      <GameBoard
        gameState={localGameState}
        players={room.players}
        currentUserId={userId}
        selectedCards={selectedCards}
        onCardSelect={handleCardSelect}
        onPlayCards={handlePlayCards}
        onPass={handlePass}
        onBetting={handleBetting}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
  header: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreBoard: {
    flexDirection: 'row',
    gap: 20,
  },
  teamScore: {
    alignItems: 'center',
  },
  teamLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  score: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  leaveButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});