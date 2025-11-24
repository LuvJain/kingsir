import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { GameManager } from '../models/GameManager';
import { Card, Suit } from '../models/Card';
import { PlayerHand } from './PlayerHand';
import { PlayedCards } from './PlayedCards';
import { Scoreboard } from './Scoreboard';
import { LobbyScreen } from './LobbyScreen';
import { AIPlayer, AIDifficulty } from '../services/AIPlayer';

export const KingsirGame: React.FC = () => {
  const [gameManager, setGameManager] = useState<GameManager | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'lobby' | 'bidding' | 'trumpSelection' | 'playing' | 'scoring'>('lobby');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [lastWinner, setLastWinner] = useState<string | null>(null);
  const [humanPlayerIndex, setHumanPlayerIndex] = useState(0);
  const [aiPlayers, setAIPlayers] = useState<Map<number, AIPlayer>>(new Map());
  const [actionMessage, setActionMessage] = useState<string>('');
  const [showingTrickResult, setShowingTrickResult] = useState(false);

  const handleStartGame = (playerNames: string[], myPlayerIndex: number, aiPlayerConfigs?: { index: number; difficulty: AIDifficulty }[]) => {
    const newGameManager = new GameManager(playerNames);
    newGameManager.startNewRound();
    setGameManager(newGameManager);
    setHumanPlayerIndex(myPlayerIndex);
    
    // Set up AI players
    const aiMap = new Map<number, AIPlayer>();
    aiPlayerConfigs?.forEach(({ index, difficulty }) => {
      aiMap.set(index, new AIPlayer(playerNames[index], difficulty));
    });
    setAIPlayers(aiMap);
    
    setCurrentPhase('bidding');
  };

  // AI turn handler
  useEffect(() => {
    if (!gameManager) return;
    
    // Don't let AI play while showing trick result
    if (showingTrickResult) return;
    
    // During trump selection, check the highest bidder instead of current player
    const playerToCheck = currentPhase === 'trumpSelection' && gameManager.highestBidder !== null
      ? gameManager.highestBidder
      : gameManager.currentPlayerIndex;
    
    const currentAI = aiPlayers.get(playerToCheck);
    if (!currentAI) return;

    // AI makes its move after a short delay for realism
    const timer = setTimeout(() => {
      handleAITurn(currentAI, playerToCheck);
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameManager?.currentPlayerIndex, gameManager?.highestBidder, currentPhase, aiPlayers, showingTrickResult]);

  const handleAITurn = (ai: AIPlayer, playerIndex: number) => {
    if (!gameManager) return;

    if (currentPhase === 'bidding') {
      const player = gameManager.players[playerIndex];
      const totalDeclared = gameManager.players.reduce((sum, p) => sum + (p.declaredSirs >= 0 ? p.declaredSirs : 0), 0);
      const isLastPlayer = gameManager.players.filter(p => p.declaredSirs === -1).length === 1;
      
      const bid = ai.makeBid(player.hand, gameManager.handsInRound, totalDeclared, isLastPlayer);
      
      // Show AI bid to player
      setActionMessage(`${player.name} bids ${bid} ${bid === 1 ? 'sir' : 'sirs'}`);
      setTimeout(() => setActionMessage(''), 3000);
      
      handleBid(playerIndex, bid);
    } else if (currentPhase === 'trumpSelection' && gameManager.highestBidder === playerIndex) {
      const player = gameManager.players[playerIndex];
      const trumpSuit = ai.selectTrumpSuit(player.hand);
      
      // Show AI trump selection
      setActionMessage(`${player.name} picks ${trumpSuit} as trump`);
      setTimeout(() => {
        setActionMessage('');
        selectTrumpSuit(trumpSuit);
      }, 3000);
    } else if (currentPhase === 'playing') {
      const player = gameManager.players[playerIndex];
      const tricksRemaining = gameManager.handsInRound - gameManager.currentHand;
      const card = ai.playCard(
        player.hand, 
        gameManager.leadingSuit, 
        gameManager.trumpSuit, 
        gameManager.playedCards,
        player.declaredSirs,
        player.wonSirs,
        tricksRemaining
      );
      
      handleCardPlay(card);
    }
  };

const handleBid = (playerIndex: number, sirs?: number) => {
  if (!gameManager) return;

  const processBid = (bidAmount: number) => {
    if (isNaN(bidAmount) || bidAmount < 0 || bidAmount > gameManager.players[playerIndex].hand.length) {
      Alert.alert('Invalid Bid', 'Please enter a valid number of sirs.');
      return;
    }

    const updatedGameManager = Object.assign(new GameManager([]), gameManager);
    
    const validBid = updatedGameManager.declareSirs(playerIndex, bidAmount);
    if (!validBid) {
      Alert.alert('Invalid Bid', 'The total declared sirs cannot equal the number of cards. Please choose a different number.');
      return;
    }

    console.log(`${updatedGameManager.players[playerIndex].name} declared ${bidAmount} sirs.`);

    const allPlayersHaveBid = updatedGameManager.players.every(player => player.declaredSirs !== -1);
    if (allPlayersHaveBid) {
      console.log('All players have declared sirs.');
      setCurrentPhase('trumpSelection');
    }
    // Note: declareSirs already increments currentPlayerIndex, so we don't need to do it here

    setGameManager(updatedGameManager);
  };

  if (sirs !== undefined) {
    // AI or programmatic bid
    processBid(sirs);
  } else {
    // Human player bid
    Alert.prompt(
      'Declare Sirs',
      `${gameManager.players[playerIndex].name}, how many sirs do you declare? (You have ${gameManager.players[playerIndex].hand.length} cards)`,
      (sirsStr) => {
        processBid(parseInt(sirsStr, 10));
      }
    );
  }
};

  const handleTrumpSelection = () => {
    if (!gameManager || gameManager.highestBidder === null) return;

    const highestBidder = gameManager.players[gameManager.highestBidder];
    console.log(`${highestBidder.name} is selecting the trump suit.`);

    Alert.alert(
      'Select Trump Suit',
      `${highestBidder.name}, you bid the highest (${highestBidder.declaredSirs}). Select the trump suit.`,
      [
        { text: 'Hearts', onPress: () => selectTrumpSuit(Suit.Hearts) },
        { text: 'Diamonds', onPress: () => selectTrumpSuit(Suit.Diamonds) },
        { text: 'Clubs', onPress: () => selectTrumpSuit(Suit.Clubs) },
        { text: 'Spades', onPress: () => selectTrumpSuit(Suit.Spades) },
      ]
    );
  };

  const selectTrumpSuit = (suit: Suit) => {
    if (!gameManager) return;
  
    console.log(`Trump suit selected: ${suit}`);
    
    // Create a new instance while preserving the prototype chain
    const updatedGameManager = Object.assign(new GameManager([]), gameManager);
    updatedGameManager.setTrumpSuit(suit);
    
    // Set the current player to the highest bidder
    if (updatedGameManager.highestBidder !== null) {
      updatedGameManager.currentPlayerIndex = updatedGameManager.highestBidder;
    }
    
    setCurrentPhase('playing');
    setGameManager(updatedGameManager);
  };

  const handleCardPlay = (card: Card) => {
    if (!gameManager || currentPhase !== 'playing' || showingTrickResult) return;
  
    // Create a new instance while preserving the prototype chain
    const updatedGameManager = Object.assign(new GameManager([]), gameManager);
    const currentPlayerName = updatedGameManager.players[updatedGameManager.currentPlayerIndex].name;
    
    // Check if this will complete the trick BEFORE playing
    const willCompleteTrick = updatedGameManager.playedCards.length + 1 === updatedGameManager.players.length;
    
    const validPlay = updatedGameManager.playCard(updatedGameManager.currentPlayerIndex, card);
    if (!validPlay) {
      Alert.alert('Invalid Play', 'You must follow the leading suit if possible.');
      return;
    }
  
    console.log(`${currentPlayerName} played ${card.rank} of ${card.suit}.`);
  
    setSelectedCard(null);
  
    if (willCompleteTrick) {
      // All cards played - show the trick result!
      setShowingTrickResult(true);
      
      // The winner is now in currentPlayerIndex (set by resolveHand)
      const winnerIndex = updatedGameManager.currentPlayerIndex;
      const winnerName = updatedGameManager.players[winnerIndex].name;
      
      // Update game state immediately so cards show
      setGameManager(updatedGameManager);
      
      // Quick pause to see all cards, then show winner
      setTimeout(() => {
        setLastWinner(winnerName);
        
        // Show winner celebration - shorter for better pacing
        setTimeout(() => {
          setLastWinner(null);
          
          // Check if round is over
          console.log(`Current hand: ${updatedGameManager.currentHand}, Hands in round: ${updatedGameManager.handsInRound}`);
          if (updatedGameManager.currentHand === updatedGameManager.handsInRound) {
            console.log('Round is complete! Scoring...');
            updatedGameManager.scoreRound();
            if (updatedGameManager.isGameOver()) {
              setShowingTrickResult(false);
              setCurrentPhase('scoring');
              setGameManager(updatedGameManager);
            } else {
              // Show round summary
              const roundSummary = updatedGameManager.players.map(p => 
                `${p.name}: ${p.wonSirs}/${p.declaredSirs} (${p.wonSirs === p.declaredSirs ? '✓' : '✗'})`
              ).join('\n');
              
              setActionMessage(`Round Complete!\n${roundSummary}`);
              setShowingTrickResult(false);
              
              setTimeout(() => {
                setActionMessage('');
                updatedGameManager.startNewRound();
                console.log('Starting new round - setting phase to bidding');
                console.log('Current player:', updatedGameManager.currentPlayerIndex);
                console.log('Players bids:', updatedGameManager.players.map(p => p.declaredSirs));
                setCurrentPhase('bidding');
                setGameManager(updatedGameManager);
              }, 3000);
            }
          } else {
            console.log('Continuing to next trick');
            // Continue to next trick - clear flag and update game to trigger AI
            setShowingTrickResult(false);
            // Force a state update to trigger the AI useEffect
            setGameManager({...updatedGameManager});
          }
        }, 1800);
      }, 600);
    } else {
      setGameManager(updatedGameManager);
    }
  };

  if (currentPhase === 'lobby') {
    return <LobbyScreen onStartGame={handleStartGame} />;
  }

  if (!gameManager) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Scoreboard players={gameManager.players} />
      <View style={styles.playArea}>
        {currentPhase === 'playing' && <PlayedCards cards={gameManager.playedCards} />}
        {lastWinner && (
          <View style={styles.winnerBanner}>
            <Text style={styles.winnerBannerText}>
              {lastWinner === gameManager.players[humanPlayerIndex].name ? "You won the trick!" : `${lastWinner} takes it!`}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.controlArea}>
        {actionMessage && (
          <View style={styles.actionMessageBanner}>
            <Text style={styles.actionMessageText}>{actionMessage}</Text>
          </View>
        )}
        <PlayerHand
          player={gameManager.players[humanPlayerIndex]}
          onCardSelect={setSelectedCard}
          selectedCard={selectedCard}
        />
        {currentPhase === 'bidding' && gameManager.currentPlayerIndex === humanPlayerIndex && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleBid(gameManager.currentPlayerIndex)}
          >
            <Text style={styles.buttonText}>Declare Sirs</Text>
          </TouchableOpacity>
        )}
        {currentPhase === 'trumpSelection' && gameManager.highestBidder === humanPlayerIndex && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleTrumpSelection}
          >
            <Text style={styles.buttonText}>Select Trump Suit</Text>
          </TouchableOpacity>
        )}
        {currentPhase === 'playing' && selectedCard && gameManager.currentPlayerIndex === humanPlayerIndex && !showingTrickResult && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleCardPlay(selectedCard)}
          >
            <Text style={styles.buttonText}>Play Card</Text>
          </TouchableOpacity>
        )}
        {currentPhase === 'playing' && !selectedCard && gameManager.currentPlayerIndex === humanPlayerIndex && !showingTrickResult && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Select a card to play</Text>
          </View>
        )}
        {currentPhase === 'scoring' && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverText}>Game Over!</Text>
            <Text style={styles.winnerText}>
              {(() => {
                const winner = gameManager.players.reduce((prev, current) => (
                  current.score > prev.score ? current : prev
                ));
                return winner.name === gameManager.players[humanPlayerIndex].name 
                  ? "You won!" 
                  : `${winner.name} wins!`;
              })()}
            </Text>
          </View>
        )}
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>
            {currentPhase === 'bidding' && (
              gameManager.currentPlayerIndex === humanPlayerIndex 
                ? "Your turn to bid" 
                : `${gameManager.players[gameManager.currentPlayerIndex].name} is thinking...`
            )}
            {currentPhase === 'playing' && (
              gameManager.currentPlayerIndex === humanPlayerIndex 
                ? "Your turn" 
                : `${gameManager.players[gameManager.currentPlayerIndex].name} is playing...`
            )}
            {currentPhase === 'trumpSelection' && gameManager.highestBidder !== null && (
              gameManager.highestBidder === humanPlayerIndex
                ? "You won the bid! Pick trump"
                : `${gameManager.players[gameManager.highestBidder].name} is choosing trump...`
            )}
          </Text>
          {gameManager.trumpSuit && currentPhase === 'playing' && (
            <Text style={styles.trumpText}>
              Trump: {gameManager.trumpSuit}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef3e2', // Warm cream, like candlelight
  },
  loadingText: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 40,
    color: '#8b7355',
    fontWeight: '600',
  },
  playArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5c8a7f', // Soft sage green - calm and inviting
    margin: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#7ba89a',
  },
  controlArea: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#e07a5f', // Warm terracotta - friendly and inviting
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 0,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  gameOverContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(240, 180, 90, 0.98)',
    padding: 40,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#d4a05a',
  },
  gameOverText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3d2817',
  },
  winnerText: {
    fontSize: 24,
    color: '#3d2817',
    fontWeight: '700',
  },
  turnIndicator: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    padding: 16,
    backgroundColor: 'rgba(92, 138, 127, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#7ba89a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  turnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  trumpText: {
    color: '#ffd89b',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  winnerBanner: {
    position: 'absolute',
    top: '45%',
    backgroundColor: 'rgba(240, 180, 90, 0.98)',
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#d4a05a',
  },
  winnerBannerText: {
    color: '#3d2817',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionMessageBanner: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(224, 122, 95, 0.98)',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#c96850',
    zIndex: 100,
  },
  actionMessageText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hintContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(92, 138, 127, 0.3)',
    borderRadius: 12,
  },
  hintText: {
    color: '#5c8a7f',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

