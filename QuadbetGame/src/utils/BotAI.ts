import { Card, GameState, CombinationType } from '../types/GameTypes';
import { getCombinationType, containsWishCard } from './CardUtils';
import { isValidPlay as gameIsValidPlay } from './GameLogic';

// 봇 AI 클래스
export class BotAI {
  // 봇의 카드 플레이 결정
  static findBestPlay(
    hand: Card[], 
    currentCombination: GameState['currentCombination'],
    wish: number | null
  ): Card[] | null {
    if (!hand.length) return null;

    // 소원 카드가 있다면 우선적으로 플레이
    if (wish && this.hasWishCard(hand, wish)) {
      const wishCards = this.findWishCards(hand, wish);
      if (wishCards.length > 0) {
        return [wishCards[0]]; // 소원 카드 하나만 내기
      }
    }

    // 현재 조합이 없으면 (첫 플레이) 가장 좋은 조합 선택
    if (!currentCombination) {
      return this.findBestFirstPlay(hand);
    }

    // 기존 조합에 대응할 수 있는 카드 찾기
    return this.findCounterPlay(hand, currentCombination);
  }

  // 첫 번째 플레이 시 최적의 조합 찾기
  private static findBestFirstPlay(hand: Card[]): Card[] {
    // 우선순위: 트리플 > 페어 > 싱글 (높은 카드부터)
    
    // 트리플 찾기
    const triples = this.findTriples(hand);
    if (triples.length > 0) {
      return triples[0]; // 가장 낮은 트리플
    }

    // 페어 찾기
    const pairs = this.findPairs(hand);
    if (pairs.length > 0) {
      return pairs[0]; // 가장 낮은 페어
    }

    // 싱글 (가장 낮은 카드)
    const sortedHand = [...hand].sort((a, b) => a.value - b.value);
    return [sortedHand[0]];
  }

  // 대응 플레이 찾기
  private static findCounterPlay(
    hand: Card[], 
    currentCombination: GameState['currentCombination']
  ): Card[] | null {
    if (!currentCombination) return null;

    const targetType = currentCombination.type as CombinationType;
    const targetCards = currentCombination.cards;

    switch (targetType) {
      case 'single':
        return this.findStrongerSingle(hand, targetCards[0]);
      
      case 'pair':
        return this.findStrongerPair(hand, targetCards);
      
      case 'triple':
        return this.findStrongerTriple(hand, targetCards);
      
      case 'straight':
        return this.findStrongerStraight(hand, targetCards);
        
      case 'bomb':
        return this.findStrongerBomb(hand, targetCards);
      
      default:
        return null;
    }
  }

  // 더 강한 싱글 카드 찾기
  private static findStrongerSingle(hand: Card[], targetCard: Card): Card[] | null {
    const strongerCards = hand.filter(card => 
      card.value > targetCard.value && 
      gameIsValidPlay([card], { cards: [targetCard], type: 'single', player: 0 }, hand.length)
    );
    
    if (strongerCards.length === 0) return null;
    
    // 가장 약한 카드 중 타겟보다 강한 것 선택
    strongerCards.sort((a, b) => a.value - b.value);
    return [strongerCards[0]];
  }

  // 더 강한 페어 찾기
  private static findStrongerPair(hand: Card[], targetCards: Card[]): Card[] | null {
    const pairs = this.findPairs(hand);
    const targetValue = targetCards[0].value;
    
    const strongerPairs = pairs.filter(pair => pair[0].value > targetValue);
    if (strongerPairs.length === 0) return null;
    
    // 가장 약한 페어 선택
    strongerPairs.sort((a, b) => a[0].value - b[0].value);
    return strongerPairs[0];
  }

  // 더 강한 트리플 찾기
  private static findStrongerTriple(hand: Card[], targetCards: Card[]): Card[] | null {
    const triples = this.findTriples(hand);
    const targetValue = targetCards[0].value;
    
    const strongerTriples = triples.filter(triple => triple[0].value > targetValue);
    if (strongerTriples.length === 0) return null;
    
    strongerTriples.sort((a, b) => a[0].value - b[0].value);
    return strongerTriples[0];
  }

