import { Card, GameState, CombinationType } from '../types/GameTypes';
import { createDeck, shuffleDeck, getCombinationType, containsWishCard, compareCardCombinations } from './CardUtils';
import { SPECIAL_CARDS } from '../constants/SpecialCards';

// 게임 상태 초기화
export const initializeGameState = (): GameState => {
  const deck = shuffleDeck(createDeck());
  const hands: Card[][] = [[], [], [], []];
  
  // 카드 분배 (각 플레이어당 14장)
  for (let i = 0; i < 56; i++) {
    const playerIndex = i % 4;
    hands[playerIndex].push(deck[i]);
  }

  // 소원 카드(1)를 가진 플레이어 찾기
  let currentPlayer = 0;
  for (let i = 0; i < 4; i++) {
    if (hands[i].some(card => 
      card.isSpecial && (card.name === 'One' || card.name === '마작' || card.name === 'Mah Jong')
    )) {
      currentPlayer = i;
      break;
    }
  }

  return {
    currentPlayer,
    round: {
      active: true,
      number: 1
    },
    scores: [0, 0],
    hands,
    currentCombination: null,
    consecutivePasses: 0,
    finishedPlayers: [],
    wonCards: [[], [], [], []],
    wish: null,
    turn: 1,
    lastPlayer: null
  };
};

// 카드 조합 유효성 검사
export const isValidPlay = (
  cards: Card[], 
  currentCombination: GameState['currentCombination'], 
  playerHandSize: number
): boolean => {
  if (!cards.length) return false;

  const combinationType = getCombinationType(cards);
  if (!combinationType) return false;

  // 첫 번째 플레이인 경우
  if (!currentCombination) {
    return true;
  }

  // 같은 조합 타입이어야 함 (폭탄 제외)
  if (combinationType !== 'bomb' && combinationType !== currentCombination.type) {
    return false;
  }

  // 폭탄은 항상 낼 수 있음
  if (combinationType === 'bomb') {
    if (currentCombination.type !== 'bomb') {
      return true;
    }
    // 둘 다 폭탄인 경우 더 강한 폭탄이어야 함
    return compareCardCombinations(cards, currentCombination.cards, 'bomb') > 0;
  }

  // 마지막 카드인 경우 >= 비교 허용
  const comparison = compareCardCombinations(cards, currentCombination.cards, combinationType);
  return playerHandSize === 1 ? comparison >= 0 : comparison > 0;
};

// 베팅 시스템
export const processBetting = (
  playerId: string,
  type: 'grand' | 'quad',
  success: boolean
): number => {
  const points = type === 'grand' ? 200 : 100;
  return success ? points : -points;
};

// 팀 점수 계산
export const calculateTeamScores = (
  wonCards: Card[][],
  finishedOrder: number[],
  bettingResults: { [playerId: string]: { type: 'grand' | 'quad', success: boolean } }
): [number, number] => {
  const teamScores: [number, number] = [0, 0];

  // 원투 피니시 체크 (같은 팀이 1-2등)
  if (finishedOrder.length >= 2) {
    const firstTeam = finishedOrder[0] % 2;
    const secondTeam = finishedOrder[1] % 2;
    
    if (firstTeam === secondTeam) {
      // 같은 팀이 1-2등 = 200점
      teamScores[firstTeam] = 200;
      return teamScores;
    }
  }

  // 일반 점수 계산
  for (let i = 0; i < 4; i++) {
    const teamIndex = i % 2; // 0,2 = team 0, 1,3 = team 1
    const cards = wonCards[i] || [];
    
    let playerScore = 0;
    cards.forEach(card => {
      playerScore += card.points || 0;
    });
    
    teamScores[teamIndex] += playerScore;
  }

  // 베팅 결과 추가
  Object.values(bettingResults).forEach(result => {
    const points = processBetting('', result.type, result.success);
    // 베팅한 플레이어의 팀에 점수 추가 (실제 구현에서는 플레이어 ID로 팀 결정)
    // 여기서는 간단히 팀 0에 추가
    teamScores[0] += points;
  });

  return teamScores;
};

// 소원 시스템
export const handleWishCard = (cards: Card[]): number | null => {
  if (containsWishCard(cards)) {
    // UI에서 소원 선택 (2-14)
    return null; // UI 처리 필요
  }
  return null;
};

// 강아지 카드 처리 (파트너에게 턴 전달)
export const handleDogCard = (currentPlayer: number, finishedPlayers: number[]): number => {
  const partner = (currentPlayer + 2) % 4;
  
  // 파트너가 이미 끝났으면 시계방향으로 다음 플레이어
  if (finishedPlayers.includes(partner)) {
    let nextPlayer = (currentPlayer + 1) % 4;
    let attempts = 0;
    
    while (finishedPlayers.includes(nextPlayer) && attempts < 4) {
      nextPlayer = (nextPlayer + 1) % 4;
      attempts++;
    }
    
    return nextPlayer;
  }
  
  return partner;
};

// 용 카드 처리 (상대팀에게 카드 전달)
export const handleDragonCard = (currentPlayer: number): number[] => {
  const opponents = [];
  
  // 상대팀 플레이어들 (현재 플레이어의 팀이 아닌)
  for (let i = 0; i < 4; i++) {
    if (i % 2 !== currentPlayer % 2) {
      opponents.push(i);
    }
  }
  
  return opponents;
};

// 다음 턴 계산
export const getNextPlayer = (
  currentPlayer: number, 
  finishedPlayers: number[]
): number => {
  let nextPlayer = (currentPlayer + 1) % 4;
  let attempts = 0;
  
  while (finishedPlayers.includes(nextPlayer) && attempts < 4) {
    nextPlayer = (nextPlayer + 1) % 4;
    attempts++;
  }
  
  return nextPlayer;
};

// 라운드 종료 체크
export const checkRoundEnd = (
  finishedPlayers: number[]
): boolean => {
  // 한 팀이 모두 완료했는지 체크
  const team1Finished = finishedPlayers.includes(0) && finishedPlayers.includes(2);
  const team2Finished = finishedPlayers.includes(1) && finishedPlayers.includes(3);
  
  return team1Finished || team2Finished || finishedPlayers.length >= 3;
};

// 게임 종료 체크 (1000점 달성)
export const checkGameEnd = (scores: [number, number]): boolean => {
  return scores[0] >= 1000 || scores[1] >= 1000;
};