# Implementation Plan

- [x] 1. Set up testing infrastructure
  - Install and configure fast-check for property-based testing
  - Set up Jest or Vitest test runner if not already configured
  - Create test file structure matching source files
  - _Requirements: All (testing foundation)_

- [x] 2. Implement and test core Card and Deck models
  - [x] 2.1 Verify Card model implementation
    - Ensure Card class has suit and rank properties
    - Verify toString() method works correctly
    - _Requirements: 5.5_

  - [x] 2.2 Write property test for deck completeness
    - **Property 1: Deck completeness**
    - **Validates: Requirements 1.2**

  - [x] 2.3 Verify Deck shuffle implementation
    - Ensure shuffle method randomizes card order
    - _Requirements: 1.2_

  - [x] 2.4 Write property test for equal card distribution
    - **Property 2: Equal card distribution**
    - **Validates: Requirements 1.3, 1.4**

  - [x] 2.5 Write property test for remaining cards constraint
    - **Property 3: Remaining cards constraint**
    - **Validates: Requirements 1.4**

  - [x] 2.6 Write unit tests for Deck operations
    - Test deck creation produces 52 cards
    - Test dealing with various player counts
    - _Requirements: 1.2, 1.3_

- [x] 3. Implement and test Player model
  - [x] 3.1 Verify Player model implementation
    - Ensure all properties (name, hand, declaredSirs, wonSirs, score) exist
    - Verify addToHand, playCard, hasCard, resetForNewRound methods
    - _Requirements: 2.1, 4.2, 6.5_

  - [x] 3.2 Write unit tests for Player operations
    - Test adding cards to hand
    - Test playing cards from hand
    - Test hasCard suit checking
    - Test resetForNewRound clears state
    - _Requirements: 2.1, 4.2, 6.5_

- [x] 4. Implement and test game initialization and round management
  - [x] 4.1 Verify GameManager constructor and startNewRound
    - Ensure proper initialization of all game state properties
    - Verify round progression logic
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.2 Write property test for round progression formula
    - **Property 4: Round progression formula**
    - **Validates: Requirements 1.5, 7.1**

  - [x] 4.3 Write property test for round state cleanup
    - **Property 22: Round state cleanup**
    - **Validates: Requirements 7.4, 7.5**

  - [x] 4.4 Write property test for starting player rotation
    - **Property 23: Starting player rotation**
    - **Validates: Requirements 7.2, 9.4**

  - [x] 4.5 Write unit tests for game initialization
    - Test initialization with 3, 4, 5, 6 players
    - Test first round deals correct number of cards
    - Test game termination condition
    - _Requirements: 1.1, 1.4, 7.3_

- [x] 5. Implement and test bidding phase
  - [x] 5.1 Verify declareSirs implementation
    - Ensure bid validation logic is correct
    - Verify highest bidder tracking
    - Verify bidding completion detection
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 5.2 Write property test for bid validation
    - **Property 5: Bid validation**
    - **Validates: Requirements 2.1**

  - [x] 5.3 Write property test for last bidder restriction
    - **Property 6: Last bidder restriction**
    - **Validates: Requirements 2.2**

  - [x] 5.4 Write property test for highest bidder identification
    - **Property 7: Highest bidder identification**
    - **Validates: Requirements 2.3**

  - [x] 5.5 Write property test for bidding order
    - **Property 26: Bidding order**
    - **Validates: Requirements 9.3**

  - [x] 5.6 Write unit tests for bidding edge cases
    - Test zero bid acceptance
    - Test all players bidding same amount
    - _Requirements: 2.5_

- [x] 6. Implement and test trump suit selection
  - [x] 6.1 Verify setTrumpSuit implementation
    - Ensure trump suit is set correctly
    - Verify highest bidder becomes first player
    - Verify phase transition to playing
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 6.2 Write property test for trump suit assignment
    - **Property 8: Trump suit assignment**
    - **Validates: Requirements 3.1, 3.3**

  - [x] 6.3 Write unit tests for trump selection
    - Test only valid suits are accepted
    - Test phase transition after trump selection
    - _Requirements: 3.2, 3.4_

