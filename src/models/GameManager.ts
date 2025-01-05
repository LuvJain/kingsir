import { Deck } from './Deck';
import { Player } from './Player';
import { Card, Suit, Rank } from './Card';

export class GameManager {
  private deck: Deck;
  players: Player[];
  currentRound: number;
  maxRounds: number;
  trumpSuit: Suit | null;
  currentPlayerIndex: number;
  playedCards: Card[];
  leadingSuit: Suit | null;

  constructor(playerNames: string[]) {
    this.deck = new Deck();
    this.players = playerNames.map(name => new Player(name));
    this.currentRound = 0;
    this.maxRounds = 13; // Start with 13 cards and go down to 1
    this.trumpSuit = null;
    this.currentPlayerIndex = 0;
    this.playedCards = [];
    this.leadingSuit = null;
  }

  startNewRound(): void {
    this.currentRound++;
    const cardsPerPlayer = this.maxRounds - this.currentRound + 1;
    this.deck = new Deck();
    this.deck.shuffle();
    const hands = this.deck.deal(this.players.length, cardsPerPlayer);
    this.players.forEach((player, index) => {
      player.resetForNewRound();
      player.addToHand(hands[index]);
    });
    this.trumpSuit = null;
    this.currentPlayerIndex = this.currentRound === 1 ? Math.floor(Math.random() * this.players.length) : this.currentPlayerIndex;
    this.playedCards = [];
    this.leadingSuit = null;
  }

  declareSirs(playerIndex: number, sirs: number): boolean {
    const player = this.players[playerIndex];
    const totalDeclaredSirs = this.players.reduce((sum, p) => sum + p.declaredSirs, 0) + sirs;
    const cardsPerPlayer = this.maxRounds - this.currentRound + 1;

    if (totalDeclaredSirs === cardsPerPlayer && playerIndex === this.players.length - 1) {
      return false; // Last player can't make the total equal to cardsPerPlayer
    }

    player.declaredSirs = sirs;
    return true;
  }

  setTrumpSuit(suit: Suit): void {
    this.trumpSuit = suit;
  }

  playCard(playerIndex: number, card: Card): boolean {
    const player = this.players[playerIndex];
    if (playerIndex !== this.currentPlayerIndex) {
      return false;
    }

    if (this.leadingSuit === null) {
      this.leadingSuit = card.suit;
    } else if (player.hasCard(this.leadingSuit) && card.suit !== this.leadingSuit) {
      return false; // Player must follow suit if possible
    }

    player.playCard(card);
    this.playedCards.push(card);

    if (this.playedCards.length === this.players.length) {
      this.resolveTrick();
    } else {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    return true;
  }

  private resolveTrick(): void {
    let winningCard = this.playedCards[0];
    let winningPlayerIndex = this.currentPlayerIndex;

    for (let i = 1; i < this.playedCards.length; i++) {
      const card = this.playedCards[i];
      if (
        (card.suit === this.trumpSuit && winningCard.suit !== this.trumpSuit) ||
        (card.suit === winningCard.suit && this.compareCards(card, winningCard) > 0)
      ) {
        winningCard = card;
        winningPlayerIndex = (this.currentPlayerIndex + i) % this.players.length;
      }
    }

    this.players[winningPlayerIndex].wonSirs++;
    this.currentPlayerIndex = winningPlayerIndex;
    this.playedCards = [];
    this.leadingSuit = null;
  }

  private compareCards(card1: Card, card2: Card): number {
    const rankOrder = Object.values(Rank);
    return rankOrder.indexOf(card1.rank) - rankOrder.indexOf(card2.rank);
  }

  scoreRound(): void {
    this.players.forEach(player => {
      if (player.wonSirs === player.declaredSirs) {
        player.score += player.declaredSirs === 0 ? 10 : player.declaredSirs + 10;
      }
    });
  }

  isGameOver(): boolean {
    return this.currentRound === this.maxRounds;
  }
}

