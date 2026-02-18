import { motion, AnimatePresence } from 'framer-motion';
import { type Card as CardType } from '../game/types';
import { useGame } from '../hooks/useGame';
import { CardView } from './Card';

export function PlayerHand() {
    const { gameState, myPlayer, myPlayerIndex, playCard } = useGame();

    if (!gameState || !myPlayer) return null;

    const isMyTurn = gameState.currentPlayerIndex === myPlayerIndex;
    const isPlayPhase = gameState.phase === 'playing';
    const canPlay = isMyTurn && isPlayPhase;

    // Check which cards are valid to play
    const getIsPlayable = (card: CardType): boolean => {
        if (!canPlay) return false;
        if (!gameState.leadingSuit) return true; // leading, can play anything
        if (card.suit === gameState.leadingSuit) return true;
        // Can only play off-suit if we don't have leading suit
        const hasLeadingSuit = myPlayer.hand.some(c => c.suit === gameState.leadingSuit);
        return !hasLeadingSuit;
    };

    // Fan layout calculation
    const cardCount = myPlayer.hand.length;
    const maxFanAngle = Math.min(cardCount * 3, 30); // total spread angle
    const overlap = Math.min(65, 700 / Math.max(cardCount, 1)); // card overlap in px

    return (
        <div className="hand-area">
            {/* Status */}
            <div className="status-bar">
                {isPlayPhase && (
                    isMyTurn ? (
                        <span className="your-turn">🎴 Your turn — play a card</span>
                    ) : (
                        <span className="waiting">
                            Waiting for {gameState.players[gameState.currentPlayerIndex]?.name}...
                        </span>
                    )
                )}
                {gameState.phase === 'bidding' && (
                    isMyTurn ? (
                        <span className="your-turn">Your turn to bid</span>
                    ) : (
                        <span className="waiting">
                            {gameState.players[gameState.currentPlayerIndex]?.name} is bidding...
                        </span>
                    )
                )}
                {gameState.phase === 'trumpSelection' && (
                    gameState.highestBidderId === myPlayer.id ? (
                        <span className="your-turn">🏆 You won the bid! Pick trump</span>
                    ) : (
                        <span className="waiting">
                            {gameState.players.find(p => p.id === gameState.highestBidderId)?.name} is choosing trump...
                        </span>
                    )
                )}
                {gameState.phase === 'trickResult' && (
                    <span className="your-turn" style={{ color: gameState.trickWinnerId === myPlayer.id ? 'var(--gold)' : 'var(--text-secondary)' }}>
                        {gameState.trickWinnerId === myPlayer.id
                            ? 'You got the sir!'
                            : `${gameState.players.find(p => p.id === gameState.trickWinnerId)?.name} takes the sir`}
                    </span>
                )}
            </div>

            {/* Cards in hand */}
            <div className="hand-cards">
                <AnimatePresence mode="popLayout">
                    {myPlayer.hand.map((card, index) => {
                        const centerOffset = (cardCount - 1) / 2;
                        const offsetFromCenter = index - centerOffset;
                        const angle = (offsetFromCenter / Math.max(centerOffset, 1)) * maxFanAngle;
                        const playable = getIsPlayable(card);

                        return (
                            <motion.div
                                key={card.id}
                                className="hand-card-wrapper"
                                style={{
                                    zIndex: index,
                                    marginLeft: index === 0 ? 0 : -(80 - overlap),
                                }}
                                initial={{ y: 80, opacity: 0, rotate: 0 }}
                                animate={{
                                    y: 0,
                                    opacity: playable || !canPlay ? 1 : 0.45,
                                    rotate: angle * 0.3,
                                    transition: { delay: index * 0.04, duration: 0.4, ease: 'backOut' }
                                }}
                                exit={{
                                    y: -120,
                                    opacity: 0,
                                    scale: 0.8,
                                    transition: { duration: 0.3 }
                                }}
                                whileHover={canPlay && playable ? {
                                    y: -20,
                                    rotate: 0,
                                    scale: 1.08,
                                    zIndex: 50,
                                    transition: { duration: 0.15 }
                                } : undefined}
                            >
                                <CardView
                                    card={card}
                                    onClick={canPlay && playable ? () => playCard(card) : undefined}
                                    disabled={!canPlay || !playable}
                                    style={{
                                        filter: canPlay && !playable ? 'brightness(0.4)' : 'none',
                                    }}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Bid info */}
            {gameState.phase === 'playing' && myPlayer.bid >= 0 && (
                <div style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    marginTop: 4,
                }}>
                    Bid: {myPlayer.bid} · Got: {myPlayer.tricksWon}
                </div>
            )}
        </div>
    );
}
