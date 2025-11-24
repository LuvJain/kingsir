// Simple multiplayer service - can be extended with Firebase/Socket.io later
export interface Room {
  id: string;
  hostId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  gameStarted: boolean;
}

export interface RoomPlayer {
  id: string;
  name: string;
  isReady: boolean;
}

class MultiplayerService {
  private rooms: Map<string, Room> = new Map();
  private currentPlayerId: string = '';

  generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  generatePlayerId(): string {
    if (!this.currentPlayerId) {
      this.currentPlayerId = Math.random().toString(36).substring(2, 15);
    }
    return this.currentPlayerId;
  }

  createRoom(hostName: string, maxPlayers: number = 6): Room {
    const roomId = this.generateRoomId();
    const hostId = this.generatePlayerId();
    
    const room: Room = {
      id: roomId,
      hostId,
      players: [{
        id: hostId,
        name: hostName,
        isReady: false,
      }],
      maxPlayers,
      gameStarted: false,
    };

    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, playerName: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.players.length >= room.maxPlayers) return null;
    if (room.gameStarted) return null;

    const playerId = this.generatePlayerId();
    room.players.push({
      id: playerId,
      name: playerName,
      isReady: false,
    });

    return room;
  }

  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  setPlayerReady(roomId: string, playerId: string, ready: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    player.isReady = ready;
    return true;
  }

  canStartGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.players.length < 3) return false;
    
    return room.players.every(p => p.isReady);
  }

  startGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !this.canStartGame(roomId)) return false;

    room.gameStarted = true;
    return true;
  }
}

export const multiplayerService = new MultiplayerService();
