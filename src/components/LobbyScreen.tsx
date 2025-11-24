import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { multiplayerService, Room } from '../services/MultiplayerService';
import { AIDifficulty } from '../services/AIPlayer';

interface LobbyScreenProps {
  onStartGame: (playerNames: string[], currentPlayerIndex: number, aiPlayers?: { index: number; difficulty: AIDifficulty }[]) => void;
}

interface PlayerSlot {
  type: 'human' | 'ai';
  name: string;
  difficulty?: AIDifficulty;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStartGame }) => {
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'waiting' | 'singleplayer'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [numPlayers, setNumPlayers] = useState(4);
  const [playerSlots, setPlayerSlots] = useState<PlayerSlot[]>([
    { type: 'human', name: 'You' },
    { type: 'ai', name: 'AI Player 1', difficulty: 'medium' },
    { type: 'ai', name: 'AI Player 2', difficulty: 'medium' },
    { type: 'ai', name: 'AI Player 3', difficulty: 'medium' },
  ]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    const room = multiplayerService.createRoom(playerName, numPlayers);
    setCurrentRoom(room);
    setRoomCode(room.id);
    setMode('waiting');
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter room code');
      return;
    }
    
    const room = multiplayerService.joinRoom(roomCode.toUpperCase(), playerName);
    if (!room) {
      Alert.alert('Error', 'Room not found or full');
      return;
    }
    
    setCurrentRoom(room);
    setMode('waiting');
  };

  const handleStartGame = () => {
    if (!currentRoom) return;
    
    if (currentRoom.players.length < 3) {
      Alert.alert('Error', 'Need at least 3 players to start');
      return;
    }

    const playerNames = currentRoom.players.map(p => p.name);
    const myIndex = currentRoom.players.findIndex(p => p.id === multiplayerService.generatePlayerId());
    onStartGame(playerNames, myIndex);
  };

  const handlePassAndPlay = () => {
    const names = Array.from({ length: numPlayers }, (_, i) => `Player ${i + 1}`);
    onStartGame(names, 0, []);
  };

  const handleSinglePlayerStart = () => {
    const names = playerSlots.map(slot => slot.name);
    const aiPlayers = playerSlots
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => slot.type === 'ai')
      .map(({ index, slot }) => ({ index, difficulty: slot.difficulty! }));
    
    onStartGame(names, 0, aiPlayers);
  };

  const togglePlayerType = (index: number) => {
    const newSlots = [...playerSlots];
    if (index === 0) return; // Can't change first player (you)
    
    if (newSlots[index].type === 'human') {
      newSlots[index] = { type: 'ai', name: `AI Player ${index}`, difficulty: 'medium' };
    } else {
      newSlots[index] = { type: 'human', name: `Player ${index + 1}` };
    }
    setPlayerSlots(newSlots);
  };

  const cycleAIDifficulty = (index: number) => {
    const newSlots = [...playerSlots];
    if (newSlots[index].type !== 'ai') return;
    
    const difficulties: AIDifficulty[] = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(newSlots[index].difficulty!);
    const nextIndex = (currentIndex + 1) % difficulties.length;
    newSlots[index].difficulty = difficulties[nextIndex];
    setPlayerSlots(newSlots);
  };

  if (mode === 'menu') {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Kingsir</Text>
          <Text style={styles.subtitle}>Gather 'round for cards</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setMode('singleplayer')}>
            <Text style={styles.menuButtonText}>🎮 Play with AI</Text>
            <Text style={styles.menuButtonSubtext}>Cozy solo game with computer players</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={handlePassAndPlay}>
            <Text style={styles.menuButtonText}>👥 Pass & Play</Text>
            <Text style={styles.menuButtonSubtext}>Share device with family & friends</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => setMode('create')}>
            <Text style={styles.menuButtonText}>🏠 Create Room</Text>
            <Text style={styles.menuButtonSubtext}>Host a multiplayer game</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => setMode('join')}>
            <Text style={styles.menuButtonText}>🚪 Join Room</Text>
            <Text style={styles.menuButtonSubtext}>Join an existing game</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playerCountContainer}>
          <Text style={styles.label}>Number of Players:</Text>
          <View style={styles.playerCountButtons}>
            {[3, 4, 5, 6].map(num => (
              <TouchableOpacity
                key={num}
                style={[styles.playerCountButton, numPlayers === num && styles.playerCountButtonActive]}
                onPress={() => setNumPlayers(num)}
              >
                <Text style={[styles.playerCountText, numPlayers === num && styles.playerCountTextActive]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (mode === 'singleplayer') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.singlePlayerContainer} contentContainerStyle={styles.singlePlayerContent}>
          <Text style={styles.formTitle}>Setup Your Game</Text>
          <Text style={styles.singlePlayerSubtext}>Configure players and AI opponents</Text>

          {playerSlots.map((slot, index) => (
            <View key={index} style={styles.playerSlotCard}>
              <View style={styles.playerSlotHeader}>
                <Text style={styles.playerSlotNumber}>Player {index + 1}</Text>
                {index > 0 && (
                  <TouchableOpacity
                    style={styles.typeToggle}
                    onPress={() => togglePlayerType(index)}
                  >
                    <Text style={styles.typeToggleText}>
                      {slot.type === 'human' ? '👤 Human' : '🤖 AI'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {slot.type === 'ai' && (
                <TouchableOpacity
                  style={styles.difficultyButton}
                  onPress={() => cycleAIDifficulty(index)}
                >
                  <Text style={styles.difficultyLabel}>Difficulty:</Text>
                  <Text style={[
                    styles.difficultyText,
                    slot.difficulty === 'easy' && styles.difficultyEasy,
                    slot.difficulty === 'medium' && styles.difficultyMedium,
                    slot.difficulty === 'hard' && styles.difficultyHard,
                  ]}>
                    {slot.difficulty?.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.primaryButton} onPress={handleSinglePlayerStart}>
            <Text style={styles.primaryButtonText}>Start Game</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode('menu')}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (mode === 'create' || mode === 'join') {
    return (
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{mode === 'create' ? 'Create Room' : 'Join Room'}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            placeholderTextColor="#8b6f47"
            value={playerName}
            onChangeText={setPlayerName}
            autoCapitalize="words"
          />

          {mode === 'join' && (
            <TextInput
              style={styles.input}
              placeholder="Room Code"
              placeholderTextColor="#8b6f47"
              value={roomCode}
              onChangeText={setRoomCode}
              autoCapitalize="characters"
              maxLength={6}
            />
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={mode === 'create' ? handleCreateRoom : handleJoinRoom}
          >
            <Text style={styles.primaryButtonText}>
              {mode === 'create' ? 'Create' : 'Join'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode('menu')}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mode === 'waiting' && currentRoom) {
    const isHost = currentRoom.players[0].id === multiplayerService.generatePlayerId();
    
    return (
      <View style={styles.container}>
        <View style={styles.waitingContainer}>
          <Text style={styles.formTitle}>Room: {currentRoom.id}</Text>
          <Text style={styles.waitingSubtext}>Share this code with friends</Text>

          <View style={styles.playersContainer}>
            <Text style={styles.playersTitle}>Players ({currentRoom.players.length}/{currentRoom.maxPlayers})</Text>
            {currentRoom.players.map((player, index) => (
              <View key={player.id} style={styles.playerItem}>
                <Text style={styles.playerName}>
                  {player.name} {index === 0 && '(Host)'}
                </Text>
              </View>
            ))}
          </View>

          {isHost && (
            <TouchableOpacity
              style={[styles.primaryButton, currentRoom.players.length < 3 && styles.disabledButton]}
              onPress={handleStartGame}
              disabled={currentRoom.players.length < 3}
            >
              <Text style={styles.primaryButtonText}>Start Game</Text>
            </TouchableOpacity>
          )}

          {!isHost && (
            <Text style={styles.waitingText}>Waiting for host to start...</Text>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode('menu')}>
            <Text style={styles.secondaryButtonText}>Leave Room</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4e8d8', // Warm cream
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 52,
    fontWeight: '800',
    color: '#5a4a3a', // Warm brown
    marginBottom: 8,
    textShadowColor: 'rgba(212, 165, 116, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 19,
    color: '#8b6f47',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  menuContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 14,
  },
  menuButton: {
    backgroundColor: '#e8d5c4', // Soft wood
    padding: 22,
    borderRadius: 18,
    borderWidth: 0,
    shadowColor: '#8b6f47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  menuButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3d2817',
    textAlign: 'center',
    marginBottom: 4,
  },
  menuButtonSubtext: {
    fontSize: 14,
    color: '#8b6f47',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  playerCountContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#f5e6d3',
    marginBottom: 12,
    fontWeight: '600',
  },
  playerCountButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  playerCountButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2d5f3f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8b6f47',
  },
  playerCountButtonActive: {
    backgroundColor: '#d4a574',
    borderColor: '#2c1810',
  },
  playerCountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f5e6d3',
  },
  playerCountTextActive: {
    color: '#2c1810',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#f5e6d3',
    padding: 30,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d4a574',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c1810',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d4a574',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#2c1810',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2d5f3f',
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1a4d2e',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#f5e6d3',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    padding: 14,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#8b6f47',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  waitingContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#f5e6d3',
    padding: 30,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d4a574',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  waitingSubtext: {
    fontSize: 14,
    color: '#8b6f47',
    textAlign: 'center',
    marginBottom: 24,
  },
  playersContainer: {
    marginBottom: 24,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c1810',
    marginBottom: 12,
  },
  playerItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8dcc8',
  },
  playerName: {
    fontSize: 16,
    color: '#2c1810',
    fontWeight: '500',
  },
  waitingText: {
    fontSize: 16,
    color: '#8b6f47',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 16,
  },
  singlePlayerContainer: {
    width: '100%',
    maxWidth: 450,
  },
  singlePlayerContent: {
    backgroundColor: '#fff9f0',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#8b6f47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  singlePlayerSubtext: {
    fontSize: 15,
    color: '#8b6f47',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  playerSlotCard: {
    backgroundColor: '#e8d5c4',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#8b6f47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerSlotNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3d2817',
  },
  typeToggle: {
    backgroundColor: '#c9a882',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3d2817',
  },
  difficultyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff9f0',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  difficultyLabel: {
    fontSize: 14,
    color: '#8b6f47',
    fontWeight: '600',
  },
  difficultyText: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyEasy: {
    backgroundColor: '#a8d5a3',
    color: '#2d5f2d',
  },
  difficultyMedium: {
    backgroundColor: '#f5d76e',
    color: '#8b6914',
  },
  difficultyHard: {
    backgroundColor: '#f5a3a3',
    color: '#8b2e2e',
  },
});
