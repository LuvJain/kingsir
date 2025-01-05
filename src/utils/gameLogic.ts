import { Card, Suit, Rank, Player, GameState } from '../types';
import { createDeck, shuffleDeck, dealCards } from './deck';

export function initializeGame(playerNames: string[]): GameState {
  const deck = shuffleDeck(createDeck());
  const numPlayers = playerNames.length;
  const cardsPerPlayer = Math.floor(52 / numPlayers);

  const hands = dealCards(deck, numPlayers, cardsPerPlayer);
  const players: Player[] = playerNames.map((name, index) => ({
    id: `player-${index}`,
    name,
    hand: hands[index],
    declaredSirs: 0,
    wonSirs: 0,
    score: 0,
  }));

  return {
    players,
    deck,
    currentRound: 1,
    cardsPerPlayer,
    trumpSuit: null,
    currentTrick: [],
    leadingSuit: null,
    currentPlayerIndex: 0,
    gamePhase: 'declaring',
  };
}

export function validateDeclaration(gameState: GameState, playerId: string, declaration: number): boolean {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;

  const totalDeclared = gameState.players.reduce((sum, p) => sum + p.declaredSirs, 0) + declaration;
  const isLastPlayer = gameState.players.indexOf(player) === gameState.players.length - 1;

  if (isLastPlayer && totalDeclared === gameState.cardsPerPlayer) {
    return false;
  }

  return declaration >= 0 && declaration <= gameState.cardsPerPlayer;
}

export function selectTrumpSuit(gameState: GameState, suit: Suit): GameState {
  return { ...gameState, trumpSuit: suit, gamePhase: 'playing' };
}

export function playCard(gameState: GameState, playerId: string, card: Card): GameState {
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1 || playerIndex !== gameState.currentPlayerIndex) return gameState;

  const player = gameState.players[playerIndex];
  const cardIndex = player.hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
  if (cardIndex === -1) return gameState;

  // Remove the card from the player's hand
  const updatedPlayers = gameState.players.map((p, index) => 
    index === playerIndex 
      ? { ...p, hand: p.hand.filter((_, i) => i !== cardIndex) }
      : p
  );

  // Add the card to the current trick
  const updatedTrick = [...gameState.currentTrick, card];

  // Update the leading suit if this is the first card played
  const leadingSuit = gameState.leadingSuit || card.suit;

  // Move to the next player
  const nextPlayerIndex = (playerIndex + 1) % gameState.players.length;

  // Check if the trick is complete
  if (updatedTrick.length === gameState.players.length) {
    // Determine the winner of the trick
    const winningCard = determineWinningCard(updatedTrick, gameState.trumpSuit!, leadingSuit);
    const winningPlayerIndex = updatedTrick.findIndex(c => c === winningCard);

    // Update the winning player's wonSirs
    updatedPlayers[winningPlayerIndex].wonSirs++;

    // Start a new trick
    return {
      ...gameState,
      players: updatedPlayers,
      currentTrick: [],
      leadingSuit: null,
      currentPlayerIndex: winningPlayerIndex,
      gamePhase: gameState.players[0].hand.length === 0 ? 'scoring' : 'playing',
    };
  }

  // Continue the current trick
  return {
    ...gameState,
    players: updatedPlayers,
    currentTrick: updatedTrick,
    leadingSuit,
    currentPlayerIndex: nextPlayerIndex,
  };
}

function determineWinningCard(trick: Card[], trumpSuit: Suit, leadingSuit: Suit): Card {
  const trumpCards = trick.filter(card => card.suit === trumpSuit);
  if (trumpCards.length > 0) {
    return trumpCards.reduce((highest, card) => 
      compareCards(card, highest, trumpSuit) > 0 ? card : highest
    );
  }

  const leadingSuitCards = trick.filter(card => card.suit === leadingSuit);
  return leadingSuitCards.reduce((highest, card) => 
    compareCards(card, highest, leadingSuit) > 0 ? card : highest
  );
}

function compareCards(card1: Card, card2: Card, trumpSuit: Suit): number {
  if (card1.suit === trumpSuit && card2.suit !== trumpSuit) return 1;
  if (card1.suit !== trumpSuit && card2.suit === trumpSuit) return -1;
  if (card1.suit !== card2.suit) return 0;
  return Object.values(Rank).indexOf(card1.rank) - Object.values(Rank).indexOf(card2.rank);
}

export function scoreRound(gameState: GameState): GameState {
  const updatedPlayers = gameState.players.map(player => ({
    ...player,
    score: player.score + calculateScore(player.declaredSirs, player.wonSirs),
    declaredSirs: 0,
    wonSirs: 0,
  }));

  const nextRound = gameState.currentRound + 1;
  const nextCardsPerPlayer = gameState.cardsPerPlayer - 1;

  if (nextCardsPerPlayer < 2) {
    return {
      ...gameState,
      players: updatedPlayers,
      gamePhase: 'gameOver',
    };
  }

  const newDeck = shuffleDeck(createDeck());
  const hands = dealCards(newDeck, gameState.players.length, nextCardsPerPlayer);

  return {
    ...gameState,
    players: updatedPlayers.map((player, index) => ({ ...player, hand: hands[index] })),
    deck: newDeck,
    currentRound: nextRound,
    cardsPerPlayer: nextCardsPerPlayer,
    trumpSuit: null,
    currentTrick: [],
    leadingSuit: null,
    currentPlayerIndex: 0,
    gamePhase: 'declaring',
  };
}

function calculateScore(declared: number, won: number): number {
  if (declared === won) {
    return declared === 0 ? 10 : declared + 10;
  }
  return 0;
}

