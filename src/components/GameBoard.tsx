import { useGame } from '../hooks/useGame';
import { Scoreboard } from './Scoreboard';
import { PlayArea } from './PlayArea';
import { PlayerHand } from './PlayerHand';

export function GameBoard() {
    const { gameState } = useGame();

    if (!gameState) return null;

    return (
        <div className="game-board">
            {/* Top Bar with Scoreboard */}
            <Scoreboard />

            {/* Main Play Area (Table Felt) */}
            <PlayArea />

            {/* Bottom Player Hand */}
            <PlayerHand />
        </div>
    );
}
