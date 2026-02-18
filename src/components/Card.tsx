import React from 'react';
import { motion } from 'framer-motion';
import { type Card as CardType, Suit, type Rank } from '../game/types';
import * as deck from '@letele/playing-cards';

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

// Map our suit names to @letele/playing-cards suit prefix
const SUIT_PREFIX: Record<Suit, string> = {
    [Suit.Hearts]:   'H',
    [Suit.Diamonds]: 'D',
    [Suit.Clubs]:    'C',
    [Suit.Spades]:   'S',
};

// Map our rank names to @letele/playing-cards rank suffix
// Face cards and aces are lowercase in the export names
const RANK_SUFFIX: Record<string, string> = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
    '7': '7', '8': '8', '9': '9', '10': '10',
    'J': 'j', 'Q': 'q', 'K': 'k', 'A': 'a',
};

// Get the React SVG component for a card
function getCardComponent(suit: Suit, rank: Rank): React.ComponentType<React.SVGProps<SVGSVGElement>> | null {
    const key = `${SUIT_PREFIX[suit]}${RANK_SUFFIX[rank]}`;
    return (deck as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[key] || null;
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
    const sizeClass = large ? 'playing-card-large' : 'playing-card-normal';
    const winnerClass = isWinner ? 'playing-card-winner' : '';
    const selectedClass = selected ? 'playing-card-selected' : '';
    const disabledClass = disabled ? 'playing-card-disabled' : '';

    if (faceDown) {
        const BackCard = (deck as any).B1;
        return (
            <motion.div
                layoutId={layoutId}
                className={`playing-card-wrap ${sizeClass}`}
                style={{ cursor: 'default', ...style }}
            >
                <BackCard style={{ width: '100%', height: '100%' }} />
            </motion.div>
        );
    }

    const CardSvg = getCardComponent(card.suit, card.rank);

    return (
        <div
            className={`playing-card-wrap ${sizeClass} ${winnerClass} ${selectedClass} ${disabledClass}`}
            onClick={disabled ? undefined : onClick}
            style={{
                cursor: disabled ? 'default' : onClick ? 'pointer' : 'default',
                ...style,
            }}
        >
            {CardSvg ? (
                <CardSvg style={{ width: '100%', height: '100%', borderRadius: 6 }} />
            ) : (
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: '#fff',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    color: '#333',
                }}>
                    {card.rank}{card.suit[0]}
                </div>
            )}
        </div>
    );
}
