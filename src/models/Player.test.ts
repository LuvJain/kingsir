import { Player } from './Player';
import { Card, Suit, Rank } from './Card';

describe('Player', () => {
  describe('Unit Tests', () => {
    it('should create a player with initial state', () => {
      const player = new Player('Alice');
      
      expect(player.name).toBe('Alice');
      expect(player.hand).toEqual([]);
      expect(player.declaredSirs).toBe(-1); // -1 means not yet declared
      expect(player.wonSirs).toBe(0);
      expect(player.score).toBe(0);
    });

    it('should add cards to hand', () => {
      const player = new Player('Bob');
      const cards = [
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
      ];
      
      player.addToHand(cards);
      
      expect(player.hand.length).toBe(2);
      expect(player.hand[0].suit).toBe(Suit.Hearts);
      expect(player.hand[1].suit).toBe(Suit.Spades);
    });

    it('should play a card from hand', () => {
      const player = new Player('Charlie');
      const card1 = new Card(Suit.Hearts, Rank.Ace);
      const card2 = new Card(Suit.Spades, Rank.King);
      
      player.addToHand([card1, card2]);
      
      const playedCard = player.playCard(card1);
      
      expect(playedCard.suit).toBe(Suit.Hearts);
      expect(playedCard.rank).toBe(Rank.Ace);
      expect(player.hand.length).toBe(1);
      expect(player.hand[0].suit).toBe(Suit.Spades);
    });

    it('should throw error when playing card not in hand', () => {
      const player = new Player('Dave');
      const card = new Card(Suit.Hearts, Rank.Ace);
      
      expect(() => player.playCard(card)).toThrow('Card not in hand');
    });

    it('should check if player has card of suit', () => {
      const player = new Player('Eve');
      player.addToHand([
        new Card(Suit.Hearts, Rank.Ace),
        new Card(Suit.Spades, Rank.King),
      ]);
      
      expect(player.hasCard(Suit.Hearts)).toBe(true);
      expect(player.hasCard(Suit.Diamonds)).toBe(false);
    });

    it('should reset for new round', () => {
      const player = new Player('Frank');
      player.addToHand([new Card(Suit.Hearts, Rank.Ace)]);
      player.declaredSirs = 5;
      player.wonSirs = 3;
      player.score = 10;
      
      player.resetForNewRound();
      
      expect(player.hand).toEqual([]);
      expect(player.declaredSirs).toBe(-1); // Reset to not declared
      expect(player.wonSirs).toBe(0);
      expect(player.score).toBe(10); // Score should persist
    });
  });
});
