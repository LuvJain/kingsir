import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { GameManager } from '../models/GameManager';
import { Card, Suit } from '../models/Card';
import { PlayerHand } from './PlayerHand';
import { PlayedCards } from './PlayedCards';
import { Scoreboard } from './Scoreboard';

export const KingsirGame: React.FC = () => {
  const [gameManager, setGameManager] = useState<GameManager | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'setup' | 'bidding' | 'playing' | 'scoring'>('setup');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    if (!gameManager) {
      Alert.prompt('Number of Players', 'Enter the number of players (3-6):', (numPlayersStr) => {
        const numPlayers = parseInt(numPlayersStr, 10);
        if (numPlayers >= 3 && numPlayers <= 6) {
          const playerNames = Array.from({ length: numPlayers }, (_, i) => `Player ${i + 1}`);
          const newGameManager = new GameManager(playerNames);
          newGameManager.startNewRound();
          setGameManager(newGameManager);
          setCurrentPhase('bidding');
        } else {
          Alert.alert('Invalid Input', 'Please enter a number between 3 and 6.');
        }
      });
    }
  }, [gameManager]);

  const handleBid = (playerIndex: number) => {
    if (!gameManager) return;

    Alert.prompt('Declare Sirs', `${gameManager.players[playerIndex].name}, how many sirs do you declare?`, (sirsStr) => {
      const sirs = parseInt(sirsStr, 10);
      if (isNaN(sirs) || sirs < 0 || sirs > gameManager.players[playerIndex].hand.length) {
        Alert.alert('Invalid Bid', 'Please enter a valid number of sirs.');
        return;
      }

      const validBid = gameManager.declareSirs(playerIndex, sirs);
      if (!validBid) {
        Alert.alert('Invalid Bid', 'The total declared sirs cannot equal the number of cards. Please choose a different number.');
        return;
      }

      const nextPlayerIndex = (playerIndex + 1) % gameManager.players.length;
      if (nextPlayerIndex === 0) {
        setCurrentPhase('playing');
        const highestBidder = gameManager.players.reduce((prev, current) => (current.declaredSirs > prev.declaredSirs ? current : prev));
        Alert.alert('Select Trump Suit', `${highestBidder.name}, select the trump suit.`, [
          { text: 'Hearts', onPress: () => gameManager.setTrumpSuit(Suit.Hearts) },
          { text: 'Diamonds', onPress: () => gameManager.setTrumpSuit(Suit.Diamonds) },
          { text: 'Clubs', onPress: () => gameManager.setTrumpSuit(Suit.Clubs) },
          { text: 'Spades', onPress: () => gameManager.setTrumpSuit(Suit.Spades) },
        ]);
      } else {
        gameManager.currentPlayerIndex = nextPlayerIndex;
        setGameManager(gameManager);
      }
    });
  };

  const handleCardPlay = (card: Card) => {
    if (!gameManager || currentPhase !== 'playing') return;

    const validPlay = gameManager.playCard(gameManager.currentPlayerIndex, card);
    if (!validPlay) {
      Alert.alert('Invalid Play', 'You must follow the leading suit if possible.');
      return;
    }

    setSelectedCard(null);

    if (gameManager.playedCards.length === gameManager.players.length) {
      setTimeout(() => {
        gameManager.scoreRound();
        if (gameManager.isGameOver()) {
          setCurrentPhase('scoring');
        } else {
          gameManager.startNewRound();
          setCurrentPhase('bidding');
        }
        setGameManager(gameManager);
      }, 1000);
    } else {
      setGameManager(gameManager);
    }
  };

  if (!gameManager) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Scoreboard players={gameManager.players} />
      {currentPhase === 'playing' && <PlayedCards cards={gameManager.playedCards} />}
      <PlayerHand
        player={gameManager.players[gameManager.currentPlayerIndex]}
        onCardSelect={currentPhase === 'playing' ? setSelectedCard : () => {}}
        selectedCard={selectedCard}
      />
      {currentPhase === 'bidding' && (
        <TouchableOpacity style={styles.button} onPress={() => handleBid(gameManager.currentPlayerIndex)}>
          <Text style={styles.buttonText}>Declare Sirs</Text>
        </TouchableOpacity>
      )}
      {currentPhase === 'playing' && selectedCard && (
        <TouchableOpacity style={styles.button} onPress={() => handleCardPlay(selectedCard)}>
          <Text style={styles.buttonText}>Play Card</Text>
        </TouchableOpacity>
      )}
      {currentPhase === 'scoring' && (
        <View>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.winnerText}>
            Winner: {gameManager.players.reduce((prev, current) => (current.score > prev.score ? current : prev)).name}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  winnerText: {
    fontSize: 18,
  },
});

