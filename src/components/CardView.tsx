import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Card } from '../models/Card';

interface CardViewProps {
  card: Card;
  onPress: () => void;
  selected: boolean;
  style?: ViewStyle | ViewStyle[];
}

export const CardView: React.FC<CardViewProps> = ({ card, onPress, selected, style }) => {
  const cardColor = card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : 'black';

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selectedCard, ...(Array.isArray(style) ? style : [style])]}
      onPress={onPress}
    >
      <Text style={[styles.cardText, { color: cardColor }]}>{card.rank}</Text>
      <Text style={[styles.cardText, { color: cardColor }]}>{card.suit}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 60,
    height: 90,
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: 'blue',
    borderWidth: 2,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

