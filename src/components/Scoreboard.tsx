import { useGame } from '../hooks/useGame';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../game/types';
import { getTotalRounds } from '../game/gameLogic';

export function Scoreboard() {
    const { gameState, playerId } = useGame();

    if (!gameState) return null;

    const n = gameState.players.length;
    const cur = gameState.currentPlayerIndex;

    // Build turn order: who plays 1st, 2nd, 3rd... from current position
    const turnOrder: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
        turnOrder[gameState.players[(cur + i) % n].id] = i + 1;
    }

    const showOrder = gameState.phase === 'playing';

    return (
        <div className="game-top-bar">
            {/* Left: Round + Power Suit */}
            <div className="game-round-info">
                Round <span>{gameState.currentRound}</span> of {getTotalRounds(gameState.players.length)}
                {gameState.trumpSuit && (
                    <div className="game-trump-badge">
                        <span
                            className="game-trump-symbol"
                            style={{ color: SUIT_COLORS[gameState.trumpSuit] }}
                        >
                            {SUIT_SYMBOLS[gameState.trumpSuit]}
                        </span>
                        <span>TRUMP</span>
                    </div>
                )}
            </div>

            {/* Center: Scores, bids, turn order */}
            <div className="scoreboard">
                {gameState.players.map(p => {
                    const isMe = p.id === playerId;
                    const isTurn = gameState.players[cur]?.id === p.id;
                    const bid = p.bid >= 0 ? p.bid : '-';
                    const won = p.tricksWon;
                    const hit = p.bid >= 0 && p.bid === p.tricksWon;
                    const order = turnOrder[p.id];

                    return (
                        <div
                            key={p.id}
                            className={`score-item ${isTurn ? 'score-item-active' : ''} ${isMe ? 'score-item-me' : ''}`}
                        >
                            {showOrder && (
                                <span className="score-order">{order}</span>
                            )}
                            <span className="score-name">{isMe ? 'You' : p.name}</span>
                            <span className="score-value">{p.score}</span>
                            <span className="score-bid-info">
                                ({won}/{bid}){p.bid >= 0 && hit && <span className="score-hit">✓</span>}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Right: Room Code (Desktop only) */}
            <div className="desktop-only" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {gameState.roomCode}
            </div>
        </div>
    );
}
