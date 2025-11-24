import { Card, Suit, Rank } from '../models/Card';
import { GameManager } from '../models/GameManager';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export class AIPlayer {
  constructor(
    public name: string,
    public difficulty: AIDifficulty
  ) {}

  // AI makes a bid based on hand strength
  makeBid(hand: Card[], handsInRound: number, totalDeclaredSirs: number, isLastPlayer: boolean): number {
    const handStrength = this.evaluateHandStrength(hand);
    
    if (this.difficulty === 'easy') {
      // Easy: Random bid with slight bias toward hand strength
      const maxBid = Math.min(hand.length, Math.floor(handStrength * hand.length) + 1);
      let bid = Math.floor(Math.random() * (maxBid + 1));
      
      // Avoid last player restriction
      if (isLastPlayer && totalDeclaredSirs + bid === handsInRound) {
        bid = bid > 0 ? bid - 1 : bid + 1;
      }
      return Math.max(0, Math.min(bid, hand.length));
    }
    
    if (this.difficulty === 'medium') {
      // Medium: Reasonable bid based on hand strength
      let bid = Math.round(handStrength * hand.length);
      
      // Avoid last player restriction
      if (isLastPlayer && totalDeclaredSirs + bid === handsInRound) {
        bid = bid > 0 ? bid - 1 : bid + 1;
      }
      return Math.max(0, Math.min(bid, hand.length));
    }
    
    // Hard: Strategic bid considering game state
    let bid = Math.round(handStrength * hand.length);
    
    // Adjust based on position
    if (isLastPlayer) {
      // Last player has advantage - can see all bids
      const avgBid = totalDeclaredSirs / (hand.length - 1);
      if (avgBid > handStrength * hand.length) {
        bid = Math.max(0, bid - 1); // Be conservative
      }
      
      // Avoid restriction
      if (totalDeclaredSirs + bid === handsInRound) {
        bid = bid > 0 ? bid - 1 : bid + 1;
      }
    }
    
    return Math.max(0, Math.min(bid, hand.length));
  }

  // AI selects trump suit
  selectTrumpSuit(hand: Card[]): Suit {
    const suitCounts = new Map<Suit, number>();
    const suitStrengths = new Map<Suit, number>();
    
    hand.forEach(card => {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
      const rankValue = this.getCardRankValue(card);
      suitStrengths.set(card.suit, (suitStrengths.get(card.suit) || 0) + rankValue);
    });
    
    // Choose suit with best combination of count and strength
    let bestSuit = Suit.Hearts;
    let bestScore = 0;
    
    [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades].forEach(suit => {
      const count = suitCounts.get(suit) || 0;
      const strength = suitStrengths.get(suit) || 0;
      const score = count * 2 + strength; // Weight count more than strength
      
      if (score > bestScore) {
        bestScore = score;
        bestSuit = suit;
      }
    });
    
    return bestSuit;
  }

  // AI plays a card - now with proper strategy!
  playCard(
    hand: Card[], 
    leadingSuit: Suit | null, 
    trumpSuit: Suit | null, 
    playedCards: Card[],
    declaredSirs: number,
    wonSirs: number,
    tricksRemaining: number
  ): Card {
    const validCards = this.getValidCards(hand, leadingSuit);
    
    // Calculate if we need this trick
    const tricksNeeded = declaredSirs - wonSirs;
    const needThisTrick = tricksNeeded > 0 && tricksNeeded >= tricksRemaining;
    const dontWantTrick = wonSirs >= declaredSirs; // Already made our bid!
    
    if (this.difficulty === 'easy') {
      // Easy: Play somewhat randomly but with basic logic
      if (dontWantTrick) {
        // Try not to win if we've made our bid
        return this.getLowestCard(validCards);
      }
      return validCards[Math.floor(Math.random() * validCards.length)];
    }
    
    if (this.difficulty === 'medium') {
      // Medium: Understand bid tracking
      if (leadingSuit) {
        if (dontWantTrick) {
          // We've made our bid - try to lose
          const canAvoidWinning = !this.mustWinTrick(validCards, playedCards, leadingSuit, trumpSuit);
          if (canAvoidWinning) {
            return this.getLowestCard(validCards);
          }
          // Forced to win - play lowest winning card
          return this.getLowestWinningCard(validCards, playedCards, leadingSuit, trumpSuit);
        }
        
        if (needThisTrick) {
          // We need this trick - try to win
          const canWin = this.canWinTrick(validCards, playedCards, leadingSuit, trumpSuit);
          if (canWin) {
            return this.getLowestWinningCard(validCards, playedCards, leadingSuit, trumpSuit);
          }
        }
        
        // Don't need it urgently - play low
        return this.getLowestCard(validCards);
      }
      
      // Leading - play medium card
      return validCards[Math.floor(validCards.length / 2)];
    }
    
    // Hard: Full strategic play with opponent tracking
    if (leadingSuit) {
      if (dontWantTrick) {
        // CRITICAL: We've made our bid - actively try to LOSE
        // This is where we can screw over opponents!
        const canDump = !this.mustWinTrick(validCards, playedCards, leadingSuit, trumpSuit);
        if (canDump) {
          // Dump our highest card to avoid winning future tricks
          return this.getHighestNonWinningCard(validCards, playedCards, leadingSuit, trumpSuit);
        }
        // Forced to win - minimize damage
        return this.getLowestWinningCard(validCards, playedCards, leadingSuit, trumpSuit);
      }
      
      if (needThisTrick) {
        // We MUST win this trick
        const canWin = this.canWinTrick(validCards, playedCards, leadingSuit, trumpSuit);
        if (canWin) {
          return this.getLowestWinningCard(validCards, playedCards, leadingSuit, trumpSuit);
        }
        // Can't win - play highest to at least try
        return this.getHighestCard(validCards);
      }
      
      if (tricksNeeded > 0) {
        // We need tricks but not urgently - be selective
        const canWinCheaply = this.canWinWithLowCard(validCards, playedCards, leadingSuit, trumpSuit);
        if (canWinCheaply) {
          return this.getLowestWinningCard(validCards, playedCards, leadingSuit, trumpSuit);
        }
        // Too expensive - save cards for later
        return this.getLowestCard(validCards);
      }
      
      // Don't need any more tricks - dump cards
      return this.getLowestCard(validCards);
    }
    
    // Leading - strategic lead based on our situation
    return this.getStrategicLeadCard(validCards, trumpSuit, dontWantTrick, needThisTrick);
  }

  private evaluateHandStrength(hand: Card[]): number {
    if (hand.length === 0) return 0;
    
    // Calculate average card value (2-14 scale)
    const totalValue = hand.reduce((sum, card) => sum + this.getCardRankValue(card), 0);
    const avgValue = totalValue / hand.length;
    
    // Normalize to 0-1 scale (average card is 8, so 8/14 = 0.57)
    // High cards (10+) will be > 0.7, low cards (2-6) will be < 0.4
    const normalizedStrength = (avgValue - 2) / 12; // Maps 2->0, 14->1
    
    // Also consider high card count (Jacks and above)
    const highCards = hand.filter(card => this.getCardRankValue(card) >= 11).length;
    const highCardBonus = (highCards / hand.length) * 0.2; // Up to 20% bonus
    
    return Math.min(1, normalizedStrength + highCardBonus);
  }

  private getCardRankValue(card: Card): number {
    const rankValues: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return rankValues[card.rank] || 0;
  }

  private getValidCards(hand: Card[], leadingSuit: Suit | null): Card[] {
    if (!leadingSuit) return [...hand];
    
    const suitCards = hand.filter(card => card.suit === leadingSuit);
    return suitCards.length > 0 ? suitCards : [...hand];
  }

  private canWinTrick(cards: Card[], playedCards: Card[], leadingSuit: Suit, trumpSuit: Suit | null): boolean {
    return cards.some(card => this.wouldWinTrick(card, playedCards, leadingSuit, trumpSuit));
  }

  private wouldWinTrick(card: Card, playedCards: Card[], leadingSuit: Suit, trumpSuit: Suit | null): boolean {
    if (playedCards.length === 0) return true;
    
    const currentWinner = this.getCurrentWinningCard(playedCards, leadingSuit, trumpSuit);
    return this.compareCards(card, currentWinner, leadingSuit, trumpSuit) > 0;
  }

  private getCurrentWinningCard(playedCards: Card[], leadingSuit: Suit, trumpSuit: Suit | null): Card {
    return playedCards.reduce((winner, card) => 
      this.compareCards(card, winner, leadingSuit, trumpSuit) > 0 ? card : winner
    );
  }

  private compareCards(card1: Card, card2: Card, leadingSuit: Suit, trumpSuit: Suit | null): number {
    // Trump beats everything
    if (card1.suit === trumpSuit && card2.suit !== trumpSuit) return 1;
    if (card2.suit === trumpSuit && card1.suit !== trumpSuit) return -1;
    
    // Both trump - compare ranks
    if (card1.suit === trumpSuit && card2.suit === trumpSuit) {
      return this.getCardRankValue(card1) - this.getCardRankValue(card2);
    }
    
    // Leading suit beats off-suit
    if (card1.suit === leadingSuit && card2.suit !== leadingSuit) return 1;
    if (card2.suit === leadingSuit && card1.suit !== leadingSuit) return -1;
    
    // Both leading suit - compare ranks
    if (card1.suit === leadingSuit && card2.suit === leadingSuit) {
      return this.getCardRankValue(card1) - this.getCardRankValue(card2);
    }
    
    // Both off-suit
    return 0;
  }

  private getLowestWinningCard(cards: Card[], playedCards: Card[], leadingSuit: Suit, trumpSuit: Suit | null): Card {
    const winningCards = cards.filter(card => this.wouldWinTrick(card, playedCards, leadingSuit, trumpSuit));
    return winningCards.reduce((lowest, card) => 
      this.getCardRankValue(card) < this.getCardRankValue(lowest) ? card : lowest
    );
  }

  private getLowestCard(cards: Card[]): Card {
    return cards.reduce((lowest, card) => 
      this.getCardRankValue(card) < this.getCardRankValue(lowest) ? card : lowest
    );
  }

  private getStrategicLeadCard(cards: Card[], trumpSuit: Suit | null, dontWantTrick: boolean, needThisTrick: boolean): Card {
    if (dontWantTrick) {
      // Lead with a low card to try to lose
      const nonTrump = cards.filter(card => card.suit !== trumpSuit);
      if (nonTrump.length > 0) {
        return this.getLowestCard(nonTrump);
      }
      return this.getLowestCard(cards);
    }
    
    if (needThisTrick) {
      // Lead with a high card to try to win
      return this.getHighestCard(cards);
    }
    
    // Neutral - lead with medium card
    const nonTrump = cards.filter(card => card.suit !== trumpSuit);
    if (nonTrump.length > 0) {
      const sorted = nonTrump.sort((a, b) => this.getCardRankValue(b) - this.getCardRankValue(a));
      return sorted[Math.floor(sorted.length / 2)];
    }
    return cards[Math.floor(cards.length / 2)];
  }

  private mustWinTrick(cards: Card[], playedCards: Card[], leadingSuit: Suit, trumpSuit: Suit | null): boolean {
    // Check if ALL our valid cards would win
    return cards.every(card => this.wouldWinTrick(card, playedCards, leadingSuit, trumpSuit));
  }

  private getHighestNonWinningCard(cards: Card[], playedCards: Card[], leadingSuit: Suit, trumpSuit: Suit | null): Card {
    const nonWinning = cards.filter(card => !this.wouldWinTrick(card, playedCards, leadingSuit, trumpSuit));
    if (nonWinning.length > 0) {
      return this.getHighestCard(nonWinning);
    }
    // All cards win - return lowest winning card
    return this.getLowestCard(cards);
  }

  private getHighestCard(cards: Card[]): Card {
    return cards.reduce((highest, card) => 
      this.getCardRankValue(card) > this.getCardRankValue(highest) ? card : highest
    );
  }

  private canWinWithLowCard(cards: Card[], playedCards: Card[], leadingSuit: Suit, trumpSuit: Suit | null): boolean {
    const winningCards = cards.filter(card => this.wouldWinTrick(card, playedCards, leadingSuit, trumpSuit));
    if (winningCards.length === 0) return false;
    
    const lowestWinner = this.getLowestCard(winningCards);
    const avgCardValue = cards.reduce((sum, c) => sum + this.getCardRankValue(c), 0) / cards.length;
    
    // "Cheap" if the winning card is below average
    return this.getCardRankValue(lowestWinner) < avgCardValue;
  }

  private isCurrentlyWinning(playedCards: Card[], leadingSuit: Suit, trumpSuit: Suit | null): boolean {
    if (playedCards.length === 0) return false;
    const lastCard = playedCards[playedCards.length - 1];
    const winningCard = this.getCurrentWinningCard(playedCards, leadingSuit, trumpSuit);
    return lastCard === winningCard;
  }
}
