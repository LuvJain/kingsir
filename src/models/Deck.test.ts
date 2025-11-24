import * as fc from 'fast-check';
import { Deck } from './Deck';
import { Suit, Rank } from './Card';

describe('Deck', () => {
  describe('Property 1: Deck completeness', () => {
    // Feature: kingsir-game, Property 1: Deck completeness
    // Validates: Requirements 1.2
    it('should create a deck with exactly 52 unique cards (13 ranks × 4 suits)', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const deck = new Deck();
          const cards = (deck as any).cards; // Access private field for testing
          
          // Check total count
          expect(cards.length).toBe(52);
          
          // Check uniqueness by creating a set of card strings
          const cardStrings = cards.map((card: any) => card.toString());
          const uniqueCards = new Set(cardStrings);
          expect(uniqueCards.size).toBe(52);
          
          // Verify all suits are present (13 cards each)
          const suitCounts = new Map<string, number>();
          cards.forEach((card: any) => {
            const count = suitCounts.get(card.suit) || 0;
            suitCounts.set(card.suit, count + 1);
          });
          
          expect(suitCounts.size).toBe(4);
          suitCounts.forEach(count => {
            expect(count).toBe(13);
          });
          
          // Verify all ranks are present (4 cards each)
          const rankCounts = new Map<string, number>();
          cards.forEach((card: any) => {
            const count = rankCounts.get(card.rank) || 0;
            rankCounts.set(card.rank, count + 1);
          });
          
          expect(rankCounts.size).toBe(13);
          rankCounts.forEach(count => {
            expect(count).toBe(4);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Equal card distribution', () => {
    // Feature: kingsir-game, Property 2: Equal card distribution
    // Validates: Requirements 1.3, 1.4
    it('should deal equal number of cards to each player', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 6 }), // numPlayers
          fc.integer({ min: 1, max: 17 }), // cardsPerPlayer (max 17 for 3 players)
          (numPlayers, cardsPerPlayer) => {
            // Skip if we don't have enough cards
            if (numPlayers * cardsPerPlayer > 52) {
              return true;
            }
            
            const deck = new Deck();
            deck.shuffle();
            const hands = deck.deal(numPlayers, cardsPerPlayer);
            
            // All players should have equal number of cards
            expect(hands.length).toBe(numPlayers);
            hands.forEach(hand => {
              expect(hand.length).toBe(cardsPerPlayer);
            });
            
            // All cards should be unique across hands
            const allCards = hands.flat();
            const cardStrings = allCards.map(card => card.toString());
            const uniqueCards = new Set(cardStrings);
            expect(uniqueCards.size).toBe(allCards.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Remaining cards constraint', () => {
    // Feature: kingsir-game, Property 3: Remaining cards constraint
    // Validates: Requirements 1.4
    it('should have remaining cards less than number of players after dealing', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 6 }), // numPlayers
          (numPlayers) => {
            const deck = new Deck();
            deck.shuffle();
            
            // Calculate cards per player for even distribution
            const cardsPerPlayer = Math.floor(52 / numPlayers);
            const hands = deck.deal(numPlayers, cardsPerPlayer);
            
            // Remaining cards should be less than numPlayers
            const remaining = deck.getRemainingCards();
            expect(remaining).toBeLessThan(numPlayers);
            
            // Verify the math: 52 = (numPlayers * cardsPerPlayer) + remaining
            expect(52).toBe(numPlayers * cardsPerPlayer + remaining);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should create a deck with 52 cards', () => {
      const deck = new Deck();
      const cards = (deck as any).cards;
      expect(cards.length).toBe(52);
    });

    it('should deal cards to 4 players correctly', () => {
      const deck = new Deck();
      const hands = deck.deal(4, 13);
      
      expect(hands.length).toBe(4);
      hands.forEach(hand => {
        expect(hand.length).toBe(13);
      });
    });

    it('should deal cards to 5 players with remainder', () => {
      const deck = new Deck();
      const hands = deck.deal(5, 10);
      
      expect(hands.length).toBe(5);
      hands.forEach(hand => {
        expect(hand.length).toBe(10);
      });
      expect(deck.getRemainingCards()).toBe(2);
    });

    it('should shuffle deck (cards in different order)', () => {
      const deck1 = new Deck();
      const cards1 = [...(deck1 as any).cards];
      
      const deck2 = new Deck();
      deck2.shuffle();
      const cards2 = (deck2 as any).cards;
      
      // After shuffle, at least some cards should be in different positions
      let differentPositions = 0;
      for (let i = 0; i < cards1.length; i++) {
        if (cards1[i].toString() !== cards2[i].toString()) {
          differentPositions++;
        }
      }
      
      // Expect at least 40 cards to be in different positions (very high probability)
      expect(differentPositions).toBeGreaterThan(40);
    });
  });
});
