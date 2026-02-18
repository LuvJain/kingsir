import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { type Card as CardType } from '../game/types';
import { useGame } from '../hooks/useGame';
import { CardView } from './Card';

export function PlayerHand() {
    const { gameState, myPlayer, myPlayerIndex, playCard } = useGame();
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(window.innerWidth);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [playingCardId, setPlayingCardId] = useState<string | null>(null);

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
        if (!gameState.leadingSuit) return true;
        if (card.suit === gameState.leadingSuit) return true;
        const hasLeadingSuit = myPlayer.hand.some(c => c.suit === gameState.leadingSuit);
        return !hasLeadingSuit;
    };

    // Card width matches CSS clamp(68px, 18vw, 96px)
    const cardW = Math.min(96, Math.max(68, containerWidth * 0.18));

    // Fan layout: always fit all cards within container
    const cardCount = myPlayer.hand.length;
    const maxFanAngle = Math.min(cardCount * 3, 30);
    const availableWidth = containerWidth - 32;
    const minOverlap = cardCount > 1
        ? Math.max(0, cardW - (availableWidth - cardW) / (cardCount - 1))
        : 0;
    const overlap = Math.min(cardW - 12, Math.max(minOverlap, cardW - 700 / Math.max(cardCount, 1)));

    // Handle card play with throw animation
    const handlePlayCard = useCallback((card: CardType) => {
        if (playingCardId) return;
        setPlayingCardId(card.id);
        // Small delay so the throw animation plays before state update
        setTimeout(() => {
            playCard(card);
            setPlayingCardId(null);
        }, 150);
    }, [playCard, playingCardId]);

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
            <div className="hand-cards">
                <AnimatePresence mode="popLayout">
                    {myPlayer.hand.map((card, index) => {
                        const centerOffset = (cardCount - 1) / 2;
                        const offsetFromCenter = index - centerOffset;
                        const angle = (offsetFromCenter / Math.max(centerOffset, 1)) * maxFanAngle;
                        const playable = getIsPlayable(card);
                        const isBeingPlayed = card.id === playingCardId;
                        const isActive = activeIndex === index;

                        return (
                            <motion.div
                                key={card.id}
                                className={`hand-card-wrapper ${canPlay && playable ? 'hand-card-playable' : ''}`}
                                style={{
                                    zIndex: isActive ? 100 : index,
                                    marginLeft: index === 0 ? 0 : -(overlap),
                                }}
                                initial={{ y: 80, opacity: 0, rotate: 0 }}
                                animate={isBeingPlayed ? {
                                    y: -200,
                                    x: 0,
                                    opacity: 0,
                                    scale: 0.6,
                                    rotate: (Math.random() - 0.5) * 30,
                                    transition: {
                                        type: 'spring',
                                        stiffness: 200,
                                        damping: 15,
                                        mass: 0.8,
                                    }
                                } : {
                                    y: 0,
                                    x: 0,
                                    opacity: playable || !canPlay ? 1 : 0.45,
                                    rotate: angle * 0.3,
                                    scale: 1,
                                    transition: { delay: index * 0.04, duration: 0.4, ease: 'backOut' }
                                }}
                                exit={{
                                    y: -120,
                                    opacity: 0,
                                    scale: 0.8,
                                    transition: { duration: 0.25 }
                                }}
                                whileHover={canPlay && playable && !isBeingPlayed ? {
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
                                // Mobile: drag up to throw card
                                drag={canPlay && playable && !isBeingPlayed ? 'y' : false}
                                dragConstraints={{ top: -60, bottom: 0 }}
                                dragElastic={0.6}
                                dragSnapToOrigin
                                onDragStart={() => setActiveIndex(index)}
                                onDragEnd={(_e, info) => {
                                    setActiveIndex(null);
                                    // If dragged up past threshold, play the card
                                    if (info.offset.y < -40 && canPlay && playable) {
                                        handlePlayCard(card);
                                    }
                                }}
                                onTouchStart={() => {
                                    if (canPlay && playable) setActiveIndex(index);
                                }}
                                onTouchEnd={() => setActiveIndex(null)}
                            >
                                <CardView
                                    card={card}
                                    onClick={canPlay && playable && !isBeingPlayed ? () => handlePlayCard(card) : undefined}
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
