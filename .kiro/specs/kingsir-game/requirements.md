# Requirements Document

## Introduction

Kingsir is a multiplayer trick-taking card game where players bid on the number of tricks (called "sirs") they expect to win in each round. The game features strategic bidding, trump suit selection, and scoring based on accurate predictions. Players must follow suit when possible, and the highest bidder selects the trump suit that can override other suits during play.

## Glossary

- **System**: The Kingsir game application
- **Player**: A participant in the game
- **Sir**: A trick (set of cards played in one turn by all players) won by a player
- **Trump Suit**: The suit selected by the highest bidder that beats all other suits
- **Leading Suit**: The suit of the first card played in a trick
- **Round**: A complete cycle of dealing, bidding, trump selection, and playing all hands
- **Hand**: A single trick where each player plays one card
- **Bidding Phase**: The phase where players declare how many sirs they expect to win
- **Declaring**: The act of announcing how many sirs a player expects to win
- **Highest Bidder**: The player who declared the most sirs during the bidding phase

## Requirements

### Requirement 1

**User Story:** As a player, I want to start a new game with multiple players, so that we can play Kingsir together.

#### Acceptance Criteria

1. WHEN the game initializes THEN the System SHALL accept between 3 and 6 players
2. WHEN a new round starts THEN the System SHALL create a shuffled deck of 52 standard playing cards
3. WHEN dealing cards THEN the System SHALL distribute cards equally to all Players based on the current round number
4. WHEN the first round begins THEN the System SHALL deal 13 cards per Player in a 4-player game for example. If there are a different amount of people, then distribute as evenly as possible from a shuffled deck. The remaining cards are not known and are not in play, but will be shuffled back in for the next hand.
5. WHEN subsequent rounds begin THEN the System SHALL reduce the number of cards dealt by the round number

### Requirement 2

**User Story:** As a player, I want to declare how many sirs I expect to win, so that I can compete for points based on my prediction.

#### Acceptance Criteria

1. WHEN a Player declares sirs THEN the System SHALL accept a value between 0 and the number of cards in the Player's hand
2. WHEN the last Player to bid would make the total declared sirs equal to the number of hands in the round THEN the System SHALL reject that declaration
3. WHEN all Players have declared sirs THEN the System SHALL identify the Highest Bidder
4. WHEN bidding is complete THEN the System SHALL transition to trump suit selection by the highest bidder.
5. WHEN a Player declares zero sirs THEN the System SHALL accept this as a valid declaration

### Requirement 3

**User Story:** As the highest bidder, I want to select the trump suit, so that I can influence which cards will be most powerful during play.

#### Acceptance Criteria

1. WHEN the Highest Bidder selects a trump suit THEN the System SHALL set that suit as the Trump Suit for the round
2. WHEN the Trump Suit is selected THEN the System SHALL allow only Hearts, Diamonds, Clubs, or Spades
3. WHEN trump selection is complete THEN the System SHALL set the Highest Bidder as the first Player to play
4. WHEN the Trump Suit is set THEN the System SHALL transition to the playing phase

### Requirement 4

**User Story:** As a player, I want to play cards according to the rules, so that the game proceeds fairly and correctly.

#### Acceptance Criteria

1. WHEN a Player plays a card THEN the System SHALL verify it is that Player's turn
2. WHEN the Leading Suit is established and a Player has cards of that suit THEN the System SHALL require the Player to play a card of the Leading Suit
3. WHEN a Player plays the first card in a hand THEN the System SHALL set that card's suit as the Leading Suit
4. WHEN a Player has no cards of the Leading Suit THEN the System SHALL allow the Player to play any card from their hand
5. WHEN all Players have played a card THEN the System SHALL determine the winner of that hand

### Requirement 5

**User Story:** As a player, I want the system to correctly determine who wins each hand, so that sirs are awarded fairly.

#### Acceptance Criteria

1. WHEN determining the winning card and a Trump Suit card is played THEN the System SHALL rank Trump Suit cards higher than all other suits
2. WHEN multiple Trump Suit cards are played THEN the System SHALL determine the winner by comparing card ranks within the Trump Suit
3. WHEN no Trump Suit cards are played THEN the System SHALL determine the winner by comparing card ranks within the Leading Suit
4. WHEN a Player plays a card that is neither Trump Suit nor Leading Suit THEN the System SHALL not consider that card for winning
5. WHEN comparing card ranks THEN the System SHALL use the standard ranking: 2, 3, 4, 5, 6, 7, 8, 9, 10, Jack, Queen, King, Ace (ascending)

### Requirement 6

**User Story:** As a player, I want to receive points based on whether I achieved my declared sirs, so that accurate predictions are rewarded.

#### Acceptance Criteria

1. WHEN a Player's won sirs equals their declared sirs THEN the System SHALL award points equal to declared sirs plus 10
2. WHEN a Player declares zero sirs and wins zero sirs THEN the System SHALL award 10 points
3. WHEN a Player's won sirs does not equal their declared sirs THEN the System SHALL award zero points for that round
4. WHEN a round ends THEN the System SHALL calculate and update scores for all Players
5. WHEN scoring is complete THEN the System SHALL reset each Player's declared sirs and won sirs to zero for the next round

### Requirement 7

**User Story:** As a player, I want the game to progress through multiple rounds with decreasing hand sizes, so that the game has variety and strategic depth.

#### Acceptance Criteria

1. WHEN a round completes THEN the System SHALL start a new round with one fewer card per Player
2. WHEN starting a new round THEN the System SHALL rotate the starting Player position
3. WHEN the number of cards to deal becomes less than 2 per Player THEN the System SHALL end the game
4. WHEN a new round begins THEN the System SHALL reset the Trump Suit to null
5. WHEN a new round begins THEN the System SHALL clear all played cards and reset the Leading Suit

### Requirement 8

**User Story:** As a player, I want to see the current game state including scores, played cards, and my hand, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN viewing the game interface THEN the System SHALL display all Players' names and current scores
2. WHEN cards are played in a hand THEN the System SHALL display all played cards in the current trick
3. WHEN it is a Player's turn THEN the System SHALL display that Player's hand of cards
4. WHEN displaying game state THEN the System SHALL indicate whose turn it is
5. WHEN the game ends THEN the System SHALL display the winner based on the highest score

### Requirement 10

**User Story:** As a player, I want smooth, professional animations when playing cards, so that the game feels polished and engaging like playing with physical cards.

#### Acceptance Criteria

1. WHEN a Player plays a card THEN the System SHALL animate the card moving from the Player's hand to the center pile
2. WHEN a card is animated THEN the System SHALL use smooth transitions that mimic throwing a physical card
3. WHEN displaying cards THEN the System SHALL render them with clean, professional, and immaculate design
4. WHEN multiple cards are in the center pile THEN the System SHALL display them in a visually appealing arrangement
5. WHEN animations play THEN the System SHALL maintain buttery smooth performance on mobile devices

### Requirement 9

**User Story:** As a player, I want the game to enforce turn order, so that gameplay is fair and organized.

#### Acceptance Criteria

1. WHEN a hand is won THEN the System SHALL set the winning Player as the first to play in the next hand
2. WHEN a Player plays a card THEN the System SHALL advance to the next Player in clockwise order
3. WHEN bidding THEN the System SHALL proceed through Players in order starting from the designated starting Player
4. WHEN a round begins THEN the System SHALL set the starting Player based on the round number
5. WHEN the Highest Bidder is determined THEN the System SHALL set them as the first Player for the playing phase
