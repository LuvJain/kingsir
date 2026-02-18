# Kingsir Development Log

## Architecture

- **Stack**: Vite + React + TypeScript, Firebase Realtime Database for multiplayer
- **Hosting**: Firebase Hosting, auto-deployed via GitHub Actions on push to main
- **Repo**: https://github.com/LuvJain/kingsir
- **Live**: https://kingsir.web.app
- **Card rendering**: `@letele/playing-cards` (SVG React components, Adrian Kennard designs)
- **Animations**: Framer Motion with spring physics for card interactions

## Key Files

- `src/hooks/useGame.tsx` — game state management, AI turn processing, all player actions
- `src/game/gameLogic.ts` — core game rules: dealing, bidding validation, trick resolution, scoring, round progression
- `src/game/aiPlayer.ts` — AI bidding (probability-based), trump selection, card play
- `src/game/types.ts` — all type definitions (GameState, PlayerState, Card, etc.)
- `src/services/roomService.ts` — Firebase reads/writes with array normalization and sanitization
- `src/services/mockRoomService.ts` — in-memory mock for offline demo mode
- `src/components/Card.tsx` — SVG card component wrapper (`@letele/playing-cards`)
- `src/components/PlayerHand.tsx` — hand layout with fan, riffle + swipe-to-throw touch gestures, hover animations
- `src/components/PlayArea.tsx` — bidding panel, trump selection, played cards, trick result, bids strip
- `src/components/Scoreboard.tsx` — top bar with scores, turn order, trump badge, dynamic round count
- `src/components/LobbyScreen.tsx` — home screen, waiting room, How to Play
- `src/components/GameBoard.tsx` — layout shell: Scoreboard + PlayArea + PlayerHand

## Bugs Fixed

