import { Card, CombinationType } from '../types/GameTypes';
import { SPECIAL_CARDS, LEGACY_CARD_MAPPING } from '../constants/SpecialCards';

// 카드 덱 생성 (특수 카드 정리 후)
export const createDeck = (): Card[] => {
  const suits = ['jade', 'sword', 'pagoda', 'star'] as const;
  const deck: Card[] = [];

  // 일반 카드 생성 (2-14, A=14)
  suits.forEach(suit => {
    for (let value = 2; value <= 14; value++) {
      const points = value === 5 ? 5 : (value === 10 || value === 13) ? 10 : 0;
      deck.push({
        id: `${suit}_${value}`,
        name: value === 11 ? 'J' : value === 12 ? 'Q' : value === 13 ? 'K' : value === 14 ? 'A' : value.toString(),
        value,
        suit,
        isSpecial: false,
        points
      });
    }
  });

  // 특수 카드 추가 (정리된 4개만)
  deck.push(
    {
      id: 'special_one',
      name: SPECIAL_CARDS.ONE.name,
      value: SPECIAL_CARDS.ONE.value,
      suit: null,
      isSpecial: true,
      points: SPECIAL_CARDS.ONE.points,
      emoji: SPECIAL_CARDS.ONE.emoji
    },
    {
      id: 'special_dog',
      name: SPECIAL_CARDS.DOG.name,
      value: 0,
      suit: null,
      isSpecial: true,
      points: SPECIAL_CARDS.DOG.points,
      emoji: SPECIAL_CARDS.DOG.emoji
    },
    {
      id: 'special_phoenix',
      name: SPECIAL_CARDS.PHOENIX.name,
      value: 0,
      suit: null,
      isSpecial: true,
      points: SPECIAL_CARDS.PHOENIX.points,
      emoji: SPECIAL_CARDS.PHOENIX.emoji
    },
    {
      id: 'special_dragon',
      name: SPECIAL_CARDS.DRAGON.name,
      value: SPECIAL_CARDS.DRAGON.value,
      suit: null,
      isSpecial: true,
      points: SPECIAL_CARDS.DRAGON.points,
      emoji: SPECIAL_CARDS.DRAGON.emoji
    }
  );

  return deck;
};

// 덱 섞기
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 카드 조합 유형 판별
export const getCombinationType = (cards: Card[]): CombinationType | null => {
  if (!cards.length) return null;

  if (cards.length === 1) return 'single';
  if (cards.length === 2) {
    const [c1, c2] = cards;
    return c1.value === c2.value ? 'pair' : null;
  }
  if (cards.length === 3) {
    const values = cards.map(c => c.value);
    return values.every(v => v === values[0]) ? 'triple' : null;
  }

  // 폭탄 체크 (4장 동일 숫자 또는 5장 이상 같은 무늬 연속)
  if (isBomb(cards)) return 'bomb';

  // 스트레이트 체크 (5장 이상)
  if (cards.length >= 5 && isStraight(cards)) return 'straight';

  // 풀하우스 체크 (5장: 3장 + 2장)
  if (cards.length === 5 && isFullHouse(cards)) return 'full_house';

  // 연속 페어 체크
  if (cards.length % 2 === 0 && cards.length >= 4 && isConsecutivePairs(cards)) {
    return 'consecutive_pairs';
  }

  return null;
};

// 폭탄인지 확인
export const isBomb = (cards: Card[]): boolean => {
  // 4장 동일 숫자
  if (cards.length === 4) {
    const values = cards.map(c => c.value);
    return values.every(v => v === values[0]);
  }
  
  // 5장 이상 같은 무늬 연속
  if (cards.length >= 5) {
    const suits = cards.map(c => c.suit);
    if (suits.every(s => s === suits[0] && s !== null)) {
      return isStraight(cards);
    }
  }
  
  return false;
};

// 스트레이트인지 확인
const isStraight = (cards: Card[]): boolean => {
  const values = cards.map(c => c.value).sort((a, b) => a - b);
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) return false;
  }
  return true;
};

// 풀하우스인지 확인
const isFullHouse = (cards: Card[]): boolean => {
  if (cards.length !== 5) return false;
  
  const valueCounts: { [key: number]: number } = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });
  
  const counts = Object.values(valueCounts).sort();
  return counts.length === 2 && counts[0] === 2 && counts[1] === 3;
};

// 연속 페어인지 확인
const isConsecutivePairs = (cards: Card[]): boolean => {
  if (cards.length % 2 !== 0) return false;
  
  const valueCounts: { [key: number]: number } = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });
  
  const values = Object.keys(valueCounts).map(Number).sort((a, b) => a - b);
  
  // 모든 값이 정확히 2개씩 있어야 함
  if (!Object.values(valueCounts).every(count => count === 2)) return false;
  
  // 연속되어야 함
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) return false;
  }
  
  return true;
};

// 소원 카드(1) 포함 여부 확인
export const containsWishCard = (cards: Card[]): boolean => {
  return cards.some(card => 
    card.isSpecial && (card.name === 'One' || card.name === '마작' || card.name === 'Mah Jong')
  );
};

// 카드 강도 비교 (같은 조합 타입일 때)
export const compareCardCombinations = (
  cards1: Card[], 
  cards2: Card[], 
  type: CombinationType
): number => {
  // 폭탄은 항상 다른 조합보다 강함
  if (type === 'bomb') {
    if (cards1.length === 4 && cards2.length === 4) {
      // 둘 다 4장 폭탄인 경우 숫자 비교
      return cards1[0].value - cards2[0].value;
    }
    if (cards1.length >= 5 && cards2.length >= 5) {
      // 둘 다 스트레이트 플러시인 경우 높은 카드 비교
      const max1 = Math.max(...cards1.map(c => c.value));
      const max2 = Math.max(...cards2.map(c => c.value));
      return max1 - max2;
    }
    // 스트레이트 플러시가 4장 폭탄보다 강함
    return cards1.length > cards2.length ? 1 : -1;
  }
  
  // 일반 조합의 경우 가장 높은 카드로 비교
  const max1 = Math.max(...cards1.map(c => c.value));
  const max2 = Math.max(...cards2.map(c => c.value));
  return max1 - max2;
};

// 레거시 카드명 변환
export const normalizeCardName = (cardName: string): string => {
  return LEGACY_CARD_MAPPING[cardName as keyof typeof LEGACY_CARD_MAPPING] || cardName;
};