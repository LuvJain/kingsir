import { Card } from './Card';

export class Player {
  hand: Card[];
  declaredSirs: number;
  wonSirs: number;
  score: number;

  constructor(public name: string) {
    this.hand = [];
    this.declaredSirs = 0;
    this.wonSirs = 0;
    this.score = 0;
  }

  addToHand(cards: Card[]): void {
    this.hand.push(...cards);
  }

  playCard(card: Card): Card {
    const index = this.hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
    if (index !== -1) {
      return this.hand.splice(index, 1)[0];
    }
    throw new Error('Card not in hand');
  }

  hasCard(suit: string): boolean {
    return this.hand.some(card => card.suit === suit);
  }

  resetForNewRound(): void {
    this.hand = [];
    this.declaredSirs = 0;
    this.wonSirs = 0;
  }
}

