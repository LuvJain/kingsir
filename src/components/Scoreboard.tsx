import { useGame } from '../hooks/useGame';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../game/types';

export function Scoreboard() {
    const { gameState, playerId } = useGame();

    if (!gameState) return null;

    return (
        <div className="game-top-bar">
            {/* Left: Round Info */}
            <div className="game-round-info">
                Round <span>{gameState.currentRound}</span> of 13
                {gameState.trumpSuit && (
                    <div className="game-trump-badge" style={{
                        marginLeft: 16,
                        padding: '4px 12px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                        <span
                            className="game-trump-symbol"
                            style={{
                                color: SUIT_COLORS[gameState.trumpSuit],
                                fontSize: 20,
                                marginRight: 6,
                                textShadow: '0 0 10px rgba(0,0,0,0.5)'
                            }}
                        >
                            {SUIT_SYMBOLS[gameState.trumpSuit]}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>
                            {gameState.trumpSuit.toUpperCase()}
                        </span>
                    </div>
                )}
            </div>

            {/* Center: Scores & Bids */}
            <div className="scoreboard">
                {gameState.players.map(p => {
                    const isMe = p.id === playerId;
                    const isTurn = gameState.currentPlayerIndex >= 0 &&
                        gameState.players[gameState.currentPlayerIndex]?.id === p.id;
                    const bid = p.bid >= 0 ? p.bid : '-';
                    const won = p.tricksWon;
                    const hit = p.bid >= 0 && p.bid === p.tricksWon;

                    return (
                        <div
                            key={p.id}
                            className={`score-item ${isTurn ? 'score-item-active' : ''}`}
                            style={{
                                border: isMe ? '1px solid rgba(255, 255, 255, 0.15)' : undefined,
                                background: isMe ? 'rgba(255, 255, 255, 0.08)' : undefined
                            }}
                        >
                            <span className="score-name">{isMe ? 'You' : p.name}</span>
                            <span className="score-value">{p.score}</span>
                            <span className="score-bid-info">
                                ({won}/{bid})
                                {p.bid >= 0 && hit && <span style={{ color: 'var(--accent-green)', marginLeft: 2 }}>✓</span>}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Right: Room Code (Desktop only) */}
            <div className="desktop-only" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Code: {gameState.roomCode}
            </div>
        </div>
    );
}
