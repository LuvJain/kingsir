# Design Document

## Overview

The Kingsir game is a multiplayer trick-taking card game built with React Native and TypeScript. The architecture follows object-oriented principles with clear separation between game logic (models), business rules (game manager), utility functions, and UI components. The game supports 3-6 players and progresses through multiple rounds with decreasing hand sizes, featuring strategic bidding and trump suit mechanics.

**Key Design Decision - Card Distribution**: The game deals cards as evenly as possible from a shuffled 52-card deck each round. Any remaining cards that cannot be evenly distributed are set aside and not used in that round. For the next round, a fresh deck is shuffled, ensuring randomness across rounds. This design choice maintains fairness while accommodating variable player counts.

## Architecture

The system follows a layered architecture:

1. **Model Layer**: Core domain objects (Card, Deck, Player) that represent game entities
2. **Game Logic Layer**: GameManager class that orchestrates game flow and enforces rules
3. **Utility Layer**: Pure functions for deck operations and game logic calculations
4. **UI Layer**: React Native components that render game state and handle user interactions. This should be very buttery smooth and mobile friendly so you have animations of cards being thrown as if you are throwing cards in a center pile with friends and playing with others. The animations and card design should be immaculate, clean, and professional. 

The GameManager serves as the central controller, maintaining game state and coordinating between models. The UI layer observes game state changes and dispatches user actions to the GameManager.

## Components and Interfaces

### Core Models

**Card**
- Properties: `suit: Suit`, `rank: Rank`
- Methods: `toString(): string`
- Enums: `Suit` (Hearts, Diamonds, Clubs, Spades), `Rank` (2-10, J, Q, K, A)

**Deck**
- Properties: `cards: Card[]` (private)
- Methods:
  - `constructor()`: Creates a standard 52-card deck
  - `shuffle(): void`: Randomizes card order using Fisher-Yates algorithm
  - `deal(numPlayers: number, cardsPerPlayer: number): Card[][]`: Distributes cards to players, dealing as many complete hands as possible
  - `getRemainingCards(): number`: Returns count of cards not dealt (for validation)

**Player**
- Properties: `name: string`, `hand: Card[]`, `declaredSirs: number`, `wonSirs: number`, `score: number`
- Methods:
  - `addToHand(cards: Card[]): void`: Adds cards to player's hand
  - `playCard(card: Card): Card`: Removes and returns a card from hand
  - `hasCard(suit: string): boolean`: Checks if player has a card of given suit
  - `resetForNewRound(): void`: Clears hand and resets round-specific state

### Game Manager

**GameManager**
- Properties:
  - `players: Player[]`: Array of all players
  - `deck: Deck`: Current deck instance
  - `currentRound: number`: Current round number (1-13)
  - `maxRounds: number`: Maximum rounds (13)
  - `trumpSuit: Suit | null`: Selected trump suit
  - `currentPlayerIndex: number`: Index of player whose turn it is
  - `playedCards: Card[]`: Cards played in current trick
  - `leadingSuit: Suit | null`: Suit of first card in current trick
  - `biddingComplete: boolean`: Whether all players have bid
  - `highestBidder: number | null`: Index of player with highest bid
  - `handsInRound: number`: Number of tricks in current round
  - `currentHand: number`: Current trick number within round

- Methods:
  - `startNewRound(): void`: Initializes a new round with appropriate card distribution. Creates a fresh shuffled deck and deals cards evenly, with any remainder set aside
  - `declareSirs(playerIndex: number, sirs: number): boolean`: Records player's bid, validates against rules
  - `setTrumpSuit(suit: Suit): void`: Sets trump suit after bidding
  - `playCard(playerIndex: number, card: Card): boolean`: Processes card play, validates rules
  - `resolveHand(): void` (private): Determines trick winner and updates state
  - `isWinningCard(card: Card, currentWinningCard: Card, leadingSuit: Suit): boolean` (private): Compares cards
  - `compareCards(card1: Card, card2: Card): number` (private): Compares ranks
  - `scoreRound(): void`: Calculates and awards points
  - `isGameOver(): boolean`: Checks if all rounds are complete
  - `calculateCardsPerPlayer(round: number, numPlayers: number): number` (private): Determines how many cards each player receives based on round and player count

