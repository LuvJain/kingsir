import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ card, onPress, style }) => {
  const { suit, rank } = card;
  const color = suit === 'Hearts' || suit === 'Diamonds' ? 'red' : 'black';

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
      <Text style={[styles.text, { color }]}>{rank}</Text>
      <Text style={[styles.text, { color }]}>{getSuitSymbol(suit)}</Text>
    </TouchableOpacity>
  );
};

function getSuitSymbol(suit: string): string {
  switch (suit) {
    case 'Hearts': return '♥';
    case 'Diamonds': return '♦';
    case 'Clubs': return '♣';
    case 'Spades': return '♠';
    default: return '';
  }
}

const styles = StyleSheet.create({
  card: {
    width: 60,
    height: 90,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

