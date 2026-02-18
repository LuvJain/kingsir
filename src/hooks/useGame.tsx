import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { type GameState, type PlayerState, type Card, type Suit, type RoomData } from '../game/types';
import * as logic from '../game/gameLogic';
import * as ai from '../game/aiPlayer';
import * as room from '../services/roomService';
import * as mockRoom from '../services/mockRoomService';

interface GameContextType {
    // Connection
    playerId: string;
    playerName: string;
    roomCode: string | null;
    isHost: boolean;
    isDemo: boolean;

    // State
    gameState: GameState | null;
    myPlayer: PlayerState | null;
    myPlayerIndex: number;
    error: string | null;

    // Lobby actions
    setPlayerName: (name: string) => void;
    createRoom: (name: string) => Promise<string>;
    joinRoom: (code: string, name: string) => Promise<boolean>;
    startDemo: (name: string) => Promise<void>;
    addAI: (difficulty?: 'easy' | 'medium' | 'hard') => Promise<void>;
    removeAIPlayer: (aiId: string) => Promise<void>;
    startGame: () => Promise<void>;
    leaveRoom: () => Promise<void>;

    // Game actions
    submitBid: (bid: number) => void;
    selectTrump: (suit: Suit) => void;
    playCard: (card: Card) => void;
    acknowledgeResult: () => void;
    startNextRound: () => void;

    // Room data
    roomData: RoomData | null;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
}