### UI Components

**KingsirGame** (Main Component)
- Manages game lifecycle and phase transitions
- Handles user interactions (bidding, trump selection, card play)
- Renders child components based on game phase
- Coordinates animation state across components

**PlayerHand**
- Displays current player's cards in a fan layout
- Handles card selection with touch/tap interactions
- Triggers card throw animation on play

**PlayedCards**
- Shows cards played in current trick
- Manages card positioning in center pile
- Handles incoming card animations

**Scoreboard**
- Displays all players' scores and declared/won sirs

**CardView**
- Renders individual card with professional design
- Supports animation transforms (position, rotation, scale)
- Optimized for mobile performance

### Animation System

**Design Rationale**: Animations should feel natural and responsive, mimicking the physical experience of throwing cards onto a table. The system uses React Native's Animated API for smooth 60fps performance.

**Card Throw Animation**:
- Duration: 300-500ms for optimal feel
- Easing: Ease-out curve for natural deceleration
- Transform: Translate from hand position to center, with slight rotation
- Stagger: When multiple cards are played, slight delay between animations

**Card Design**:
- Clean, minimalist aesthetic with clear suit symbols
- High contrast for readability
- Rounded corners for modern feel
- Shadow/elevation for depth
- Responsive sizing for different screen sizes

**Performance Considerations**:
- Use `useNativeDriver: true` for transform animations
- Avoid layout animations during card play
- Optimize re-renders with React.memo
- Preload card assets

## Data Models

### Game State

The game state is primarily managed by the GameManager instance, which contains:

```typescript
{
  players: Player[],           // All players with their hands and scores
  deck: Deck,                  // Current deck instance
  currentRound: number,        // 1-13
  maxRounds: number,           // 13
  trumpSuit: Suit | null,      // Selected trump or null during bidding
  currentPlayerIndex: number,  // Whose turn it is
  playedCards: Card[],         // Cards in current trick
  leadingSuit: Suit | null,    // First card's suit in trick
  biddingComplete: boolean,    // All players have bid
  highestBidder: number | null, // Index of highest bidder
  handsInRound: number,        // Tricks per round
  currentHand: number          // Current trick number
}
```

### Card Distribution Logic

**Design Rationale**: Each round uses a fresh shuffled deck to ensure randomness and prevent card counting across rounds. Cards are distributed evenly based on the formula:
- `cardsPerPlayer = Math.floor(52 / numPlayers)` for round 1
- Subsequent rounds reduce by 1 card per player
- Remaining cards after even distribution are not used in that round

**Examples**:
- 4 players, round 1: Each gets 13 cards (52/4 = 13), 0 remaining
- 5 players, round 1: Each gets 10 cards (52/5 = 10.4 → 10), 2 cards remain unused
- 3 players, round 1: Each gets 17 cards (52/3 = 17.33 → 17), 1 card remains unused

### Game Phases

The game progresses through distinct phases:
1. **Setup**: Initialize players and game
2. **Bidding**: Players declare expected sirs
3. **Trump Selection**: Highest bidder chooses trump suit
4. **Playing**: Players play cards in tricks
5. **Scoring**: Calculate points and transition to next round or end game

## Cor
rectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Deck completeness
*For any* new round initialization, the created deck should contain exactly 52 unique cards (13 ranks × 4 suits).
**Validates: Requirements 1.2**

### Property 2: Equal card distribution
*For any* valid player count and round number, dealing cards should result in each player having the same number of cards, with the number being floor(52 / numPlayers) for round 1, decreasing by 1 each subsequent round.
**Validates: Requirements 1.3, 1.4**

