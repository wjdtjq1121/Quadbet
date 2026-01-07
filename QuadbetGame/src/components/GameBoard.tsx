import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { Card as CardType, GameState, Player } from '../types/GameTypes';

interface GameBoardProps {
  gameState: GameState;
  players: { [position: number]: Player };
  currentUserId: string;
  selectedCards: CardType[];
  onCardSelect: (card: CardType) => void;
  onPlayCards: () => void;
  onPass: () => void;
  onBetting: (type: 'grand' | 'quad') => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  players,
  currentUserId,
  selectedCards,
  onCardSelect,
  onPlayCards,
  onPass,
  onBetting
}) => {
  const currentUserPosition = Object.keys(players).find(
    pos => players[parseInt(pos)]?.id === currentUserId
  );
  const currentUserPosNum = currentUserPosition ? parseInt(currentUserPosition) : 0;

  const getPlayerName = (position: number): string => {
    const player = players[position];
    return player?.nickname || `플레이어 ${position}`;
  };

  const getPositionEmoji = (position: number): string => {
    const emojis = ['🧭', '🌅', '⭐', '🌄']; // 남, 서, 북, 동
    return emojis[position] || '';
  };

  const isCurrentTurn = (position: number): boolean => {
    return gameState.currentPlayer === position;
  };

  const isCurrentUser = (position: number): boolean => {
    return position === currentUserPosNum;
  };

  const renderPlayerArea = (position: number) => {
    const player = players[position];
    if (!player) return null;

    const handSize = gameState.hands[position]?.length || 0;
    const isActive = isCurrentTurn(position);
    const isUser = isCurrentUser(position);

    return (
      <View key={position} style={[
        styles.playerArea,
        isActive && styles.activePlayer,
        isUser && styles.currentUser
      ]}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>
            {getPositionEmoji(position)} {getPlayerName(position)}
          </Text>
          {player.bettingCall && (
            <Text style={[
              styles.bettingBadge,
              player.bettingCall === 'grand' && styles.grandBetting
            ]}>
              {player.bettingCall === 'grand' ? 'GB' : 'QB'}
            </Text>
          )}
          <Text style={styles.cardCount}>{handSize}장</Text>
        </View>

        {/* 플레이어 핸드 (본인만 보임) */}
        {isUser && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.handContainer}>
            <View style={styles.hand}>
              {gameState.hands[position]?.map((card, index) => (
                <Card
                  key={`${card.id}-${index}`}
                  card={card}
                  isSelected={selectedCards.some(sc => sc.id === card.id)}
                  onPress={() => onCardSelect(card)}
                  size="medium"
                />
              ))}
            </View>
          </ScrollView>
        )}

        {/* 다른 플레이어 핸드 (뒷면) */}
        {!isUser && handSize > 0 && (
          <View style={styles.hand}>
            {Array.from({ length: Math.min(handSize, 10) }, (_, i) => (
              <View key={i} style={styles.cardBack}>
                <Text style={styles.cardBackText}>🎴</Text>
              </View>
            ))}
            {handSize > 10 && (
              <Text style={styles.moreCards}>+{handSize - 10}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderCenterArea = () => {
    return (
      <View style={styles.centerArea}>
        <Text style={styles.playInfo}>
          {gameState.currentCombination ? 
            `${getPlayerName(gameState.currentCombination.player)}의 ${gameState.currentCombination.type}` : 
            '새로운 트릭'
          }
        </Text>

        {/* 현재 플레이된 카드들 */}
        {gameState.currentCombination && (
          <View style={styles.playedCards}>
            {gameState.currentCombination.cards.map((card, index) => (
              <Card
                key={`played-${card.id}-${index}`}
                card={card}
                size="small"
                disabled
              />
            ))}
          </View>
        )}

        {/* 소원 정보 */}
        {gameState.wish && (
          <Text style={styles.wishInfo}>
            ✨ 소원: {gameState.wish === 11 ? 'J' : 
                    gameState.wish === 12 ? 'Q' : 
                    gameState.wish === 13 ? 'K' : 
                    gameState.wish === 14 ? 'A' : 
                    gameState.wish}
          </Text>
        )}

        {/* 완료된 플레이어들 */}
        {gameState.finishedPlayers.length > 0 && (
          <View style={styles.finishedPlayers}>
            <Text style={styles.finishedTitle}>완료 순서:</Text>
            {gameState.finishedPlayers.map((playerPos, index) => (
              <Text key={playerPos} style={styles.finishedPlayer}>
                {index + 1}등: {getPlayerName(playerPos)}
              </Text>
            ))}
          </View>
        )}

        {/* 패스 카운터 */}
        {gameState.consecutivePasses > 0 && (
          <Text style={styles.passCounter}>
            연속 패스: {gameState.consecutivePasses}/3
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 상단 플레이어 (북) */}
      {renderPlayerArea(2)}

      <View style={styles.middleRow}>
        {/* 왼쪽 플레이어 (서) */}
        {renderPlayerArea(1)}

        {/* 중앙 게임 영역 */}
        {renderCenterArea()}

        {/* 오른쪽 플레이어 (동) */}
        {renderPlayerArea(3)}
      </View>

      {/* 하단 플레이어 (남 - 현재 사용자) */}
      {renderPlayerArea(0)}

      {/* 게임 액션 버튼 */}
      <View style={styles.actionButtons}>
        {isCurrentTurn(currentUserPosNum) && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.playButton]}
              onPress={onPlayCards}
              disabled={selectedCards.length === 0}
            >
              <Text style={styles.buttonText}>카드 내기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.passButton]}
              onPress={onPass}
            >
              <Text style={styles.buttonText}>패스</Text>
            </TouchableOpacity>
          </>
        )}

        {/* 베팅 버튼 (조건부) */}
        {!players[currentUserPosNum]?.cardsPlayed && !players[currentUserPosNum]?.bettingCall && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.bettingButton]}
              onPress={() => onBetting('grand')}
            >
              <Text style={styles.buttonText}>그랜드 베팅</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.bettingButton]}
              onPress={() => onBetting('quad')}
            >
              <Text style={styles.buttonText}>쿼드 베팅</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    padding: 10,
  },
  playerArea: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    margin: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activePlayer: {
    borderColor: '#667eea',
    backgroundColor: '#e3f2fd',
  },
  currentUser: {
    backgroundColor: '#e8f8f0',
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  bettingBadge: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    marginHorizontal: 5,
  },
  grandBetting: {
    backgroundColor: '#ffd700',
    color: '#333',
  },
  cardCount: {
    backgroundColor: '#667eea',
    color: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
  },
  handContainer: {
    maxHeight: 90,
  },
  hand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  cardBack: {
    width: 45,
    height: 65,
    backgroundColor: '#34495e',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  cardBackText: {
    fontSize: 20,
    color: 'white',
  },
  moreCards: {
    marginLeft: 10,
    fontSize: 12,
    color: '#666',
  },
  middleRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  centerArea: {
    flex: 1,
    backgroundColor: '#34495e',
    borderRadius: 12,
    padding: 20,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  playInfo: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  playedCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  wishInfo: {
    color: '#3498db',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  finishedPlayers: {
    marginTop: 15,
    alignItems: 'center',
  },
  finishedTitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  finishedPlayer: {
    color: '#27ae60',
    fontSize: 12,
    marginVertical: 2,
  },
  passCounter: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#667eea',
  },
  passButton: {
    backgroundColor: '#95a5a6',
  },
  bettingButton: {
    backgroundColor: '#f39c12',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});