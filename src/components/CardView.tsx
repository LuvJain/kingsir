import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View, Animated } from 'react-native';
import { Card } from '../models/Card';
import { Hearts } from './card-suits/Hearts';
import { Diamonds } from './card-suits/Diamonds';
import { Clubs } from './card-suits/Clubs';
import { Spades } from './card-suits/Spades';

interface CardViewProps {
  card: Card;
  onPress: () => void;
  selected: boolean;
  style?: ViewStyle | ViewStyle[];
  animatedStyle?: any; // For animation transforms
}

export const CardView: React.FC<CardViewProps> = ({ card, onPress, selected, style, animatedStyle }) => {
  const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
  
  const SuitComponent = {
    Hearts,
    Diamonds,
    Clubs,
    Spades,
  }[card.suit];

  const CardContainer = animatedStyle ? Animated.View : View;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.selectedCard,
        ...(Array.isArray(style) ? style : [style]),
        animatedStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cornerTop}>
        <Text style={[styles.rankText, isRed && styles.redText]}>{card.rank}</Text>
        <View style={styles.suitContainer}>
          <SuitComponent />
        </View>
      </View>
      <View style={styles.center}>
        <SuitComponent />
      </View>
      <View style={[styles.cornerBottom]}>
        <Text style={[styles.rankText, isRed && styles.redText]}>{card.rank}</Text>
        <View style={styles.suitContainer}>
          <SuitComponent />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 70,
    height: 100,
    backgroundColor: '#fffef7', // Warm off-white
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e8dcc8',
    padding: 6,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCard: {
    borderColor: '#d4a574',
    borderWidth: 3,
    transform: [{ scale: 1.08 }],
    shadowColor: '#d4a574',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
    backgroundColor: '#fffef7',
  },
  cornerTop: {
    position: 'absolute',
    top: 4,
    left: 4,
    alignItems: 'center',
  },
  cornerBottom: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 2 }],
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  redText: {
    color: '#D10808',
  },
  suitContainer: {
    marginTop: 2,
  },
});