export function GameProvider({ children }: { children: ReactNode }) {
    const [playerId] = useState(() => {
        const stored = localStorage.getItem('kingsir_player_id');
        if (stored) return stored;
        const id = room.generatePlayerId();
        localStorage.setItem('kingsir_player_id', id);
        return id;
    });
    const [playerName, setPlayerName] = useState(() => {
        return localStorage.getItem('kingsir_player_name') || '';
    });
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDemo, setIsDemo] = useState(false);

    const aiProcessingRef = useRef(false);
    const gameStateRef = useRef<GameState | null>(null);

    // Keep ref updated for AI/subscriptions
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Save name
    useEffect(() => {
        if (playerName) localStorage.setItem('kingsir_player_name', playerName);
    }, [playerName]);

    // Subscribe to Room updates
    useEffect(() => {
        if (!roomCode) {
            setRoomData(null);
            return;
        }

        const source = isDemo ? mockRoom : room;
        const unsubscribe = source.subscribeToRoom(roomCode, (data) => {
            setRoomData(data);
            if (!data) {
                // Room deleted or kicked
                setRoomCode(null);
                setGameState(null);
            }
        });

        return () => unsubscribe();
    }, [roomCode, isDemo]);

    // Subscribe to Game State updates
    useEffect(() => {
        if (!roomCode) return;

        const source = isDemo ? mockRoom : room;
        const unsubscribe = source.subscribeToGameState(roomCode, (state) => {
            setGameState(state);
        });

        return () => unsubscribe();
    }, [roomCode, isDemo]);

    // Derived state
    const isHost = roomData?.hostId === playerId;
    const myPlayer = gameState?.players.find(p => p.id === playerId) || null;
    const myPlayerIndex = gameState?.players.findIndex(p => p.id === playerId) ?? -1;

    const processAITurn = useCallback(async (code: string, state: GameState, aiId: string, difficulty: ai.AIDifficulty) => {
        aiProcessingRef.current = true;
        const source = isDemo ? mockRoom : room;

        // Add varying delay for "thinking"
        const delay = Math.random() * 1000 + 500;
        await new Promise(r => setTimeout(r, delay));

        try {
            let newState = state;
            const aiIdx = state.players.findIndex(p => p.id === aiId);

            if (state.phase === 'bidding') {
                const totalBidSoFar = state.players.reduce((sum, p) => sum + (p.bid >= 0 ? p.bid : 0), 0);
                const biddersCount = state.players.filter(p => p.bid >= 0).length;
                const isLastBidder = biddersCount === state.players.length - 1;

                const bid = ai.aiBid(
                    state.players[aiIdx].hand,
                    state.cardsPerPlayer,
                    totalBidSoFar,
                    isLastBidder,
                    difficulty
                );

                const error = logic.validateBid(state, aiIdx, bid);
                const safeBid = error ? 0 : bid;
                newState = logic.submitBid(state, aiIdx, safeBid);
            }
            else if (state.phase === 'trumpSelection') {
                // aiId is the highest bidder — find by id, not by currentPlayerIndex
                const trumpPlayer = state.players.find(p => p.id === aiId);
                const trump = ai.aiSelectTrump(trumpPlayer?.hand ?? [], difficulty);
                newState = logic.selectTrump(state, trump);
            }
            else if (state.phase === 'playing') {
                const aiPlayer = state.players[aiIdx];
                const card = ai.aiPlayCard(
                    aiPlayer.hand,
                    state.leadingSuit,
                    state.trumpSuit,
                    aiPlayer.bid,
                    aiPlayer.tricksWon,
                    difficulty
                );
                newState = logic.playCard(state, aiIdx, card);
            }

            // Guard: if another client already advanced the state, bail out
            const current = gameStateRef.current;
            if (
                current?.phase !== state.phase ||
                current?.currentPlayerIndex !== state.currentPlayerIndex ||
                current?.trickNumber !== state.trickNumber
            ) {
                aiProcessingRef.current = false;
                return;
            }

            // Release the lock BEFORE writing so the effect can re-fire when
            // Firebase's onValue callback updates gameState
            aiProcessingRef.current = false;
            await source.updateGameState(code, newState);

            // Handle post-trick advance
            if (newState.phase === 'trickResult') {
                setTimeout(async () => {
                    const current = gameStateRef.current;
                    if (current?.phase === 'trickResult' && current.trickWinnerId) {
                        const nextState = logic.advanceAfterTrick(current);
                        await source.updateGameState(code, nextState);
                    }
                }, 4000);
            }

        } catch (err) {
            console.error('AI Error:', err);
            aiProcessingRef.current = false;
        }
    }, [isDemo]);

    // AI Turn Logic — runs on every human client, not just host.
    // processAITurn checks the state hasn't changed before writing (optimistic guard).
    useEffect(() => {
        if (!gameState || !roomCode || aiProcessingRef.current) return;
        // Only human players trigger AI (don't let AI clients trigger other AIs)
        if (!myPlayer || myPlayer.isAI) return;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];

        // For trump selection, the acting player is the highest bidder — not currentPlayerIndex
        if (gameState.phase === 'trumpSelection') {
            const highestBidder = gameState.players.find(p => p.id === gameState.highestBidderId);
            if (highestBidder?.isAI) {
                processAITurn(roomCode, gameState, highestBidder.id, highestBidder.aiDifficulty || 'medium');
            }
            return;
        }

        // For all other phases, use currentPlayerIndex
        if (
            gameState.phase !== 'trickResult' &&
            gameState.phase !== 'roundEnd' &&
            gameState.phase !== 'gameOver' &&
            currentPlayer?.isAI
        ) {
            processAITurn(roomCode, gameState, currentPlayer.id, currentPlayer.aiDifficulty || 'medium');
        }
    }, [gameState, roomCode, myPlayer, processAITurn]);

    // Actions
    const handleCreateRoom = useCallback(async (name: string) => {
        try {
            setIsDemo(false);
            setPlayerName(name);
            const code = await room.createRoom(playerId, name);
            setRoomCode(code);
            return code;
        } catch (e) {
            console.error(e);
            setError('Failed to create room. Check network/config.');
            throw e;
        }
    }, [playerId]);

    const handleJoinRoom = useCallback(async (code: string, name: string) => {
        try {
            setIsDemo(false);
            setPlayerName(name);
            const joined = await room.joinRoom(code, playerId, name);
            if (joined) {
                setRoomCode(code);
                return true;
            }
            setError('Room not found or full.');
            return false;
        } catch (e) {
            console.error(e);
            setError('Failed to join room.');
            return false;
        }
    }, [playerId]);

    const handleStartDemo = useCallback(async (name: string) => {
        try {
            setIsDemo(true);
            setPlayerName(name);
            const code = await mockRoom.createRoom(playerId, name);
            setRoomCode(code);
            // Auto add 3 AI players for demo
            await mockRoom.addAIPlayer(code, 'easy');
            await mockRoom.addAIPlayer(code, 'medium');
            await mockRoom.addAIPlayer(code, 'hard');
        } catch (e) {
            console.error(e);
            setError('Failed to start demo.');
        }
    }, [playerId]);

    const handleAddAI = useCallback(async (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
        if (!roomCode) return;
        const source = isDemo ? mockRoom : room;
        await source.addAIPlayer(roomCode, difficulty);
    }, [roomCode, isDemo]);

    const handleRemoveAI = useCallback(async (aiId: string) => {
        if (!roomCode) return;
        const source = isDemo ? mockRoom : room;
        await source.removePlayer(roomCode, aiId);
    }, [roomCode, isDemo]);

    const handleStartGame = useCallback(async () => {
        if (!roomCode) return;
        const source = isDemo ? mockRoom : room;
        await source.startGame(roomCode, playerId);
    }, [roomCode, isDemo, playerId]);

    const handleLeaveRoom = useCallback(async () => {
        if (roomCode) {
            const source = isDemo ? mockRoom : room;
            await source.leaveRoom(roomCode, playerId);
            setRoomCode(null);
            setGameState(null);
            setRoomData(null);
            setIsDemo(false);
        }
    }, [roomCode, isDemo, playerId]);

    // Game Actions
    const handleSubmitBid = useCallback((bid: number) => {
        if (!gameState || !roomCode) return;
        const newState = logic.submitBid(gameState, myPlayerIndex, bid);
        const source = isDemo ? mockRoom : room;
        source.updateGameState(roomCode, newState);
    }, [gameState, roomCode, myPlayerIndex, isDemo]);

    const handleSelectTrump = useCallback((suit: Suit) => {
        if (!gameState || !roomCode) return;
        const newState = logic.selectTrump(gameState, suit);
        const source = isDemo ? mockRoom : room;
        source.updateGameState(roomCode, newState);
    }, [gameState, roomCode, isDemo]);

    const handlePlayCard = useCallback((card: Card) => {
        if (!gameState || !roomCode) return;
        const newState = logic.playCard(gameState, myPlayerIndex, card);
        const source = isDemo ? mockRoom : room;
        source.updateGameState(roomCode, newState);

        // Auto-advance after trick — any human client can do this;
        // the optimistic guard in the timeout prevents double-advance
        if (newState.phase === 'trickResult') {
            setTimeout(async () => {
                const current = gameStateRef.current;
                if (current?.phase === 'trickResult' && current.trickWinnerId) {
                    const nextState = logic.advanceAfterTrick(current);
                    await source.updateGameState(roomCode, nextState);
                }
            }, 3000);
        }
    }, [gameState, roomCode, myPlayerIndex, isDemo]);

    const handleAcknowledgeResult = useCallback(() => {
        if (!gameState || !roomCode || gameState.phase !== 'trickResult') return;
        const source = isDemo ? mockRoom : room;
        const nextState = logic.advanceAfterTrick(gameState);
        source.updateGameState(roomCode, nextState);
    }, [gameState, roomCode, isDemo]);

    const handleStartNextRound = useCallback(() => {
        if (!gameState || !roomCode) return;
        const newState = logic.startNextRound(gameState);
        const source = isDemo ? mockRoom : room;
        source.updateGameState(roomCode, newState);
    }, [gameState, roomCode, isDemo]);

    const value: GameContextType = {
        playerId,
        playerName,
        roomCode,
        isHost,
        isDemo,
        gameState,
        myPlayer,
        myPlayerIndex,
        error,
        roomData,
        setPlayerName,
        createRoom: handleCreateRoom,
        joinRoom: handleJoinRoom,
        startDemo: handleStartDemo,
        addAI: handleAddAI,
        removeAIPlayer: handleRemoveAI,
        startGame: handleStartGame,
        leaveRoom: handleLeaveRoom,
        submitBid: handleSubmitBid,
        selectTrump: handleSelectTrump,
        playCard: handlePlayCard,
        acknowledgeResult: handleAcknowledgeResult,
        startNextRound: handleStartNextRound,
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
