import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { type Card as CardType } from '../game/types';
import { useGame } from '../hooks/useGame';
import { CardView } from './Card';

export function PlayerHand() {
    const { gameState, myPlayer, myPlayerIndex, playCard } = useGame();
    const containerRef = useRef<HTMLDivElement>(null);
    const handCardsRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(window.innerWidth);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [playingCardId, setPlayingCardId] = useState<string | null>(null);
    const touchingRef = useRef(false);
    const didRiffleRef = useRef(false); // true if finger moved across multiple cards
    const startIndexRef = useRef<number | null>(null);

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

    const getIsPlayable = (card: CardType): boolean => {
        if (!canPlay) return false;
        if (!gameState.leadingSuit) return true;
        if (card.suit === gameState.leadingSuit) return true;
        const hasLeadingSuit = myPlayer.hand.some(c => c.suit === gameState.leadingSuit);
        return !hasLeadingSuit;
    };

    const cardW = Math.min(96, Math.max(68, containerWidth * 0.18));
    const cardCount = myPlayer.hand.length;
    const maxFanAngle = Math.min(cardCount * 3, 30);
    const availableWidth = containerWidth - 32;
    const minOverlap = cardCount > 1
        ? Math.max(0, cardW - (availableWidth - cardW) / (cardCount - 1))
        : 0;
    const overlap = Math.min(cardW - 12, Math.max(minOverlap, cardW - 700 / Math.max(cardCount, 1)));

    // Calculate which card index a touch X position corresponds to
    const getCardIndexAtX = useCallback((clientX: number): number | null => {
        if (!handCardsRef.current || cardCount === 0) return null;
        const rect = handCardsRef.current.getBoundingClientRect();
        const relX = clientX - rect.left;

        const step = cardW - overlap;
        const totalWidth = cardW + step * (cardCount - 1);
        const startX = (rect.width - totalWidth) / 2;

        const idx = Math.floor((relX - startX) / step);
        if (idx < 0) return 0;
        if (idx >= cardCount) return cardCount - 1;
        return idx;
    }, [cardW, overlap, cardCount]);

    // Touch riffle: slide finger horizontally across hand, cards pop up as you pass
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchingRef.current = true;
        didRiffleRef.current = false;
        const touch = e.touches[0];
        const idx = getCardIndexAtX(touch.clientX);
        startIndexRef.current = idx;
        setActiveIndex(idx);
    }, [getCardIndexAtX]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!touchingRef.current) return;
        const touch = e.touches[0];
        const idx = getCardIndexAtX(touch.clientX);
        if (idx !== startIndexRef.current) {
            didRiffleRef.current = true; // finger moved to a different card
        }
        setActiveIndex(idx);
    }, [getCardIndexAtX]);

    const handleTouchEnd = useCallback(() => {
        touchingRef.current = false;
        // Only auto-play if it was a tap (no riffle). Riffle just lifts cards for browsing.
        // If you riffled and stopped on a card, just drop them all back down.
        setActiveIndex(null);
        startIndexRef.current = null;
        didRiffleRef.current = false;
    }, []);

    // Handle card play with throw animation
    const handlePlayCard = useCallback((card: CardType) => {
        if (playingCardId) return;
        setPlayingCardId(card.id);
        setTimeout(() => {
            playCard(card);
            setPlayingCardId(null);
        }, 180);
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
            <div
                className="hand-cards"
                ref={handCardsRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                <AnimatePresence mode="popLayout">
                    {myPlayer.hand.map((card, index) => {
                        const centerOffset = (cardCount - 1) / 2;
                        const offsetFromCenter = index - centerOffset;
                        const angle = (offsetFromCenter / Math.max(centerOffset, 1)) * maxFanAngle;
                        const playable = getIsPlayable(card);
                        const isBeingPlayed = card.id === playingCardId;
                        const isActive = activeIndex === index;
                        const isNearActive = activeIndex !== null && Math.abs(activeIndex - index) === 1;

                        // Active card pops up, neighbors get a small lift
                        const liftY = isActive ? -28 : isNearActive ? -10 : 0;
                        const liftScale = isActive ? 1.1 : isNearActive ? 1.03 : 1;

                        return (
                            <motion.div
                                key={card.id}
                                className={`hand-card-wrapper ${canPlay && playable ? 'hand-card-playable' : ''}`}
                                style={{
                                    zIndex: isActive ? 100 : isNearActive ? 50 : index,
                                    marginLeft: index === 0 ? 0 : -(overlap),
                                }}
                                initial={{ y: 80, opacity: 0, rotate: 0 }}
                                animate={isBeingPlayed ? {
                                    y: -220,
                                    opacity: 0,
                                    scale: 0.5,
                                    rotate: (Math.random() - 0.5) * 40,
                                    transition: {
                                        type: 'spring',
                                        stiffness: 250,
                                        damping: 12,
                                        mass: 0.6,
                                    }
                                } : {
                                    y: liftY,
                                    opacity: playable || !canPlay ? 1 : 0.45,
                                    rotate: isActive ? 0 : angle * 0.3,
                                    scale: liftScale,
                                    transition: isActive || isNearActive ? {
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 22,
                                        mass: 0.35,
                                    } : {
                                        delay: index * 0.04,
                                        duration: 0.4,
                                        ease: 'backOut',
                                    }
                                }}
                                exit={{
                                    y: -120,
                                    opacity: 0,
                                    scale: 0.8,
                                    transition: { duration: 0.2 }
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
