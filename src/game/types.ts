export const Suit = {
  Hearts: 'Hearts',
  Diamonds: 'Diamonds',
  Clubs: 'Clubs',
  Spades: 'Spades',
} as const;
export type Suit = typeof Suit[keyof typeof Suit];

export const Rank = {
  Two: '2',
  Three: '3',
  Four: '4',
  Five: '5',
  Six: '6',
  Seven: '7',
  Eight: '8',
  Nine: '9',
  Ten: '10',
  Jack: 'J',
  Queen: 'Q',
  King: 'K',
  Ace: 'A',
} as const;
export type Rank = typeof Rank[keyof typeof Rank];

export const RANK_ORDER: Rank[] = [
  Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six,
  Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
  Rank.Jack, Rank.Queen, Rank.King, Rank.Ace,
];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.Hearts]: '♥',
  [Suit.Diamonds]: '♦',
  [Suit.Clubs]: '♣',
  [Suit.Spades]: '♠',
};

export const SUIT_COLORS: Record<Suit, string> = {
  [Suit.Hearts]: '#e74c3c',
  [Suit.Diamonds]: '#e74c3c',
  [Suit.Clubs]: '#2c3e50',
  [Suit.Spades]: '#2c3e50',
};

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // unique identifier for animations
}

export type GamePhase = 'lobby' | 'dealing' | 'bidding' | 'trumpSelection' | 'playing' | 'trickResult' | 'roundEnd' | 'gameOver';

export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  bid: number; // -1 = not yet bid
  tricksWon: number;
  score: number;
  isAI: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  connected: boolean;
}

export interface PlayedCard {
  card: Card;
  playerId: string;
  position: number; // order played in trick
}

export interface GameState {
  roomCode: string;
  hostId: string;
  phase: GamePhase;
  players: PlayerState[];
  currentRound: number;
  cardsPerPlayer: number;
  currentPlayerIndex: number;
  trumpSuit: Suit | null;
  leadingSuit: Suit | null;
  playedCards: PlayedCard[];
  highestBidderId: string | null;
  roundStarterIndex: number; // who starts bidding this round
  trickWinnerId: string | null;
  trickNumber: number; // current trick in round (0-based)
}

export interface RoomData {
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Record<string, {
    name: string;
    isReady: boolean;
    isAI: boolean;
    aiDifficulty?: 'easy' | 'medium' | 'hard';
  }>;
  maxPlayers: number;
  createdAt: number;
}
