import { type Card, Suit, Rank, RANK_ORDER, type GameState, type PlayerState, type PlayedCard } from './types';
import { createDeck, shuffleDeck, dealCards } from './deck';

/**
 * Find whoever holds the Ace of Spades — they start bidding in round 1.
 */
export function findAceOfSpadesHolder(players: PlayerState[]): number {
    for (let i = 0; i < players.length; i++) {
        if (players[i].hand.some(c => c.suit === Suit.Spades && c.rank === Rank.Ace)) {
            return i;
        }
    }
    return 0; // fallback
}

/**
 * Calculate how many cards each player gets this round.
 * Round 1 = max cards, decreases by 1 each round down to 1 card.
 */
export function calculateCardsPerPlayer(round: number, numPlayers: number): number {
    const firstRoundCards = Math.floor(52 / numPlayers);
    return firstRoundCards - (round - 1);
}

/**
 * Total number of rounds in a game.
 * Starts at max cards (e.g. 13 for 4 players), counts down to 1.
 */
export function getTotalRounds(numPlayers: number): number {
    return Math.floor(52 / numPlayers);
}

/**
 * Initialize a fresh game state.
 * Accepts an optional startRound for testing (skips ahead).
 */
export function initializeGame(roomCode: string, hostId: string, players: PlayerState[], startRound = 1): GameState {
    const cardsPerPlayer = calculateCardsPerPlayer(startRound, players.length);
    const deck = shuffleDeck(createDeck());
    const hands = dealCards(deck, players.length, cardsPerPlayer);

    const updatedPlayers = players.map((p, i) => ({
        ...p,
        hand: sortHand(hands[i]),
        bid: -1,
        tricksWon: 0,
        // Give random scores when skipping ahead for testing
        score: startRound > 1 ? Math.floor(Math.random() * startRound * 8) : p.score,
    }));

    const starterIndex = findAceOfSpadesHolder(updatedPlayers);

    return {
        roomCode,
        hostId,
        phase: 'bidding',
        players: updatedPlayers,
        currentRound: startRound,
        cardsPerPlayer,
        currentPlayerIndex: starterIndex,
        trumpSuit: null,
        leadingSuit: null,
        playedCards: [],
        highestBidderId: null,
        roundStarterIndex: starterIndex,
        trickWinnerId: null,
        trickNumber: 0,
    };
}

/**
 * Sort hand by suit then rank for display.
 */
export function sortHand(hand: Card[]): Card[] {
    const suitOrder = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
    return [...hand].sort((a, b) => {
        const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
        if (suitDiff !== 0) return suitDiff;
        return RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
    });
}

/**
 * Validate a bid. Returns an error string or null if valid.
 */
export function validateBid(state: GameState, _playerIndex: number, bid: number): string | null {
    if (bid < 0 || bid > state.cardsPerPlayer) {
        return `Bid must be between 0 and ${state.cardsPerPlayer}`;
    }

    // Last player restriction: total bids cannot equal number of tricks
    const biddingPlayers = state.players.filter(p => p.bid >= 0);
    const isLastBidder = biddingPlayers.length === state.players.length - 1;
    if (isLastBidder) {
        const totalSoFar = biddingPlayers.reduce((sum, p) => sum + p.bid, 0);
        if (totalSoFar + bid === state.cardsPerPlayer) {
            return `Total bids cannot equal ${state.cardsPerPlayer}. Choose a different number.`;
        }
    }

    return null;
}

/**
 * Submit a bid and return the updated game state.
 */
export function submitBid(state: GameState, playerIndex: number, bid: number): GameState {
    const updatedPlayers = state.players.map((p, i) =>
        i === playerIndex ? { ...p, bid } : p
    );

    // Track highest bidder
    let highestBidderId = state.highestBidderId;
    const currentHighest = state.players.find(p => p.id === highestBidderId);
    if (!currentHighest || bid > currentHighest.bid) {
        highestBidderId = updatedPlayers[playerIndex].id;
    }

    const allBid = updatedPlayers.every(p => p.bid >= 0);
    const nextPlayerIndex = (playerIndex + 1) % state.players.length;

    return {
        ...state,
        players: updatedPlayers,
        highestBidderId,
        currentPlayerIndex: nextPlayerIndex,
        phase: allBid ? 'trumpSelection' : 'bidding',
    };
}

/**
 * Select trump suit (only highest bidder can do this).
 */
export function selectTrump(state: GameState, suit: Suit): GameState {
    const highestBidderIndex = state.players.findIndex(p => p.id === state.highestBidderId);
    return {
        ...state,
        trumpSuit: suit,
        phase: 'playing',
        currentPlayerIndex: highestBidderIndex,
    };
}

/**
 * Validate a card play. Returns error string or null if valid.
 */
export function validatePlay(state: GameState, playerIndex: number, card: Card): string | null {
    if (playerIndex !== state.currentPlayerIndex) {
        return "It's not your turn.";
    }

    if (!state.players[playerIndex].hand.some(c => c.id === card.id)) {
        return "That card isn't in your hand.";
    }

    // Must follow leading suit if possible
    if (state.leadingSuit && card.suit !== state.leadingSuit) {
        const hasLeadingSuit = state.players[playerIndex].hand.some(c => c.suit === state.leadingSuit);
        if (hasLeadingSuit) {
            return `You must follow the leading suit (${state.leadingSuit}).`;
        }
    }

    return null;
}

/**
 * Play a card and return updated state.
 */
