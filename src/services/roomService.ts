import { db } from '../firebase';
import { ref, set, get, onValue, update, remove, off } from 'firebase/database';
import { type RoomData, type GameState, type PlayerState } from '../game/types';
import { initializeGame } from '../game/gameLogic';

function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for clarity
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export function generatePlayerId(): string {
    return Math.random().toString(36).substring(2, 12);
}

// ─── Room Management ───

export async function createRoom(hostId: string, hostName: string): Promise<string> {
    const code = generateRoomCode();
    const roomData: RoomData = {
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
    await set(ref(db, `rooms/${code}`), roomData);
    return code;
}

export async function joinRoom(roomCode: string, playerId: string, playerName: string): Promise<RoomData | null> {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return null;

    const room = snapshot.val() as RoomData;
    const playerCount = Object.keys(room.players || {}).length;
    if (playerCount >= room.maxPlayers) return null;
    if (room.status !== 'waiting') return null;

    await update(ref(db, `rooms/${roomCode}/players/${playerId}`), {
        name: playerName,
        isReady: true,
        isAI: false,
    });

    const updatedSnapshot = await get(roomRef);
    return updatedSnapshot.val() as RoomData;
}

export async function addAIPlayer(roomCode: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<void> {
    const aiId = `ai-${generatePlayerId()}`;
    const roomRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = snapshot.val() as RoomData;
    const playerCount = Object.keys(room.players || {}).length;
    const aiCount = Object.values(room.players || {}).filter(p => p.isAI).length;

    if (playerCount >= room.maxPlayers) return;

    const namesByDifficulty: Record<string, string[]> = {
        easy: ['Mom', 'Nani', 'Dadi'],
        medium: ['Viraj', 'Bhai', 'Yaar'],
        hard: ['Dadi', 'Papa', 'Chacha'],
    };
    const takenNames = new Set(Object.values(room.players || {}).map(p => p.name));
    const candidates = namesByDifficulty[difficulty] ?? [];
    const name = candidates.find(n => !takenNames.has(n)) ?? `Bot ${aiCount + 1}`;

    await update(ref(db, `rooms/${roomCode}/players/${aiId}`), {
        name,
        isReady: true,
        isAI: true,
        aiDifficulty: difficulty,
    });
}

export async function removePlayer(roomCode: string, playerId: string): Promise<void> {
    await remove(ref(db, `rooms/${roomCode}/players/${playerId}`));
}

export async function leaveRoom(roomCode: string, playerId: string): Promise<void> {
    await removePlayer(roomCode, playerId);

    // If no players left, delete room
    const snapshot = await get(ref(db, `rooms/${roomCode}/players`));
    if (!snapshot.exists() || Object.keys(snapshot.val() || {}).length === 0) {
        await remove(ref(db, `rooms/${roomCode}`));
    }
}

export function subscribeToRoom(roomCode: string, callback: (room: RoomData | null) => void): () => void {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const handler = onValue(roomRef, (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() as RoomData : null);
    });
    return () => off(roomRef, 'value', handler);
}

// ─── Game State ───

export async function startGame(roomCode: string, hostId: string): Promise<GameState | null> {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return null;

    const room = snapshot.val() as RoomData;
    const playerEntries = Object.entries(room.players || {});

    if (playerEntries.length < 3) return null;

    const players: PlayerState[] = playerEntries.map(([id, data]) => {
        const player: PlayerState = {
            id,
            name: data.name,
            hand: [],
            bid: -1,
            tricksWon: 0,
            score: 0,
            isAI: data.isAI ?? false,
            connected: true,
        };
        if (data.aiDifficulty) player.aiDifficulty = data.aiDifficulty;
        return player;
    });

    const gameState = initializeGame(roomCode, hostId, players);

    await update(ref(db, `rooms/${roomCode}`), { status: 'playing' });
    await set(ref(db, `gameState/${roomCode}`), sanitizeGameState(gameState));

    return gameState;
}

// Strip undefined fields (Firebase rejects them) and convert empty arrays to empty objects
// so Firebase doesn't drop them entirely on write
function sanitizeGameState(gameState: GameState): any {
    return {
        ...gameState,
        // Empty arrays become {} so Firebase keeps the key; normalizeGameState converts back
        playedCards: gameState.playedCards.length > 0 ? gameState.playedCards : {},
        players: gameState.players.map(p => {
            const clean: any = {
                ...p,
                hand: p.hand.length > 0 ? p.hand : {},
            };
            Object.keys(clean).forEach(k => clean[k] === undefined && delete clean[k]);
            return clean;
        }),
    };
}

export async function updateGameState(roomCode: string, gameState: GameState): Promise<void> {
    await set(ref(db, `gameState/${roomCode}`), sanitizeGameState(gameState));
}

// Firebase converts arrays to objects on read, and drops empty arrays entirely — normalize back
function normalizeGameState(raw: any): GameState {
    return {
        ...raw,
        players: Object.values(raw.players || {}).map((p: any) => ({
            ...p,
            hand: Object.values(p.hand || []),
        })),
        playedCards: raw.playedCards ? Object.values(raw.playedCards) : [],
    };
}

export function subscribeToGameState(roomCode: string, callback: (state: GameState | null) => void): () => void {
    const stateRef = ref(db, `gameState/${roomCode}`);
    const handler = onValue(stateRef, (snapshot) => {
        callback(snapshot.exists() ? normalizeGameState(snapshot.val()) : null);
    });
    return () => off(stateRef, 'value', handler);
}