### Firebase / Multiplayer
- **`undefined` fields crash**: Firebase rejects `undefined`. Human players had `aiDifficulty: undefined` which crashed `startGame`. Fixed with `sanitizeGameState` that strips undefined fields on every write.
- **Array-to-object conversion**: Firebase converts `[]` to `{}` and drops empty arrays entirely. `normalizeGameState` converts them back on read; `sanitizeGameState` writes empty arrays as `{}` to preserve the key.
- **`playedCards.map` crash**: `playedCards` came back as `undefined` from Firebase (empty array dropped). Normalization now always returns `[]`.
- **AI turns only ran on host**: The `isHost` guard meant only the room creator ran AI logic. If host disconnected or refreshed, AI stopped. Fixed: every human client runs AI turns with an optimistic guard (checks state hasn't already advanced before writing) to prevent double-moves.
- **AI lock race condition**: `aiProcessingRef` was reset in `finally` after `await updateGameState`, but by then Firebase's `onValue` had already fired and skipped because the lock was still true. Fixed: release lock before the Firebase write.
- **`trickResult` never advancing (online)**: The auto-advance timer only existed inside `processAITurn`. When a human played the last card, `trickResult` phase stuck forever. Fixed: `handlePlayCard` now also sets a 3-second auto-advance timer.
- **`handleAcknowledgeResult` was a no-op**: The Continue button did nothing. Now calls `advanceAfterTrick`.

### Mock Room Service (Demo Mode)
- **Bots not showing in lobby**: `mockRoomService` mutated the same room object in place. React's useState saw the same reference and skipped re-render. Fixed: every mutation creates a new object with spread.

### AI Logic
- **`aiPlayCard` returning undefined**: The `needMoreTricks` branch had no fallback when off-suit with no trump. The function fell through and returned `undefined`, breaking the game. Added `getHighestCard(validCards)` as final fallback.
- **Easy bot bidding 13/13**: Used pure `Math.random() * (cardsPerPlayer + 1)` — could bid any number. Replaced with probability-based hand evaluation across all difficulties.

### Game Logic
- **Game never ending (round 14/13 crash)**: `calculateCardsPerPlayer` used `Math.max(1, ...)` which prevented cards from ever reaching 0, so the `< 1` end condition in `startNextRound` never triggered. The game looped forever at 1 card per round. Fixed: removed `Math.max(1, ...)` and changed end condition to `currentRound >= getTotalRounds(numPlayers)`. Added guard to prevent double-advance.

### UI / Layout
- **`processAITurn` hoisting issue**: Was defined as a const arrow function after the useEffect that called it. Arrow functions don't hoist. Moved to a `useCallback` defined before the effect.

## Features Built

### Cards
- SVG card faces via `@letele/playing-cards` (Adrian Kennard designs, individual React SVG components)
- Replaced CardMeister web component CDN dependency with self-hosted npm package
- Clear visual distinction between spades and clubs at all sizes
- Responsive sizing: `clamp(68px, 18vw, 96px)` for hand, `clamp(58px, 13vw, 88px)` for played
- Spring hover animation: `stiffness: 400, damping: 15, mass: 0.5` with gold glow shadow
- Single animation layer (Framer Motion on wrapper only, no competing transforms)
- GPU compositing: `will-change: transform` and `translateZ(0)` for 60fps

### Mobile-First Hand (Balatro-style)
- All cards always visible with dynamic overlap — no scrolling, fits any screen width
- Dual touch gesture system with direction detection (8px threshold):
  - **Horizontal slide = riffle**: slide finger across fan, cards pop up with spring animation as finger passes over, neighbors get subtle lift wave
  - **Vertical swipe = throw**: drag card upward, it follows finger with elastic feel, release past 50px to play with spring throw animation (y: -220, random rotation)
- Desktop keeps full hover interaction with spring physics
- Stale closure prevention: throw offset tracked via ref for accurate release detection

### Played Cards Visual Feedback
- Leading card: player name turns blue with "· lead" text suffix
- Trump cards (when ruffing only, not when following trump lead): player name turns gold with "· trump" suffix + subtle shake animation
- Text-based indicators instead of box-shadow glows — cleaner at all sizes on mobile

### AI Bidding (Intelligent)
- Probability-based hand evaluation before trump is known
- Aces: 1.0 expected trick, Kings: 0.5-0.75 (depends on suit length), Queens: 0.25-0.4
- Ruffing potential: void = +1.0, singleton = +0.5, doubleton = +0.2
- Long suit bonus: 5+ cards = extra winners from suit establishment
- Difficulty controls noise: easy (heavy noise, 40% accuracy), medium (moderate, 75%), hard (tiny noise, accurate)

### Bot Names
- Easy: Mom, Nani, Dadi
- Medium: Viraj, Bhai, Yaar
- Hard: Dadi, Papa, Chacha
- Falls back to "Bot N" if names are taken

### How to Play (Collapsible)
- Conversational tone, answers real questions from playtesting:
  - "What is a sir?" / "So what is bidding?" / "What is trump?" / "How does playing work?" / "Scoring"
- Shows on both home screen and waiting room
- Gold left-border styling, animated expand/collapse

### In-Game Hints (phase-hint)
- Bidding: "Pick how many rounds you think you will win. Hit that number exactly to score points"
- Last bidder: "You're last. Bidding X is not allowed since bids can't add up to Y"
- Trump selection: "Pick your strongest suit. Trump cards beat everything else."
- Playing (following): "You must follow Hearts if you have it. Trump is [symbol] Hearts"
- Playing (leading): "You lead this trick, play any card. Trump is [symbol] Hearts"
- Trump suit now always shown in hint, even when leading

### Bids Strip (During Play)
- Compact bids overlay at top of play area during playing/trickResult phases
- Shows each player's tricks won vs bid (e.g. "You: 2/3", "Mom: 1/1 ✓")
- Frosted glass background, always visible on mobile where scoreboard may be clipped

### Scoreboard
- Dynamic "Round X of Y" (calculates from player count, not hardcoded 13)
- Turn order numbers (1st, 2nd, 3rd...) shown during playing phase
- `position: sticky` with safe-area-inset-top for mobile browsers
- Score chips with active player highlight and "You" indicator
- `100dvh` for mobile browser chrome handling

### Your Turn Indicator
- Pulse animation to draw attention when it's your turn

### Chrome Mobile Layout Fix
- Hand area uses `flex-shrink: 1` so scoreboard at top is never pushed off-screen
- Removed fixed min-heights that caused dead space below the hand
- Tightened padding on hand-area, status-bar, and game-top-bar for mobile
- `safe-area-inset-bottom` on hand-area only (not game-board) to avoid double-padding

### Game Over Screen
- Mobile-optimized with card background, max-width container
- Responsive title with `clamp()` sizing
- Sorted final scores with winner highlighted in gold row
- "Play Again" button (reloads to lobby)

### Round End
- Shows "Final Round Complete" on last round (instead of "Round 13 Complete")
- "See Final Results" button on last round (instead of "Next Round")

### Lobby
- Animated floating card suits (♠♥♦♣) background on home and waiting room
- Tagline: "Bid your sirs. Hit your number. Beat everyone else."
- "Need at least 3 players to start" as plain text instead of faded disabled button

### Played Cards Area
- `flex-wrap` and `clamp()` sizing so 6 cards always fit on mobile
- Trick result text inline below cards (not floating overlay)

### Deployment
- Firebase Hosting via GitHub Actions (auto-deploy on push to main)
- `npm ci` added to workflow (was missing, caused build failures)
- Firebase env vars stored as GitHub secrets, read via `import.meta.env.VITE_*`
- `.env` gitignored, `.env.example` committed with placeholders

### Dev Tools
- `?skipToRound=12` URL param to skip to late rounds for testing game ending
- Random scores generated when skipping ahead

## Known Limitations / Future Ideas
- Configurable number of rounds (slider in lobby)
- No reconnection support if a player refreshes mid-game (roomCode lost from state)
- No spectator mode
- Bundle size ~992KB (SVG card components are large). Could code-split or lazy-load cards
- Error boundary / crash reporting for production
