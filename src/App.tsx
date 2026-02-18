import { GameProvider, useGame } from './hooks/useGame';
import { LobbyScreen } from './components/LobbyScreen';
import { GameBoard } from './components/GameBoard';

function GameContent() {
  const { gameState } = useGame();

  // If we have an active game state, show the board
  // Otherwise show the lobby (menu/waiting room)
  return gameState ? <GameBoard /> : <LobbyScreen />;
}

export default function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
