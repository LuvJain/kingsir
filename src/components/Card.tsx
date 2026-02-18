import { motion } from 'framer-motion';
import { type Card as CardType, Suit, SUIT_SYMBOLS } from '../game/types';

interface CardProps {
    card: CardType;
    onClick?: () => void;
    selected?: boolean;
    isWinner?: boolean;
    faceDown?: boolean;
    large?: boolean;
    style?: React.CSSProperties;
    disabled?: boolean;
    layoutId?: string;
}

export function CardView({
    card,
    onClick,
    selected = false,
    isWinner = false,
    faceDown = false,
    large = false,
    style,
    disabled = false,
    layoutId,
}: CardProps) {
    const symbol = SUIT_SYMBOLS[card.suit];
    const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;

    if (faceDown) {
        return (
            <motion.div
                layoutId={layoutId}
                className={`card ${large ? 'card-large' : ''}`}
                style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5f8f 50%, #1e3a5f 100%)',
                    cursor: 'default',
                    ...style,
                }}
            >
                {/* Card back pattern */}
                <div style={{
                    position: 'absolute',
                    inset: '6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <span style={{ fontSize: large ? 28 : 22, opacity: 0.3 }}>♠</span>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layoutId={layoutId}
            className={`card ${large ? 'card-large' : ''} ${isRed ? 'card-red' : 'card-black'} ${isWinner ? 'card-winner' : ''}`}
            onClick={disabled ? undefined : onClick}
            style={{
                cursor: disabled ? 'default' : onClick ? 'pointer' : 'default',
                ...style,
            }}
            whileHover={onClick && !disabled ? {
                y: -12,
                scale: 1.05,
                boxShadow: selected
                    ? '0 12px 40px rgba(240, 192, 64, 0.5)'
                    : '0 12px 40px rgba(0, 0, 0, 0.5)',
                transition: { duration: 0.15 }
            } : undefined}
            whileTap={onClick && !disabled ? { scale: 0.97 } : undefined}
        >
            {/* Top-left corner */}
            <div className="card-corner card-corner-top">
                <span className="card-corner-rank">{card.rank}</span>
                <span className="card-corner-suit">{symbol}</span>
            </div>

            {/* Center */}
            <span className="card-suit">{symbol}</span>

            {/* Bottom-right corner */}
            <div className="card-corner card-corner-bottom">
                <span className="card-corner-rank">{card.rank}</span>
                <span className="card-corner-suit">{symbol}</span>
            </div>
        </motion.div>
    );
}
