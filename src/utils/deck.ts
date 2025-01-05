import { Card, Suit, Rank } from '../types';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  Object.values(Suit).forEach(suit => {
    Object.values(Rank).forEach(rank => {
      deck.push({ suit, rank });
    });
  });
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], numPlayers: number, cardsPerPlayer: number): Card[][] {
  const hands: Card[][] = Array(numPlayers).fill(null).map(() => []);
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let j = 0; j < numPlayers; j++) {
      if (deck.length > 0) {
        hands[j].push(deck.pop()!);
      }
    }
  }
  return hands;
}

