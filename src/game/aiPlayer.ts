import { type Card, Suit, Rank, RANK_ORDER } from './types';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

/**
 * AI player logic for bidding, trump selection, and card play.
 *
 * Bidding happens before trump is known, so we estimate hand strength
 * probabilistically. Core heuristics:
 *   - Aces always win (1.0 expected trick each)
 *   - Kings win most of the time, less so in short suits (0.7)
 *   - Queens win occasionally (~0.4), less reliable
 *   - Short suits (1-2 cards) give ruffing potential worth ~0.5 tricks
 *   - Void suits worth ~1.0 (guaranteed ruff opportunity)
 *   - Long suits (5+) have extra winners from suit establishment
 */
export function aiBid(
    hand: Card[],
    cardsPerPlayer: number,
    totalBidSoFar: number,
    isLastBidder: boolean,
    difficulty: AIDifficulty
): number {
    const suitCounts = countSuits(hand);

    // Base expected wins from high cards
    let base = 0;
    for (const card of hand) {
        const rankIdx = RANK_ORDER.indexOf(card.rank);
        const suitLength = suitCounts[card.suit];

        if (card.rank === Rank.Ace) {
            base += 1.0; // always wins
        } else if (card.rank === Rank.King) {
            // King wins unless someone has the Ace of same suit — less likely in short suits
            base += suitLength <= 2 ? 0.5 : 0.75;
        } else if (card.rank === Rank.Queen) {
            base += suitLength <= 2 ? 0.25 : 0.4;
        } else if (rankIdx >= RANK_ORDER.indexOf(Rank.Jack)) {
            base += 0.15;
        }
    }

    // Ruffing potential: short suits mean you can trump when that suit is led
    for (const suit of Object.values(Suit)) {
        const len = suitCounts[suit];
        if (len === 0) base += 1.0;       // void = strong ruffing
        else if (len === 1) base += 0.5;  // singleton = decent ruffing
        else if (len === 2) base += 0.2;  // doubleton = some ruffing
    }

    // Long suit bonus: 5+ cards in a suit, the low cards become winners eventually
    for (const suit of Object.values(Suit)) {
        if (suitCounts[suit] >= 5) base += (suitCounts[suit] - 4) * 0.3;
    }

    // Apply difficulty — harder bots are more accurate, easier ones noisier
    let noise: number;
    switch (difficulty) {
        case 'easy':
            // Mostly ignores strategy, adds heavy random noise
            noise = (Math.random() - 0.5) * cardsPerPlayer * 0.8;
            base = base * 0.4 + noise; // mostly random with slight hand awareness
            break;
        case 'medium':
            // Decent estimate with moderate noise
            noise = (Math.random() - 0.5) * 2.0;
            base = base * 0.75 + noise;
            break;
        case 'hard':
            // Accurate with tiny noise
            noise = (Math.random() - 0.5) * 0.8;
            base = base + noise;
            break;
    }

    let estimatedWins = Math.round(base);
    estimatedWins = Math.max(0, Math.min(cardsPerPlayer, estimatedWins));

    // Last bidder restriction: can't make total bids equal cardsPerPlayer
    if (isLastBidder && totalBidSoFar + estimatedWins === cardsPerPlayer) {
        // Adjust by 1 in whichever direction keeps us in range
        const adjusted = estimatedWins > 0 ? estimatedWins - 1 : estimatedWins + 1;
        estimatedWins = Math.max(0, Math.min(cardsPerPlayer, adjusted));
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
