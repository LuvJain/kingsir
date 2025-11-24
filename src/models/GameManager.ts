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
  biddingComplete: boolean;
  highestBidder: number | null;
  handsInRound: number;
  currentHand: number;

  constructor(playerNames: string[]) {
    this.deck = new Deck();
    this.players = playerNames.map(name => new Player(name));
    this.currentRound = 0;
    this.maxRounds = 13; // Assuming a standard 52-card deck
    this.trumpSuit = null;
    this.currentPlayerIndex = 0;
    this.playedCards = [];
    this.leadingSuit = null;
    this.biddingComplete = false;
    this.highestBidder = null;
    this.handsInRound = 0;
    this.currentHand = 0;
  }

  startNewRound(): void {
    this.currentRound++;
    this.currentHand = 0;
    
    // Calculate cards per player: floor(52 / numPlayers) for round 1, then decrease by 1 each round
    const cardsPerPlayer = this.calculateCardsPerPlayer(this.currentRound, this.players.length);
    this.handsInRound = cardsPerPlayer;
    
    this.deck = new Deck();
    this.deck.shuffle();
    const hands = this.deck.deal(this.players.length, cardsPerPlayer);
    
    this.players.forEach((player, index) => {
      player.resetForNewRound();
      player.addToHand(hands[index]);
    });
    
    this.trumpSuit = null;
    this.currentPlayerIndex = (this.currentRound - 1) % this.players.length;
    this.playedCards = [];
    this.leadingSuit = null;
    this.biddingComplete = false;
    this.highestBidder = null;
  }

  private calculateCardsPerPlayer(round: number, numPlayers: number): number {
    const firstRoundCards = Math.floor(52 / numPlayers);
    return firstRoundCards - (round - 1);
  }

  declareSirs(playerIndex: number, sirs: number): boolean {
    const player = this.players[playerIndex];
    const totalDeclaredSirs = this.players.reduce((sum, p) => sum + (p.declaredSirs === -1 ? 0 : p.declaredSirs), 0) + sirs;
    
    if (playerIndex === this.players.length - 1 && totalDeclaredSirs === this.handsInRound) {
      return false; // Last player can't make the total equal to the number of hands
    }

    player.declaredSirs = sirs;

    // Update highest bidder
    if (this.highestBidder === null || sirs > this.players[this.highestBidder].declaredSirs) {
      this.highestBidder = playerIndex;
    }

    // Check if bidding is complete
    if (this.players.every(p => p.declaredSirs !== -1)) {
      this.biddingComplete = true;
    }

    // Move to the next player for bidding
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

    return true;
  }

  setTrumpSuit(suit: Suit): void {
    if (this.biddingComplete && this.highestBidder !== null) {
      this.trumpSuit = suit;
      this.currentPlayerIndex = this.highestBidder; // First play starts with highest bidder
    }
  }

  playCard(playerIndex: number, card: Card): boolean {
    const player = this.players[playerIndex];
    if (playerIndex !== this.currentPlayerIndex) {
      return false;
    }

    // Check if player must follow suit
    if (this.leadingSuit === null) {
      this.leadingSuit = card.suit;
    } else if (player.hasCard(this.leadingSuit) && card.suit !== this.leadingSuit) {
      return false; // Player must follow suit if possible
    }

    player.playCard(card);
    this.playedCards.push(card);

    if (this.playedCards.length === this.players.length) {
      this.resolveHand();
    } else {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    return true;
  }

  private resolveHand(): void {
    // The first card was played by the player who led (currentPlayerIndex at start of trick)
    // We need to figure out who played which card
    const leadPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length; // currentPlayerIndex has been incremented past the last player
    
    let winningCard = this.playedCards[0];
    let winningPlayerIndex = leadPlayerIndex;
    const leadingSuit = this.playedCards[0].suit;

    for (let i = 1; i < this.playedCards.length; i++) {
      const card = this.playedCards[i];
      const playerIndex = (leadPlayerIndex + i) % this.players.length;

      if (this.isWinningCard(card, winningCard, leadingSuit)) {
        winningCard = card;
        winningPlayerIndex = playerIndex;
      }
    }

    this.players[winningPlayerIndex].wonSirs++;
    this.currentPlayerIndex = winningPlayerIndex; // Winner starts next hand
    this.playedCards = [];
    this.leadingSuit = null;
    this.currentHand++;

    if (this.currentHand === this.handsInRound) {
      this.scoreRound();
      if (!this.isGameOver()) {
        this.startNewRound();
      }
    }
  }

  private isWinningCard(card: Card, currentWinningCard: Card, leadingSuit: Suit): boolean {
    if (card.suit === this.trumpSuit && currentWinningCard.suit !== this.trumpSuit) {
      return true;
    }
    if (card.suit === this.trumpSuit && currentWinningCard.suit === this.trumpSuit) {
      return this.compareCards(card, currentWinningCard) > 0;
    }
    if (card.suit === leadingSuit && currentWinningCard.suit === leadingSuit) {
      return this.compareCards(card, currentWinningCard) > 0;
    }
    return false;
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