  // 더 강한 스트레이트 찾기
  private static findStrongerStraight(hand: Card[], targetCards: Card[]): Card[] | null {
    // 간단한 구현 - 실제로는 더 복잡한 스트레이트 로직 필요
    return null;
  }

  // 더 강한 폭탄 찾기
  private static findStrongerBomb(hand: Card[], targetCards: Card[]): Card[] | null {
    const bombs = this.findBombs(hand);
    if (bombs.length === 0) return null;
    
    // 타겟 폭탄보다 강한 폭탄 찾기
    const targetValue = targetCards[0]?.value || 0;
    const strongerBombs = bombs.filter(bomb => {
      if (bomb.length === 4 && targetCards.length === 4) {
        return bomb[0].value > targetValue;
      }
      if (bomb.length >= 5 && targetCards.length >= 5) {
        const maxBombValue = Math.max(...bomb.map(c => c.value));
        const maxTargetValue = Math.max(...targetCards.map(c => c.value));
        return maxBombValue > maxTargetValue;
      }
      // 스트레이트 플러시가 4장 폭탄보다 강함
      return bomb.length > targetCards.length;
    });
    
    if (strongerBombs.length === 0) return null;
    return strongerBombs[0];
  }

  // 헬퍼 메서드들
  private static findPairs(hand: Card[]): Card[][] {
    const valueCounts = this.getValueCounts(hand);
    const pairs: Card[][] = [];
    
    Object.entries(valueCounts).forEach(([value, cards]) => {
      if (cards.length >= 2) {
        pairs.push(cards.slice(0, 2));
      }
    });
    
    return pairs.sort((a, b) => a[0].value - b[0].value);
  }

  private static findTriples(hand: Card[]): Card[][] {
    const valueCounts = this.getValueCounts(hand);
    const triples: Card[][] = [];
    
    Object.entries(valueCounts).forEach(([value, cards]) => {
      if (cards.length >= 3) {
        triples.push(cards.slice(0, 3));
      }
    });
    
    return triples.sort((a, b) => a[0].value - b[0].value);
  }

  private static findBombs(hand: Card[]): Card[][] {
    const bombs: Card[][] = [];
    
    // 4장 동일 숫자 폭탄
    const valueCounts = this.getValueCounts(hand);
    Object.entries(valueCounts).forEach(([value, cards]) => {
      if (cards.length === 4) {
        bombs.push(cards);
      }
    });
    
    // TODO: 스트레이트 플러시 폭탄 구현
    
    return bombs;
  }

  private static getValueCounts(hand: Card[]): { [value: number]: Card[] } {
    const counts: { [value: number]: Card[] } = {};
    
    hand.forEach(card => {
      if (!counts[card.value]) {
        counts[card.value] = [];
      }
      counts[card.value].push(card);
    });
    
    return counts;
  }

  private static hasWishCard(hand: Card[], wish: number): boolean {
    return hand.some(card => card.value === wish);
  }

  private static findWishCards(hand: Card[], wish: number): Card[] {
    return hand.filter(card => card.value === wish);
  }

  // 소원 선택 (봇용)
  static selectWish(hand: Card[]): number {
    const valueCounts = this.getValueCounts(hand);
    
    // 가장 많이 가진 카드 중 하나 선택 (2-14 범위)
    let maxCount = 0;
    let selectedValue = 2;
    
    Object.entries(valueCounts).forEach(([value, cards]) => {
      const numValue = parseInt(value);
      if (numValue >= 2 && numValue <= 14 && cards.length > maxCount) {
        maxCount = cards.length;
        selectedValue = numValue;
      }
    });
    
    return selectedValue;
  }

  // 패스할지 결정
  static shouldPass(
    hand: Card[],
    currentCombination: GameState['currentCombination'],
    wish: number | null
  ): boolean {
    const possiblePlay = this.findBestPlay(hand, currentCombination, wish);
    return possiblePlay === null;
  }
}