- [x] 7. Implement and test card playing mechanics
  - [x] 7.1 Verify playCard implementation
    - Ensure turn validation works
    - Verify follow suit enforcement
    - Verify leading suit establishment
    - Verify off-suit play when unable to follow
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 7.2 Write property test for turn enforcement
    - **Property 9: Turn enforcement**
    - **Validates: Requirements 4.1**

  - [x] 7.3 Write property test for follow suit rule
    - **Property 10: Follow suit rule**
    - **Validates: Requirements 4.2**

  - [x] 7.4 Write property test for leading suit establishment
    - **Property 11: Leading suit establishment**
    - **Validates: Requirements 4.3**

  - [x] 7.5 Write property test for off-suit play flexibility
    - **Property 12: Off-suit play when unable to follow**
    - **Validates: Requirements 4.4**

  - [x] 7.6 Write property test for turn advancement
    - **Property 25: Turn advancement**
    - **Validates: Requirements 9.2**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement and test trick resolution
  - [x] 9.1 Verify resolveHand implementation
    - Ensure correct winner determination
    - Verify wonSirs increment
    - Verify winner leads next trick
    - _Requirements: 4.5, 5.1, 5.2, 5.3, 5.4, 9.1_

  - [x] 9.2 Verify isWinningCard and compareCards implementations
    - Ensure trump superiority logic is correct
    - Verify rank comparison logic
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 9.3 Write property test for trump superiority
    - **Property 13: Trump superiority**
    - **Validates: Requirements 5.1**

  - [x] 9.4 Write property test for trump rank comparison
    - **Property 14: Trump rank comparison**
    - **Validates: Requirements 5.2**

  - [x] 9.5 Write property test for leading suit rank comparison
    - **Property 15: Leading suit rank comparison**
    - **Validates: Requirements 5.3**

  - [x] 9.6 Write property test for off-suit cards cannot win
    - **Property 16: Off-suit cards cannot win**
    - **Validates: Requirements 5.4**

  - [x] 9.7 Write property test for card rank ordering
    - **Property 17: Card rank ordering**
    - **Validates: Requirements 5.5**

  - [x] 9.8 Write property test for trick winner leads next
    - **Property 24: Trick winner leads next**
    - **Validates: Requirements 9.1**

  - [x] 9.9 Write unit tests for trick resolution edge cases
    - Test single card hands
    - Test all players play same suit
    - _Requirements: 4.5_

- [x] 10. Implement and test scoring system
  - [x] 10.1 Verify scoreRound implementation
    - Ensure successful bid scoring is correct
    - Verify failed bid scoring is correct
    - Verify score accumulation
    - Verify state reset after scoring
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 10.2 Write property test for successful bid scoring
    - **Property 18: Successful bid scoring**
    - **Validates: Requirements 6.1**

  - [x] 10.3 Write property test for failed bid scoring
    - **Property 19: Failed bid scoring**
    - **Validates: Requirements 6.3**

  - [x] 10.4 Write property test for score accumulation
    - **Property 20: Score accumulation**
    - **Validates: Requirements 6.4**

  - [x] 10.5 Write property test for round state reset
    - **Property 21: Round state reset**
    - **Validates: Requirements 6.5**

  - [x] 10.6 Write unit tests for scoring edge cases
    - Test zero bid scoring (10 points)
    - Test maximum bid scoring
    - _Requirements: 6.2_

- [x] 11. Implement and test UI components
  - [x] 11.1 Verify KingsirGame component
    - Ensure phase management works correctly
    - Verify user interaction handlers
    - Coordinate animation state
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 11.2 Implement CardView component with professional design
    - Create clean, minimalist card design
    - Implement suit symbols (Hearts, Diamonds, Clubs, Spades)
    - Add rank display with clear typography
    - Apply rounded corners and shadows
    - Make responsive for different screen sizes
    - _Requirements: 10.3_

  - [x] 11.3 Verify PlayerHand component
    - Display cards in fan layout
    - Implement card selection with touch interactions
    - Trigger card throw animation on play
    - _Requirements: 8.3, 10.1_

  - [x] 11.4 Implement card throw animation
    - Use React Native Animated API with useNativeDriver
    - Animate card from hand to center (300-500ms duration)
    - Apply ease-out curve for natural deceleration
    - Add slight rotation during throw
    - Ensure 60fps performance on mobile
    - _Requirements: 10.1, 10.2, 10.5_

  - [x] 11.5 Verify PlayedCards component
    - Display cards in center pile with appealing arrangement
    - Handle incoming card animations
    - Position cards appropriately
    - _Requirements: 8.2, 10.4_

  - [x] 11.6 Verify Scoreboard component
    - Ensure all player scores are displayed
    - Verify winner display at game end
    - _Requirements: 8.1, 8.5_

  - [x] 11.7 Write property test for UI state reflection
    - **Property 27: UI state reflection**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [x] 11.8 Write property test for winner determination
    - **Property 28: Winner determination**
    - **Validates: Requirements 8.5**

  - [x] 11.9 Write property test for card animation completion
    - **Property 29: Card animation completion**
    - **Validates: Requirements 10.1, 10.2**

  - [x] 11.10 Write property test for card visual consistency
    - **Property 30: Card visual consistency**
    - **Validates: Requirements 10.3**

  - [x] 11.11 Write unit tests for UI components
    - Test component rendering with various game states
    - Test user interaction handlers
    - Test animation triggers
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2, 10.3_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Integration testing
  - [x] 13.1 Write integration test for complete game flow
    - Test full game from initialization to completion
    - Verify multi-round progression
    - Test all phase transitions
    - _Requirements: All_

  - [x] 13.2 Write integration test for edge case scenarios
    - Test game with 3 players
    - Test game with 6 players
    - Test game with all zero bids
    - _Requirements: 1.1, 2.5_