export function playCard(state: GameState, playerIndex: number, card: Card): GameState {
    const player = state.players[playerIndex];
    const updatedHand = player.hand.filter(c => c.id !== card.id);
    const updatedPlayers = state.players.map((p, i) =>
        i === playerIndex ? { ...p, hand: updatedHand } : p
    );

    const playedCard: PlayedCard = {
        card,
        playerId: player.id,
        position: state.playedCards.length,
    };

    const updatedPlayedCards = [...state.playedCards, playedCard];
    const leadingSuit = state.playedCards.length === 0 ? card.suit : state.leadingSuit;

    // Check if trick is complete
    if (updatedPlayedCards.length === state.players.length) {
        const winnerId = determineTrickWinner(updatedPlayedCards, state.trumpSuit!, leadingSuit!);
        const winnerIndex = updatedPlayers.findIndex(p => p.id === winnerId);
        updatedPlayers[winnerIndex] = {
            ...updatedPlayers[winnerIndex],
            tricksWon: updatedPlayers[winnerIndex].tricksWon + 1,
        };

        return {
            ...state,
            players: updatedPlayers,
            playedCards: updatedPlayedCards,
            leadingSuit,
            trickWinnerId: winnerId,
            phase: 'trickResult',
            currentPlayerIndex: winnerIndex,
        };
    }

    // Move to next player
    const nextPlayerIndex = (playerIndex + 1) % state.players.length;
    return {
        ...state,
        players: updatedPlayers,
        playedCards: updatedPlayedCards,
        leadingSuit,
        currentPlayerIndex: nextPlayerIndex,
    };
}

/**
 * Determine who wins a completed trick.
 */
export function determineTrickWinner(
    playedCards: PlayedCard[],
    trumpSuit: Suit,
    leadingSuit: Suit
): string {
    let winningCard = playedCards[0];

    for (let i = 1; i < playedCards.length; i++) {
        const challenger = playedCards[i];
        if (beats(challenger.card, winningCard.card, trumpSuit, leadingSuit)) {
            winningCard = challenger;
        }
    }

    return winningCard.playerId;
}

/**
 * Does card A beat card B given trump and leading suit?
 */
function beats(a: Card, b: Card, trumpSuit: Suit, leadingSuit: Suit): boolean {
    // Trump beats non-trump
    if (a.suit === trumpSuit && b.suit !== trumpSuit) return true;
    if (a.suit !== trumpSuit && b.suit === trumpSuit) return false;

    // Both trump: higher rank wins
    if (a.suit === trumpSuit && b.suit === trumpSuit) {
        return RANK_ORDER.indexOf(a.rank) > RANK_ORDER.indexOf(b.rank);
    }

    // Leading suit beats off-suit
    if (a.suit === leadingSuit && b.suit !== leadingSuit) return true;
    if (a.suit !== leadingSuit && b.suit === leadingSuit) return false;

    // Both leading suit: higher rank wins
    if (a.suit === leadingSuit && b.suit === leadingSuit) {
        return RANK_ORDER.indexOf(a.rank) > RANK_ORDER.indexOf(b.rank);
    }

    // Both off-suit: first played wins (no change)
    return false;
}

/**
 * Clear the trick and advance to next trick or round end.
 */
export function advanceAfterTrick(state: GameState): GameState {
    const trickNumber = state.trickNumber + 1;
    const isRoundOver = trickNumber >= state.cardsPerPlayer;

    if (isRoundOver) {
        return scoreRound(state, trickNumber);
    }

    // Winner of last trick leads the next one
    return {
        ...state,
        playedCards: [],
        leadingSuit: null,
        trickWinnerId: null,
        trickNumber,
        phase: 'playing',
    };
}

/**
 * Score the round and advance to next round or game over.
 */
function scoreRound(state: GameState, trickNumber: number): GameState {
    const updatedPlayers = state.players.map(p => {
        let roundScore = 0;
        if (p.bid === p.tricksWon) {
            roundScore = p.bid === 0 ? 10 : p.bid + 10;
        }
        return {
            ...p,
            score: p.score + roundScore,
        };
    });

    return {
        ...state,
        players: updatedPlayers,
        playedCards: [],
        trickNumber,
        phase: 'roundEnd',
    };
}

/**
 * Start next round or end game.
 */
export function startNextRound(state: GameState): GameState {
    // Already finished — don't advance
    if (state.phase === 'gameOver') return state;

    const totalRounds = getTotalRounds(state.players.length);

    // Current round was the last one (1 card round) — game over
    if (state.currentRound >= totalRounds) {
        return { ...state, phase: 'gameOver' };
    }

    const nextRound = state.currentRound + 1;
    const nextCardsPerPlayer = calculateCardsPerPlayer(nextRound, state.players.length);

    const deck = shuffleDeck(createDeck());
    const hands = dealCards(deck, state.players.length, nextCardsPerPlayer);

    // Round-robin: next starter is one past the previous round's starter
    const nextStarterIndex = (state.roundStarterIndex + 1) % state.players.length;

    const updatedPlayers = state.players.map((p, i) => ({
        ...p,
        hand: sortHand(hands[i]),
        bid: -1,
        tricksWon: 0,
    }));

    return {
        ...state,
        players: updatedPlayers,
        currentRound: nextRound,
        cardsPerPlayer: nextCardsPerPlayer,
        currentPlayerIndex: nextStarterIndex,
        trumpSuit: null,
        leadingSuit: null,
        playedCards: [],
        highestBidderId: null,
        roundStarterIndex: nextStarterIndex,
        trickWinnerId: null,
        trickNumber: 0,
        phase: 'bidding',
    };
}

/**
 * Get valid bids for a player.
 */
export function getValidBids(state: GameState, playerIndex: number): number[] {
    const bids: number[] = [];
    for (let i = 0; i <= state.cardsPerPlayer; i++) {
        if (!validateBid(state, playerIndex, i)) {
            bids.push(i);
        }
    }
    return bids;
}
