import { type RoomData, type GameState, type PlayerState } from '../game/types';
import { initializeGame } from '../game/gameLogic';

// In-memory storage for demo mode
const rooms: Record<string, RoomData> = {};
const gameStates: Record<string, GameState> = {};
const listeners: Record<string, Function[]> = {};

// Always spread a new object so React sees a new reference and re-renders
function notifyRoom(roomCode: string) {
    const key = `room/${roomCode}`;
    const snapshot = rooms[roomCode] ? { ...rooms[roomCode], players: { ...rooms[roomCode].players } } : null;
    if (listeners[key]) {
        listeners[key].forEach(cb => cb(snapshot));
    }
}

function notifyGame(roomCode: string) {
    const key = `game/${roomCode}`;
    const snapshot = gameStates[roomCode] ?? null;
    if (listeners[key]) {
        listeners[key].forEach(cb => cb(snapshot));
    }
}

function generateRoomCode(): string {
    return 'DEMO12';
}

export function generatePlayerId(): string {
    return 'player-' + Math.random().toString(36).substr(2, 9);
}

// ─── Room Management ───

export async function createRoom(hostId: string, hostName: string): Promise<string> {
    const code = generateRoomCode();
    rooms[code] = {
        code,
        hostId,
        status: 'waiting',
        players: {
            [hostId]: {
                name: hostName,
                isReady: true,
                isAI: false,
            },
        },
        maxPlayers: 6,
        createdAt: Date.now(),
    };
    setTimeout(() => notifyRoom(code), 10);
    return code;
}

export async function joinRoom(roomCode: string, playerId: string, playerName: string): Promise<RoomData | null> {
    const room = rooms[roomCode];
    if (!room) return null;
    if (Object.keys(room.players).length >= room.maxPlayers) return null;

    rooms[roomCode] = {
        ...room,
        players: {
            ...room.players,
            [playerId]: { name: playerName, isReady: true, isAI: false },
        },
    };

    notifyRoom(roomCode);
    return rooms[roomCode];
}

export async function addAIPlayer(roomCode: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<void> {
    const room = rooms[roomCode];
    if (!room) return;
    if (Object.keys(room.players).length >= room.maxPlayers) return;

    const aiCount = Object.values(room.players).filter(p => p.isAI).length;
    const aiId = `ai-${Date.now()}-${aiCount}`;

    const namesByDifficulty: Record<string, string[]> = {
        easy: ['Mom', 'Nani', 'Dadi'],
        medium: ['Viraj', 'Bhai', 'Yaar'],
        hard: ['Dadi', 'Papa', 'Chacha'],
    };
    const takenNames = new Set(Object.values(room.players).map(p => p.name));
    const candidates = namesByDifficulty[difficulty] ?? [];
    const name = candidates.find(n => !takenNames.has(n)) ?? `Bot ${aiCount + 1}`;

    rooms[roomCode] = {
        ...room,
        players: {
            ...room.players,
            [aiId]: {
                name,
                isReady: true,
                isAI: true,
                aiDifficulty: difficulty,
            },
        },
    };

    notifyRoom(roomCode);
}

export async function removePlayer(roomCode: string, playerId: string): Promise<void> {
    const room = rooms[roomCode];
    if (!room) return;

    const newPlayers = { ...room.players };
    delete newPlayers[playerId];

    rooms[roomCode] = { ...room, players: newPlayers };
    notifyRoom(roomCode);
}

export async function leaveRoom(roomCode: string, playerId: string): Promise<void> {
    await removePlayer(roomCode, playerId);
}

export function subscribeToRoom(roomCode: string, callback: (room: RoomData | null) => void): () => void {
    const key = `room/${roomCode}`;
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(callback);

    // Initial callback — always send a fresh copy
    setTimeout(() => {
        const room = rooms[roomCode];
        callback(room ? { ...room, players: { ...room.players } } : null);
    }, 0);

    return () => {
        listeners[key] = listeners[key].filter(cb => cb !== callback);
    };
}

// ─── Game State ───

export async function startGame(roomCode: string, hostId: string): Promise<GameState | null> {
    const room = rooms[roomCode];
    if (!room) return null;

    const players: PlayerState[] = Object.entries(room.players).map(([id, data]) => ({
        id,
        name: data.name,
        hand: [],
        bid: -1,
        tricksWon: 0,
        score: 0,
        isAI: data.isAI,
        aiDifficulty: data.aiDifficulty,
        connected: true,
    }));

    const gameState = initializeGame(roomCode, hostId, players);
    gameStates[roomCode] = gameState;
    rooms[roomCode] = { ...room, status: 'playing' };

    notifyRoom(roomCode);
    notifyGame(roomCode);

    return gameState;
}

export async function updateGameState(roomCode: string, gameState: GameState): Promise<void> {
    gameStates[roomCode] = gameState;
    notifyGame(roomCode);
}

export function subscribeToGameState(roomCode: string, callback: (state: GameState | null) => void): () => void {
    const key = `game/${roomCode}`;
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(callback);

    setTimeout(() => {
        callback(gameStates[roomCode] ?? null);
    }, 0);

    return () => {
        listeners[key] = listeners[key].filter(cb => cb !== callback);
    };
}