### Property 3: Remaining cards constraint
*For any* card distribution, the number of remaining cards should be less than the number of players (ensuring even distribution).
**Validates: Requirements 1.4**

### Property 4: Round progression formula
*For any* round N where N > 1, the number of cards dealt per player should be one less than in round N-1.
**Validates: Requirements 1.5, 7.1**

### Property 5: Bid validation
*For any* player with a hand of size H, declaring sirs should accept values in range [0, H] and reject values outside this range.
**Validates: Requirements 2.1**

### Property 6: Last bidder restriction
*For any* game state where the last player is bidding, if their bid B would make the total declared sirs equal to the number of hands in the round, then B should be rejected.
**Validates: Requirements 2.2**

### Property 7: Highest bidder identification
*For any* set of player bids after bidding is complete, the system should correctly identify the player with the maximum declared sirs as the highest bidder.
**Validates: Requirements 2.3**

### Property 8: Trump suit assignment
*For any* valid suit selection by the highest bidder, the trump suit should be set to that suit and the current player should be set to the highest bidder.
**Validates: Requirements 3.1, 3.3**

### Property 9: Turn enforcement
*For any* card play attempt by player P, the play should only succeed if P is the current player.
**Validates: Requirements 4.1**

### Property 10: Follow suit rule
*For any* player P with cards of the leading suit L in their hand, attempting to play a card of a different suit should be rejected.
**Validates: Requirements 4.2**

### Property 11: Leading suit establishment
*For any* first card played in a trick, that card's suit should become the leading suit for that trick.
**Validates: Requirements 4.3**

### Property 12: Off-suit play when unable to follow
*For any* player P without cards of the leading suit, playing any card from their hand should be accepted.
**Validates: Requirements 4.4**

### Property 13: Trump superiority
*For any* trick containing at least one trump card and at least one non-trump card, the winning card should be a trump card.
**Validates: Requirements 5.1**

### Property 14: Trump rank comparison
*For any* trick containing multiple trump cards, the winning card should be the trump card with the highest rank.
**Validates: Requirements 5.2**

### Property 15: Leading suit rank comparison
*For any* trick containing no trump cards, the winning card should be the leading suit card with the highest rank.
**Validates: Requirements 5.3**

### Property 16: Off-suit cards cannot win
*For any* trick, a card that is neither trump nor leading suit should never be the winning card.
**Validates: Requirements 5.4**

### Property 17: Card rank ordering
*For any* two cards C1 and C2 of the same suit, comparing their ranks should follow the standard ordering: 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A.
**Validates: Requirements 5.5**

### Property 18: Successful bid scoring
*For any* player P where P.wonSirs equals P.declaredSirs, the points awarded should equal P.declaredSirs + 10.
**Validates: Requirements 6.1**

### Property 19: Failed bid scoring
*For any* player P where P.wonSirs does not equal P.declaredSirs, the points awarded for that round should be 0.
**Validates: Requirements 6.3**

### Property 20: Score accumulation
*For any* round completion, all players should have their scores updated based on their declared vs won sirs.
**Validates: Requirements 6.4**

### Property 21: Round state reset
*For any* new round initialization, all players should have their declaredSirs and wonSirs reset to 0 (or -1 for unset).
**Validates: Requirements 6.5**

### Property 22: Round state cleanup
*For any* new round initialization, the trump suit should be null, played cards should be empty, and leading suit should be null.
**Validates: Requirements 7.4, 7.5**

### Property 23: Starting player rotation
*For any* round N, the starting player index should be (N - 1) mod (number of players).
**Validates: Requirements 7.2, 9.4**

### Property 24: Trick winner leads next
*For any* completed trick, the player who won that trick should become the current player for the next trick.
**Validates: Requirements 9.1**

### Property 25: Turn advancement
*For any* card play that doesn't complete a trick, the current player index should advance by 1 (modulo number of players).
**Validates: Requirements 9.2**

### Property 26: Bidding order
*For any* bidding phase, players should declare sirs in sequential order starting from the designated starting player.
**Validates: Requirements 9.3**

