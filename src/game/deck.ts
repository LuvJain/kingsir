import { type Card, Suit, Rank } from './types';

export function createDeck(): Card[] {
    const cards: Card[] = [];
    for (const suit of Object.values(Suit)) {
        for (const rank of Object.values(Rank)) {
            cards.push({ suit, rank, id: `${rank}-${suit}` });
        }
    }
    return cards;
}

export function shuffleDeck(cards: Card[]): Card[] {
    const shuffled = [...cards];
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function dealCards(deck: Card[], numPlayers: number, cardsPerPlayer: number): Card[][] {
    const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
    for (let i = 0; i < cardsPerPlayer; i++) {
        for (let j = 0; j < numPlayers; j++) {
            const cardIndex = i * numPlayers + j;
            if (cardIndex < deck.length) {
                hands[j].push(deck[cardIndex]);
            }
        }
    }
    return hands;
}
