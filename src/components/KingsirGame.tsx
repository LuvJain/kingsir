import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import { GameState, Card as CardType, Suit, Player } from '../types';
import { initializeGame, validateDeclaration, selectTrumpSuit, playCard, scoreRound } from '../utils/gameLogic';
import { PlayerHand } from './PlayerHand';
import { GameTable } from './GameTable';
import { DeclarationModal } from './DeclarationModal';

const PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

export const KingsirGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initializeGame(PLAYER_NAMES));
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);

  useEffect(() => {
    if (gameState.gamePhase === 'gameOver') {
      alert('Game Over! Final Scores:\n' + gameState.players.map(p => `${p.name}: ${p.score}`).join('\n'));
    }
  }, [gameState.gamePhase]);

  const handleDeclaration = (declaration: number) => {
    if (validateDeclaration(gameState, gameState.players[gameState.currentPlayerIndex].id, declaration)) {
      const updatedPlayers = gameState.players.map((player, index) =>
        index === gameState.currentPlayerIndex ? { ...player, declaredSirs: declaration } : player
      );
      const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      const allDeclared = nextPlayerIndex === 0;

      setGameState({
        ...gameState,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        gamePhase: allDeclared ? 'selectingTrump' : 'declaring',
      });
    } else {
      alert('Invalid declaration. Please try again.');
    }
    setShowDeclarationModal(false);
  };

  const handleTrumpSelection = (suit: Suit) => {
    setGameState(selectTrumpSuit(gameState, suit));
  };

  const handleCardPlay = (card: CardType) => {
    setGameState(playCard(gameState, gameState.players[gameState.currentPlayerIndex].id, card));
  };

  const handleNextRound = () => {
    setGameState(scoreRound(gameState));
  };

  const renderGamePhase = () => {
    switch (gameState.gamePhase) {
      case 'declaring':
        return (
          <View>
            <Text>Current player: {gameState.players[gameState.currentPlayerIndex].name}</Text>
            <Button title="Declare Sirs" onPress={() => setShowDeclarationModal(true)} />
            <DeclarationModal
              visible={showDeclarationModal}
              onDeclare={handleDeclaration}
              maxDeclaration={gameState.cardsPerPlayer}
            />
          </View>
        );
      case 'selectingTrump':
        return (
          <View>
            <Text>Select Trump Suit:</Text>
            {Object.values(Suit).map(suit => (
              <Button key={suit} title={suit} onPress={() => handleTrumpSelection(suit)} />
            ))}
          </View>
        );
      case 'playing':
        return (
          <View style={styles.gameContainer}>
            <GameTable
              currentTrick={gameState.currentTrick}
              trumpSuit={gameState.trumpSuit}
              players={gameState.players}
              currentPlayerIndex={gameState.currentPlayerIndex}
            />
            <PlayerHand
              cards={gameState.players[gameState.currentPlayerIndex].hand}
              onCardPress={handleCardPlay}
            />
          </View>
        );
      case 'scoring':
        return (
          <View>
            <Text>Round Over! Scores:</Text>
            {gameState.players.map(player => (
              <Text key={player.id}>{player.name}: {player.score}</Text>
            ))}
            <Button title="Next Round" onPress={handleNextRound} />
          </View>
        );
      case 'gameOver':
        return (
          <View>
            <Text>Game Over! Final Scores:</Text>
            {gameState.players.map(player => (
              <Text key={player.id}>{player.name}: {player.score}</Text>
            ))}
            <Button title="New Game" onPress={() => setGameState(initializeGame(PLAYER_NAMES))} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kingsir Game</Text>
      {renderGamePhase()}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gameContainer: {
    flex: 1,
    width: '100%',
  },
});

