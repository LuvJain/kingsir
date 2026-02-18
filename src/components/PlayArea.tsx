import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { CardView } from './Card';
import { Suit, SUIT_SYMBOLS, SUIT_COLORS } from '../game/types';
import { getValidBids, getTotalRounds } from '../game/gameLogic';

export function PlayArea() {
    const {
        gameState, myPlayer, myPlayerIndex, playerId,
        submitBid, selectTrump, acknowledgeResult, startNextRound,
        isHost,
    } = useGame();

    if (!gameState || !myPlayer) return null;

    const isMyTurn = gameState.currentPlayerIndex === myPlayerIndex;

    return (
        <div className="play-area">
            {/* ─── Bidding Phase ─── */}
            {gameState.phase === 'bidding' && (
                <div className="bidding-panel">
                    <div className="bidding-title">
                        {isMyTurn ? 'How many sirs will you win?' : `${gameState.players[gameState.currentPlayerIndex]?.name} is bidding...`}
                    </div>
                    <div className="bidding-subtitle">
                        {isMyTurn
                            ? `Look at your ${gameState.cardsPerPlayer} cards and pick a number`
                            : `Round ${gameState.currentRound} · ${gameState.cardsPerPlayer} cards`}
                    </div>

                    {/* Existing bids — always visible, animated pop when a bid lands */}
                    <div className="bids-display">
                        {gameState.players.map((p) => {
                            const hasBid = p.bid >= 0;
                            return (
                                <motion.div
                                    key={p.id}
                                    className={`bid-chip ${hasBid ? 'bid-chip-done' : 'bid-chip-pending'}`}
                                    animate={hasBid ? {
                                        scale: [1, 1.15, 1],
                                        transition: { duration: 0.35, ease: 'backOut' }
                                    } : {}}
                                >
                                    <span className="bid-chip-name">{p.id === playerId ? 'You' : p.name}</span>
                                    <motion.span
                                        key={`${p.id}-${p.bid}`}
                                        className="bid-chip-value"
                                        initial={hasBid ? { scale: 0, opacity: 0 } : false}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    >
                                        {hasBid ? p.bid : '?'}
                                    </motion.span>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Bid buttons for current player */}
                    {isMyTurn && (
                        <motion.div
                            className="bid-buttons"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {Array.from({ length: gameState.cardsPerPlayer + 1 }, (_, i) => i).map(bid => {
                                const validBids = getValidBids(gameState, myPlayerIndex);
                                const isValid = validBids.includes(bid);
                                return (
                                    <button
                                        key={bid}
                                        className="bid-btn"
                                        onClick={() => submitBid(bid)}
                                        disabled={!isValid}
                                    >
                                        {bid}
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                    {isMyTurn && (() => {
                        const biddersLeft = gameState.players.filter(p => p.bid < 0).length;
                        const isLast = biddersLeft === 1;
                        const totalSoFar = gameState.players.reduce((s, p) => s + (p.bid >= 0 ? p.bid : 0), 0);
                        const forbidden = gameState.cardsPerPlayer - totalSoFar;
                        return (
                            <div className="phase-hint">
                                {isLast
                                    ? `You're last. Bidding ${forbidden >= 0 ? forbidden : '?'} is not allowed since bids can't add up to ${gameState.cardsPerPlayer}`
                                    : 'Pick how many rounds you think you will win. Hit that number exactly to score points'}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* ─── Trump Selection ─── */}
            {gameState.phase === 'trumpSelection' && (
                <div className="trump-panel">
                    <div className="trump-title">
                        {gameState.highestBidderId === playerId
                            ? '🏆 Choose Trump Suit'
                            : `${gameState.players.find(p => p.id === gameState.highestBidderId)?.name} is choosing trump...`}
                    </div>
                    {gameState.highestBidderId === playerId && (
                        <>
                            <motion.div
                                className="trump-suits"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {Object.values(Suit).map(suit => (
                                    <motion.button
                                        key={suit}
                                        className="trump-suit-btn"
                                        onClick={() => selectTrump(suit)}
                                        whileHover={{ y: -6, scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span
                                            className="trump-suit-symbol"
                                            style={{ color: SUIT_COLORS[suit] }}
                                        >
                                            {SUIT_SYMBOLS[suit]}
                                        </span>
                                        <span className="trump-suit-label">{suit}</span>
                                    </motion.button>
                                ))}
                            </motion.div>
                            <div className="phase-hint">
                                Pick your strongest suit. Trump cards beat everything else.
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ─── Playing Phase — Played Cards ─── */}
            {(gameState.phase === 'playing' || gameState.phase === 'trickResult') && (
                <div className="played-cards-area">
                    <AnimatePresence>
                        {gameState.playedCards.map((pc, index) => {
                            const player = gameState.players.find(p => p.id === pc.playerId);
                            const isWinner = gameState.phase === 'trickResult' && pc.playerId === gameState.trickWinnerId;
                            const isLeadCard = index === 0;
                            // Trump indicator only when someone plays trump on a non-trump lead
                            // (i.e. they're ruffing). If trump IS the leading suit, following trump is normal.
                            const leadingSuit = gameState.playedCards[0]?.card.suit;
                            const isTrumpCard = !isLeadCard
                                && pc.card.suit === gameState.trumpSuit
                                && leadingSuit !== gameState.trumpSuit;
                            // Slight random rotation like real cards thrown on table
                            const rotation = (index - 1) * 5 + (Math.sin(index * 2.7) * 3);

                            return (
                                <motion.div
                                    key={`${pc.card.id}-${gameState.trickNumber}`}
                                    className={`played-card-slot ${isLeadCard ? 'played-card-lead' : ''} ${isTrumpCard ? 'played-card-trump' : ''}`}
                                    initial={{ y: 180, opacity: 0, scale: 0.4, rotate: rotation - 25 }}
                                    animate={{
                                        y: 0,
                                        opacity: 1,
                                        scale: 1,
                                        rotate: rotation,
                                        transition: {
                                            type: 'spring',
                                            stiffness: 350,
                                            damping: 18,
                                            mass: 0.6,
                                        }
                                    }}
                                    exit={{
                                        y: -50,
                                        opacity: 0,
                                        scale: 0.7,
                                        transition: { duration: 0.25 }
                                    }}
                                >
                                    <CardView
                                        card={pc.card}
                                        isWinner={isWinner}
                                        large
                                        style={{ transform: `rotate(${rotation}deg)` }}
                                    />
                                    <motion.span
                                        className="played-card-name"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {player?.name}
                                    </motion.span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Empty state when no cards played */}
                    {gameState.playedCards.length === 0 && gameState.phase === 'playing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            style={{
                                color: 'rgba(255,255,255,0.3)',
                                fontSize: 16,
                                fontWeight: 600,
                                textAlign: 'center',
                            }}
                        >
                            {isMyTurn ? 'Play a card to start the sir' : 'Waiting for play...'}
                        </motion.div>
                    )}
                </div>
            )}

            {/* ─── Playing phase hint ─── */}
            {gameState.phase === 'playing' && isMyTurn && (
                <div className="phase-hint">
                    {gameState.leadingSuit
                        ? `You must follow ${gameState.leadingSuit} if you have it${gameState.trumpSuit ? `. Trump is ${SUIT_SYMBOLS[gameState.trumpSuit as Suit]} ${gameState.trumpSuit}` : ''}`
                        : `You lead this trick, play any card${gameState.trumpSuit ? `. Trump is ${SUIT_SYMBOLS[gameState.trumpSuit as Suit]} ${gameState.trumpSuit}` : ''}`}
                </div>
            )}

            {/* ─── Trick Result: winner text + continue, inline below cards ─── */}
            {gameState.phase === 'trickResult' && (
                <motion.div
                    className="trick-result-row"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                >
                    <span className="trick-result-text">
                        {gameState.trickWinnerId === playerId
                            ? 'You got the sir!'
                            : `${gameState.players.find(p => p.id === gameState.trickWinnerId)?.name} takes the sir!`}
                    </span>
                    {isHost && (
                        <motion.button
                            className="primary-btn"
                            style={{ padding: '10px 28px', fontSize: 15 }}
                            onClick={acknowledgeResult}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                        >
                            Continue
                        </motion.button>
                    )}
                </motion.div>
            )}

            {/* ─── Round End ─── */}
            {gameState.phase === 'roundEnd' && (() => {
                const totalRounds = getTotalRounds(gameState.players.length);
                const isLastRound = gameState.currentRound >= totalRounds;
                return (
                    <motion.div
                        className="round-end-panel"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="round-end-title">
                            {isLastRound ? 'Final Round Complete' : `Round ${gameState.currentRound} Complete`}
                        </div>
                        {gameState.players.map(p => {
                            const hit = p.bid === p.tricksWon;
                            const roundScore = hit ? (p.bid === 0 ? 10 : p.bid + 10) : 0;
                            return (
                                <div
                                    key={p.id}
                                    className={`round-score-row ${hit ? 'round-score-row-hit' : 'round-score-row-miss'}`}
                                >
                                    <div>
                                        <div className="round-score-name">{p.name}</div>
                                        <div className="round-score-detail">
                                            Bid {p.bid} · Got {p.tricksWon} {hit ? '✓' : '✗'}
                                        </div>
                                    </div>
                                    <div className={`round-score-points ${hit ? 'round-score-points-hit' : 'round-score-points-miss'}`}>
                                        {hit ? `+${roundScore}` : '+0'}
                                    </div>
                                </div>
                            );
                        })}
                        {isHost && (
                            <button
                                className="primary-btn"
                                style={{ marginTop: 20 }}
                                onClick={startNextRound}
                            >
                                {isLastRound ? 'See Final Results' : 'Next Round →'}
                            </button>
                        )}
                    </motion.div>
                );
            })()}

            {/* ─── Game Over ─── */}
            {gameState.phase === 'gameOver' && (() => {
                const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
                const winner = sorted[0];
                return (
                    <motion.div
                        className="game-over-panel"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            className="game-over-title"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            Game Over
                        </motion.div>
                        <div className="game-over-winner">
                            {winner.id === playerId ? "You win!" : `${winner.name} wins!`}
                        </div>
                        <div className="game-over-scores">
                            {sorted.map((p, i) => (
                                <div
                                    key={p.id}
                                    className={`game-over-score-row ${i === 0 ? 'game-over-score-row-winner' : 'game-over-score-row-other'}`}
                                >
                                    <span style={{
                                        fontWeight: i === 0 ? 800 : 500,
                                        color: i === 0 ? 'var(--gold)' : 'var(--text-secondary)',
                                        fontSize: 16,
                                    }}>
                                        {i + 1}. {p.id === playerId ? 'You' : p.name}
                                    </span>
                                    <span style={{
                                        fontWeight: 800,
                                        color: i === 0 ? 'var(--gold)' : 'var(--text-primary)',
                                        fontSize: 16,
                                    }}>
                                        {p.score} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button
                            className="primary-btn"
                            onClick={() => window.location.reload()}
                        >
                            Play Again
                        </button>
                    </motion.div>
                );
            })()}
        </div>
    );
}
