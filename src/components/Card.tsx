import React from 'react';
import { motion } from 'framer-motion';
import { type Card as CardType, Suit } from '../game/types';

// Typed wrapper for the CardMeister web component
function PlayingCard(props: { suit?: string; rank?: string; cid?: string }) {
    return React.createElement('playing-card', props as React.HTMLAttributes<HTMLElement>);
}

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

// Map our suit names to CardMeister suit names
const SUIT_MAP: Record<Suit, string> = {
    [Suit.Hearts]:   'Hearts',
    [Suit.Diamonds]: 'Diamonds',
    [Suit.Clubs]:    'Clubs',
    [Suit.Spades]:   'Spades',
};

// Map our rank names to CardMeister rank values
const RANK_MAP: Record<string, string> = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
    '7': '7', '8': '8', '9': '9', '10': '10',
    'J': 'Jack', 'Q': 'Queen', 'K': 'King', 'A': 'Ace',
};

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
        return (
            <motion.div
                layoutId={layoutId}
                className={`playing-card-wrap ${sizeClass}`}
                style={{ cursor: 'default', ...style }}
            >
                <PlayingCard cid="back" />
            </motion.div>
        );
    }

    const suit = SUIT_MAP[card.suit];
    const rank = RANK_MAP[card.rank];

    return (
        <div
            className={`playing-card-wrap ${sizeClass} ${winnerClass} ${selectedClass} ${disabledClass}`}
            onClick={disabled ? undefined : onClick}
            style={{
                cursor: disabled ? 'default' : onClick ? 'pointer' : 'default',
                ...style,
            }}
        >
            <PlayingCard suit={suit} rank={rank} />
        </div>
    );
}
