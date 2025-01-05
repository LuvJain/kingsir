import { Card, Suit, Rank } from './Card';

export class Deck {
  private cards: Card[];

  constructor() {
    this.cards = [];
    for (const suit of Object.values(Suit)) {
      for (const rank of Object.values(Rank)) {
        this.cards.push(new Card(suit as Suit, rank as Rank));
      }
    }
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(numPlayers: number, cardsPerPlayer: number): Card[][] {
    const hands: Card[][] = Array(numPlayers).fill(null).map(() => []);
    for (let i = 0; i < cardsPerPlayer; i++) {
      for (let j = 0; j < numPlayers; j++) {
        if (this.cards.length > 0) {
          hands[j].push(this.cards.pop()!);
        }
      }
    }
    return hands;
  }
}

