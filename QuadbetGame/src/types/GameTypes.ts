// 게임 타입 정의

export interface Card {
  id: string;
  name: string;
  value: number;
  suit: 'jade' | 'sword' | 'pagoda' | 'star' | null;
  isSpecial: boolean;
  points: number;
  emoji?: string;
}

export interface Player {
  id: string;
  nickname: string;
  position: number; // 0: south, 1: west, 2: north, 3: east
  ready: boolean;
  isBot?: boolean;
  hand: Card[];
  bettingCall?: 'grand' | 'quad' | null;
  cardsPlayed?: boolean;
}

export interface Room {
  code: string;
  host: string;
  players: { [position: number]: Player };
  gameState: GameState | null;
  gameStarted: boolean;
  playerCount: number;
}

export interface GameState {
  currentPlayer: number;
  round: {
    active: boolean;
    number: number;
  };
  scores: [number, number]; // [team1, team2]
  hands: Card[][];
  currentCombination: {
    cards: Card[];
    type: string;
    player: number;
  } | null;
  consecutivePasses: number;
  finishedPlayers: number[];
  wonCards: Card[][];
  wish: number | null; // 소원 카드로 지정한 숫자
  turn: number;
  lastPlayer: number | null;
}

export type CombinationType = 
  | 'single'
  | 'pair' 
  | 'triple'
  | 'straight'
  | 'full_house'
  | 'consecutive_pairs'
  | 'bomb';

export interface BettingResult {
  playerId: string;
  type: 'grand' | 'quad';
  success: boolean;
  points: number;
}

export interface GameLogEntry {
  timestamp: number;
  message: string;
  type: 'normal' | 'action' | 'win';
}