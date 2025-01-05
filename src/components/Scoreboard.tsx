import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player } from '../models/Player';

interface ScoreboardProps {
  players: Player[];
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ players }) => {
  return (
    <View style={styles.container}>
      {players.map((player, index) => (
        <View key={index} style={styles.playerScore}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.scoreText}>Score: {player.score}</Text>
          <Text style={styles.sirsText}>Declared: {player.declaredSirs} | Won: {player.wonSirs}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  playerScore: {
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 14,
  },
  sirsText: {
    fontSize: 12,
  },
});

