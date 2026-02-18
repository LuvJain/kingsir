import { type Card, Suit, Rank, RANK_ORDER } from './types';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

/**
 * AI player logic for bidding, trump selection, and card play.
 */
export function aiBid(
    hand: Card[],
    cardsPerPlayer: number,
    totalBidSoFar: number,
    isLastBidder: boolean,
    difficulty: AIDifficulty
): number {
    // Count strong cards (high cards, potential trumps)
    const highCards = hand.filter(c =>
        RANK_ORDER.indexOf(c.rank) >= RANK_ORDER.indexOf(Rank.Queen)
    ).length;

    let estimatedWins: number;

    switch (difficulty) {
        case 'easy':
            // Random bid, slightly weighted toward the middle
            estimatedWins = Math.floor(Math.random() * (cardsPerPlayer + 1));
            break;
        case 'medium':
            // Based on high cards
            estimatedWins = Math.round(highCards * 0.7);
            break;
        case 'hard':
            // Sophisticated: count aces, kings, suit lengths
            const aces = hand.filter(c => c.rank === Rank.Ace).length;
            const kings = hand.filter(c => c.rank === Rank.King).length;
            const suitCounts = countSuits(hand);
            const longSuitBonus = Object.values(suitCounts).filter(c => c >= 4).length * 0.5;
            estimatedWins = Math.round(aces + kings * 0.6 + longSuitBonus);
            break;
    }

    estimatedWins = Math.max(0, Math.min(cardsPerPlayer, estimatedWins));

    // Last bidder restriction
    if (isLastBidder && totalBidSoFar + estimatedWins === cardsPerPlayer) {
        estimatedWins = estimatedWins > 0 ? estimatedWins - 1 : estimatedWins + 1;
        estimatedWins = Math.max(0, Math.min(cardsPerPlayer, estimatedWins));
    }

    return estimatedWins;
}

/**
 * AI selects trump suit based on hand.
 */
export function aiSelectTrump(hand: Card[], difficulty: AIDifficulty): Suit {
    const suitStrength: Record<string, number> = {};

    for (const suit of Object.values(Suit)) {
        const suitCards = hand.filter(c => c.suit === suit);
        const count = suitCards.length;
        const highCardValue = suitCards.reduce((sum, c) => sum + RANK_ORDER.indexOf(c.rank), 0);

        if (difficulty === 'easy') {
            suitStrength[suit] = count; // just pick longest suit
        } else {
            suitStrength[suit] = count * 2 + highCardValue; // weighted by quality
        }
    }

    let bestSuit: Suit = Suit.Spades;
    let bestScore = -1;
    for (const [suit, score] of Object.entries(suitStrength)) {
        if (score > bestScore) {
            bestScore = score;
            bestSuit = suit as Suit;
        }
    }

    return bestSuit;
}

/**
 * AI plays a card.
 */
export function aiPlayCard(
    hand: Card[],
    leadingSuit: Suit | null,
    trumpSuit: Suit | null,
    bid: number,
    tricksWon: number,
    difficulty: AIDifficulty
): Card {
    const validCards = getPlayableCards(hand, leadingSuit);
    if (validCards.length === 1) return validCards[0];

    const needMoreTricks = tricksWon < bid;
    const metBid = tricksWon === bid;

    if (difficulty === 'easy') {
        return validCards[Math.floor(Math.random() * validCards.length)];
    }

    if (needMoreTricks) {
        // Try to win: play highest card in leading suit, or trump if possible
        if (leadingSuit) {
            const leadCards = validCards.filter(c => c.suit === leadingSuit);
            if (leadCards.length > 0) return getHighestCard(leadCards);
            // Can't follow suit — play trump if we have it
            const trumpCards = validCards.filter(c => c.suit === trumpSuit);
            if (trumpCards.length > 0) return getLowestCard(trumpCards);
            // No leading suit and no trump — play highest available
            return getHighestCard(validCards);
        } else {
            // Leading: play from strongest suit
            return getHighestCard(validCards);
        }
    }

    if (metBid) {
        // Try to lose: play lowest card
        if (leadingSuit) {
            const leadCards = validCards.filter(c => c.suit === leadingSuit);
            if (leadCards.length > 0) return getLowestCard(leadCards);
            // Off-suit, play lowest non-trump
            const nonTrump = validCards.filter(c => c.suit !== trumpSuit);
            if (nonTrump.length > 0) return getLowestCard(nonTrump);
        }
        return getLowestCard(validCards);
    }

    // Default: play lowest
    return getLowestCard(validCards);
}

function getPlayableCards(hand: Card[], leadingSuit: Suit | null): Card[] {
    if (!leadingSuit) return hand;
    const suitCards = hand.filter(c => c.suit === leadingSuit);
    return suitCards.length > 0 ? suitCards : hand;
}

function getHighestCard(cards: Card[]): Card {
    return cards.reduce((best, c) =>
        RANK_ORDER.indexOf(c.rank) > RANK_ORDER.indexOf(best.rank) ? c : best
    );
}

function getLowestCard(cards: Card[]): Card {
    return cards.reduce((best, c) =>
        RANK_ORDER.indexOf(c.rank) < RANK_ORDER.indexOf(best.rank) ? c : best
    );
}

function countSuits(hand: Card[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const suit of Object.values(Suit)) {
        counts[suit] = hand.filter(c => c.suit === suit).length;
    }
    return counts;
}
