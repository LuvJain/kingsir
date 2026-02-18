import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { motion, AnimatePresence } from 'framer-motion';

export function LobbyScreen() {
    const {
        createRoom, joinRoom, addAI, removeAIPlayer, startGame, leaveRoom, roomData, playerId, error, startDemo
    } = useGame();

    const [mode, setMode] = useState<'menu' | 'join'>('menu');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsProcessing(true);
        await createRoom(name.trim());
        setIsProcessing(false);
    };

    const handleJoin = async () => {
        if (!name.trim() || !code.trim()) return;
        setIsProcessing(true);
        await joinRoom(code.trim(), name.trim());
        setIsProcessing(false);
    };

    // Convert map to array for display
    const players = roomData ? Object.entries(roomData.players || {}).map(([id, p]) => ({
        id,
        name: p.name,
        isReady: p.isReady,
        isAI: p.isAI,
        aiDifficulty: p.aiDifficulty
    })) : [];
    const isHost = roomData?.hostId === playerId;
    const canStart = players.length >= 3;

    // Waiting Room View
    if (roomData) {
        return (
            <motion.div
                className="lobby"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="lobby-card">
                    <div className="room-code">
                        <div className="room-code-label">Room Code</div>
                        <div className="room-code-value">{roomData.code}</div>
                    </div>

                    <div className="player-list">
                        <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                            WAITING FOR PLAYERS ({players.length}/6)
                        </div>
                        {players.map(p => (
                            <motion.div
                                key={p.id}
                                className="player-item"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="player-item-name">
                                    {p.name}
                                    {p.id === playerId && <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontSize: 11 }}>(You)</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    {p.id === roomData.hostId && <span className="player-item-badge badge-host">HOST</span>}
                                    {p.isAI && <span className="player-item-badge badge-ai">BOT ({p.aiDifficulty?.toUpperCase()})</span>}
                                    {isHost && p.isAI && (
                                        <button className="remove-btn" onClick={() => removeAIPlayer(p.id)}>×</button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {isHost && players.length < 6 && (
                        <div className="add-ai-row">
                            <button className="add-ai-btn" onClick={() => addAI('easy')}>+ Easy Bot</button>
                            <button className="add-ai-btn" onClick={() => addAI('medium')}>+ Med Bot</button>
                            <button className="add-ai-btn" onClick={() => addAI('hard')}>+ Hard Bot</button>
                        </div>
                    )}

                    {isHost ? (
                        <button
                            className="primary-btn"
                            onClick={startGame}
                            disabled={!canStart}
                            style={{
                                marginTop: 20,
                                opacity: canStart ? 1 : 0.5,
                                background: canStart ? 'linear-gradient(135deg, var(--gold-dim), var(--gold))' : 'var(--bg-elevated)'
                            }}
                        >
                            {canStart ? 'Start Game' : 'Waiting for 3+ players...'}
                        </button>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 24, fontStyle: 'italic' }}>
                            Waiting for host to start...
                        </div>
                    )}

                    <button className="secondary-btn" onClick={leaveRoom} style={{ marginTop: 12 }}>
                        Leave Room
                    </button>
                </div>
            </motion.div>
        );
    }

    // Main Menu View
    return (
        <motion.div
            className="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="lobby-title">Kingsir</div>
            <div className="lobby-subtitle">Real-time Multiplayer Card Game</div>

            <AnimatePresence mode="wait">
                {mode === 'menu' ? (
                    <motion.div
                        key="menu"
                        className="lobby-menu"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ width: '100%', maxWidth: 400 }}
                    >
                        <div className="lobby-input-group" style={{ marginBottom: 20 }}>
                            <input
                                className="lobby-input"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={12}
                            />
                        </div>

                        <button className="lobby-btn" onClick={handleCreate} disabled={!name.trim() || isProcessing}>
                            <div className="lobby-btn-title">Create Room</div>
                            <div className="lobby-btn-desc">Host a new game and invite friends</div>
                        </button>

                        <button className="lobby-btn" onClick={() => setMode('join')} disabled={!name.trim() || isProcessing}>
                            <div className="lobby-btn-title">Join Room</div>
                            <div className="lobby-btn-desc">Enter a code to join an existing game</div>
                        </button>

                        <button className="lobby-btn secondary" onClick={async () => {
                            if (!name.trim()) return;
                            setIsProcessing(true);
                            await startDemo(name.trim());
                            setIsProcessing(false);
                        }} disabled={!name.trim() || isProcessing} style={{ marginTop: 12, background: 'rgba(255,255,255,0.05)' }}>
                            <div className="lobby-btn-title">Play Offline Demo</div>
                            <div className="lobby-btn-desc">Practice against AI bots immediately</div>
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="join"
                        className="lobby-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <h3 style={{ fontSize: 20, marginBottom: 16 }}>Join Game</h3>
                        <input
                            className="lobby-input"
                            placeholder="Room Code (6 chars)"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            autoFocus
                        />
                        <button
                            className="primary-btn"
                            onClick={handleJoin}
                            disabled={!code.trim() || isProcessing}
                        >
                            {isProcessing ? 'Joining...' : 'Join Room'}
                        </button>
                        <button className="secondary-btn" onClick={() => setMode('menu')}>
                            Back
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <motion.div
                    className="error-toast"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                >
                    {error}
                </motion.div>
            )}
        </motion.div>
    );
}
