# Kingsir Development Log

## Architecture

- **Stack**: Vite + React + TypeScript, Firebase Realtime Database for multiplayer
- **Hosting**: Firebase Hosting, auto-deployed via GitHub Actions on push to main
- **Repo**: https://github.com/LuvJain/kingsir
- **Live**: https://kingsir.web.app
- **Card rendering**: CardMeister web component (real Bicycle-style card faces)
- **Animations**: Framer Motion with spring physics for card interactions

## Key Files

- `src/hooks/useGame.tsx` — game state management, AI turn processing, all player actions
- `src/game/gameLogic.ts` — core game rules: dealing, bidding validation, trick resolution, scoring
- `src/game/aiPlayer.ts` — AI bidding (probability-based), trump selection, card play
- `src/game/types.ts` — all type definitions (GameState, PlayerState, Card, etc.)
- `src/services/roomService.ts` — Firebase reads/writes with array normalization and sanitization
- `src/services/mockRoomService.ts` — in-memory mock for offline demo mode
- `src/components/Card.tsx` — CardMeister wrapper
- `src/components/PlayerHand.tsx` — hand layout with fan, overlap calculation, hover animations
- `src/components/PlayArea.tsx` — bidding panel, trump selection, played cards, trick result
- `src/components/Scoreboard.tsx` — top bar with scores, turn order, trump badge
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

### UI / Layout
- **`processAITurn` hoisting issue**: Was defined as a const arrow function after the useEffect that called it. Arrow functions don't hoist. Moved to a `useCallback` defined before the effect.

## Features Built

### Cards
- Real card faces via CardMeister web component (pips, court card illustrations)
- Responsive sizing: `clamp(68px, 18vw, 96px)` — works from 390px phones to desktop
- Spring hover animation: `stiffness: 400, damping: 15, mass: 0.5` with gold glow shadow
- Single animation layer (Framer Motion on wrapper only, no competing transforms)
- GPU compositing: `will-change: transform` and `translateZ(0)` for 60fps

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
- Playing (following): "You must follow Hearts if you have it. Trump is ♥ Hearts"
- Playing (leading): "You lead this trick, play any card"

### Scoreboard
- Turn order numbers (1st, 2nd, 3rd...) shown during playing phase
- Top bar never clips on mobile (`flex-shrink: 0`)
- `100dvh` for mobile browser chrome handling
- Score chips with active player highlight and "You" indicator

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

## Known Limitations / Future Ideas
- Configurable number of rounds (slider in lobby)
- No reconnection support if a player refreshes mid-game (roomCode lost from state)
- No spectator mode
- Chunk size warning (512KB JS) — could code-split
