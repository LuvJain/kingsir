export enum Suit {
  Hearts = 'Hearts',
  Diamonds = 'Diamonds',
  Clubs = 'Clubs',
  Spades = 'Spades',
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  declaredSirs: number;
  wonSirs: number;
  score: number;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  currentRound: number;
  cardsPerPlayer: number;
  trumpSuit: Suit | null;
  currentTrick: Card[];
  leadingSuit: Suit | null;
  currentPlayerIndex: number;
  gamePhase: 'dealing' | 'declaring' | 'selectingTrump' | 'playing' | 'scoring' | 'gameOver';
}

