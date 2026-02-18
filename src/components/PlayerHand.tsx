import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { type Card as CardType } from '../game/types';
import { useGame } from '../hooks/useGame';
import { CardView } from './Card';

export function PlayerHand() {
    const { gameState, myPlayer, myPlayerIndex, playCard } = useGame();
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(window.innerWidth);
    const isMobile = containerWidth < 600;

    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        update();
        const ro = new ResizeObserver(update);
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

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

    // Card width matches CSS clamp(68px, 18vw, 96px)
    const cardW = Math.min(96, Math.max(68, containerWidth * 0.18));

    // Fan layout params
    const cardCount = myPlayer.hand.length;
    const maxFanAngle = Math.min(cardCount * 3, 30);

    // On mobile: less overlap so cards are more visible when scrolling
    // On desktop: fit cards within container
    const availableWidth = containerWidth - 32;
    let overlap: number;
    if (isMobile) {
        // Mobile: moderate overlap, container scrolls
        overlap = Math.min(cardW * 0.45, 40);
    } else {
        // Desktop: fit within container
        const minOverlap = cardCount > 1
            ? Math.max(0, cardW - (availableWidth - cardW) / (cardCount - 1))
            : 0;
        overlap = Math.min(cardW - 12, Math.max(minOverlap, cardW - 700 / Math.max(cardCount, 1)));
    }

    return (
        <div className="hand-area" ref={containerRef}>
            {/* Status */}
            <div className="status-bar">
                {isPlayPhase && (
                    isMyTurn ? (
                        <span className="your-turn">Your turn. Play a card</span>
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
                        <span className="your-turn">You won the bid! Choose trump</span>
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
            <div className={`hand-cards ${isMobile ? 'hand-cards-scroll' : ''}`}>
                <AnimatePresence mode="popLayout">
                    {myPlayer.hand.map((card, index) => {
                        const centerOffset = (cardCount - 1) / 2;
                        const offsetFromCenter = index - centerOffset;
                        const angle = (offsetFromCenter / Math.max(centerOffset, 1)) * maxFanAngle;
                        const playable = getIsPlayable(card);
                        // Subtle arc lift on mobile
                        const arcY = isMobile
                            ? Math.abs(offsetFromCenter) * -2
                            : 0;

                        return (
                            <motion.div
                                key={card.id}
                                className={`hand-card-wrapper ${canPlay && playable ? 'hand-card-playable' : ''}`}
                                style={{
                                    zIndex: index,
                                    marginLeft: index === 0 ? 0 : -(overlap),
                                }}
                                initial={{ y: 80, opacity: 0, rotate: 0 }}
                                animate={{
                                    y: arcY,
                                    opacity: playable || !canPlay ? 1 : 0.45,
                                    rotate: isMobile ? angle * 0.15 : angle * 0.3,
                                    transition: { delay: index * 0.04, duration: 0.4, ease: 'backOut' }
                                }}
                                exit={{
                                    y: -120,
                                    opacity: 0,
                                    scale: 0.8,
                                    transition: { duration: 0.3 }
                                }}
                                whileHover={canPlay && playable ? {
                                    y: -24,
                                    rotate: 0,
                                    scale: 1.12,
                                    transition: {
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 15,
                                        mass: 0.5,
                                    }
                                } : undefined}
                                whileTap={canPlay && playable && isMobile ? {
                                    y: -20,
                                    scale: 1.08,
                                    transition: {
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 15,
                                    }
                                } : undefined}
                            >
                                <CardView
                                    card={card}
                                    onClick={canPlay && playable ? () => playCard(card) : undefined}
                                    disabled={!canPlay || !playable}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Bid info */}
            {gameState.phase === 'playing' && myPlayer.bid >= 0 && (
                <div style={{
                    fontSize: 13,
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
