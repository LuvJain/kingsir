import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Card as CardType, Player, Suit } from '../types';
import { Card } from './Card';

interface GameTableProps {
  currentTrick: CardType[];
  trumpSuit: Suit | null;
  players: Player[];
  currentPlayerIndex: number;
}

export const GameTable: React.FC<GameTableProps> = ({
  currentTrick,
  trumpSuit,
  players,
  currentPlayerIndex,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.trumpContainer}>
        <Text style={styles.trumpText}>Trump: {trumpSuit || 'Not selected'}</Text>
      </View>
      <View style={styles.trickContainer}>
        {currentTrick.map((card, index) => (
          <Card
            key={`${card.suit}-${card.rank}`}
            card={card}
            style={styles.trickCard}
          />
        ))}
      </View>
      <View style={styles.playersContainer}>
        {players.map((player, index) => (
          <View
            key={player.id}
            style={[
              styles.playerInfo,
              index === currentPlayerIndex && styles.currentPlayer,
            ]}
          >
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerScore}>Score: {player.score}</Text>
            <Text style={styles.playerDeclared}>Declared: {player.declaredSirs}</Text>
            <Text style={styles.playerWon}>Won: {player.wonSirs}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trumpContainer: {
    marginBottom: 20,
  },
  trumpText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trickContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  trickCard: {
    margin: 5,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  playerInfo: {
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  currentPlayer: {
    backgroundColor: '#e6f7ff',
  },
  playerName: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  playerScore: {
    marginBottom: 2,
  },
  playerDeclared: {
    marginBottom: 2,
  },
  playerWon: {
    marginBottom: 2,
  },
});