### Property 27: UI state reflection
*For any* game state, the displayed information should include all player names, scores, the current player's hand, and played cards in the current trick.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 28: Winner determination
*For any* completed game, the displayed winner should be the player with the highest total score.
**Validates: Requirements 8.5**

### Property 29: Card animation completion
*For any* card play action, the card should complete its animation before the next game state update occurs.
**Validates: Requirements 10.1, 10.2**

### Property 30: Card visual consistency
*For any* rendered card, it should display the correct suit symbol and rank with professional styling.
**Validates: Requirements 10.3**

## Error Handling

### Input Validation Errors
- **Invalid player count**: Reject game initialization with fewer than 3 or more than 6 players
- **Invalid bid**: Reject bids outside the range [0, hand size]
- **Last player restriction**: Reject last player's bid if it makes total equal to hands in round
- **Invalid trump suit**: Reject trump suit selections that aren't one of the four standard suits

### Game State Errors
- **Out of turn play**: Reject card plays when it's not the player's turn
- **Card not in hand**: Reject attempts to play cards not in the player's hand
- **Follow suit violation**: Reject plays that don't follow suit when the player has cards of the leading suit
- **Invalid phase transition**: Prevent actions that don't match the current game phase

### Edge Cases
- **Zero bid**: Allow and correctly score zero sir declarations
- **All players bid same amount**: Handle tie-breaking for highest bidder (first bidder wins)
- **Game termination**: Correctly detect when cards per player would be less than 2
- **Single card hands**: Handle rounds where players have only one card
- **Uneven card distribution**: When 52 cards cannot be evenly divided (e.g., 5 players), properly handle remaining cards by setting them aside
- **Variable player counts**: Ensure card distribution formula works correctly for all valid player counts (3-6)

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

- **Deck creation**: Verify a new deck has 52 cards with correct distribution
- **Shuffle randomness**: Verify shuffle produces different orderings
- **Boundary conditions**: Test with 3 and 6 players, first and last rounds
- **Zero bid scoring**: Verify zero bid awards 10 points when successful
- **Last player restriction**: Test that last player cannot make total equal hands
- **Game termination**: Test game ends at the correct round
- **Card comparison edge cases**: Test Ace beats King, 2 loses to 3, etc.

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (JavaScript/TypeScript property testing library):

- Each property-based test MUST run a minimum of 100 iterations
- Each test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: kingsir-game, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Property test coverage**:
- **Deck and dealing properties** (Properties 1-4): Test deck completeness, equal distribution, remaining cards constraint, round progression
- **Bidding properties** (Properties 5-7): Test bid validation, last player restriction, highest bidder identification
- **Trump and phase properties** (Property 8): Test trump assignment, phase transitions
- **Card play properties** (Properties 9-12): Test turn enforcement, follow suit rule, leading suit establishment, off-suit flexibility
- **Trick resolution properties** (Properties 13-17): Test trump superiority, rank comparisons, winner determination
- **Scoring properties** (Properties 18-21): Test successful/failed bid scoring, score accumulation, round state reset
- **State management properties** (Properties 22-26): Test round cleanup, starting player rotation, trick winner leads, turn advancement, bidding order
- **UI properties** (Properties 27-28): Test that rendered output contains required game state information and winner determination
- **Animation properties** (Properties 29-30): Test animation completion timing, card visual rendering

### Integration Testing

Integration tests will verify end-to-end game flows:

- Complete game from initialization to final scoring
- Multi-round progression with state transitions
- Player interactions across all game phases
- UI component integration with game manager

### Test Organization

Tests will be co-located with source files using `.test.ts` suffix:
- `src/models/Card.test.ts`
- `src/models/Deck.test.ts`
- `src/models/Player.test.ts`
- `src/models/GameManager.test.ts`
- `src/utils/gameLogic.test.ts`

Property-based tests will be clearly marked and separated from unit tests within each test file.
