import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../models/Card';
import { CardView } from './CardView';

interface PlayedCardsProps {
  cards: Card[];
}

export const PlayedCards: React.FC<PlayedCardsProps> = ({ cards }) => {
  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <CardView
          key={`${card.suit}-${card.rank}`}
          card={card}
          onPress={() => {}}
          selected={false}
          style={[
            styles.card,
            {
              transform: [
                { translateX: (index - cards.length / 2 + 0.5) * 30 },
                { translateY: Math.random() * 20 - 10 },
                { rotate: `${Math.random() * 20 - 10}deg` },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    marginBottom: 20,
  },
  card: {
    position: 'absolute',
  },
});

