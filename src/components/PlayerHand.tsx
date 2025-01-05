import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card as CardType } from '../types';
import { Card } from './Card';

interface PlayerHandProps {
  cards: CardType[];
  onCardPress: (card: CardType) => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ cards, onCardPress }) => {
  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <Card
          key={`${card.suit}-${card.rank}`}
          card={card}
          onPress={() => onCardPress(card)}
          style={styles.card}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  card: {
    marginHorizontal: -15,
  },
});

