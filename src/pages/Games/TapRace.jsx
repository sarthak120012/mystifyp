import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Copy, Check, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { generateRoomCode } from '../../lib/utils'
import { LiquidGlassButton } from '../../components/LiquidGlassButton'
import toast from 'react-hot-toast'
import './TapRace.css'

const TapRace = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [showCreateRoom, setShowCreateRoom] = useState(false)
    const [showJoinRoom, setShowJoinRoom] = useState(false)
    const [roomCode, setRoomCode] = useState('')
    const [copied, setCopied] = useState(false)
    const [currentRoom, setCurrentRoom] = useState(null)
    const [gameStatus, setGameStatus] = useState('waiting')
    const [myScore, setMyScore] = useState(0)
    const [opponentScore, setOpponentScore] = useState(0)
    const [winner, setWinner] = useState(null)

    const TARGET_SCORE = 100

    useEffect(() => {
        const checkActiveRoom = async () => {
            try {
                const { data: room } = await supabase
                    .from('game_rooms')
                    .select('*')
                    .or(`host_id.eq.${user.id},guest_id.eq.${user.id}`)
                    .eq('game_type', 'taprace')
                    .neq('status', 'finished')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                if (room) {
                    setCurrentRoom(room)
                    setRoomCode(room.room_code)
                    setGameStatus(room.status)

                    // Restore scores
                    const { data: moves } = await supabase
                        .from('game_moves')
                        .select('*')
                        .eq('room_id', room.id)

                    if (moves) {
                        let my = 0
                        let opp = 0
                        moves.forEach(move => {
                            const score = JSON.parse(move.game_state).score
                            if (move.player_id === user.id) my = Math.max(my, score)
                            else opp = Math.max(opp, score)
                        })
                        setMyScore(my)
                        setOpponentScore(opp)
                    }
                    toast.success('Rejoined active game!')
                }
            } catch (error) {
                // No active room
            }
        }

        if (user) checkActiveRoom()
    }, [user])

    useEffect(() => {
        if (currentRoom) {
            subscribeToGame()
        }
    }, [currentRoom])

    const handleCreateRoom = async () => {
        try {
            const code = generateRoomCode()
            const { data, error } = await supabase
                .from('game_rooms')
                .insert({
                    room_code: code,
                    game_type: 'taprace',
                    host_id: user.id,
                    status: 'waiting'
                })
                .select()
                .single()

            if (error) throw error

            setCurrentRoom(data)
            setRoomCode(code)
            setGameStatus('waiting')
            setShowCreateRoom(false)
            toast.success(`Room created! Code: ${code}`)
        } catch (error) {
            console.error('Error creating room:', error)
            toast.error('Failed to create room')
        }
    }

    const handleJoinRoom = async () => {
        if (!roomCode.trim()) return

        try {
            const { data: room, error } = await supabase
                .from('game_rooms')
                .select('*')
                .eq('room_code', roomCode.toUpperCase())
                .eq('game_type', 'taprace')
                .single()

            if (error || !room) {
                toast.error('Room not found')
                return
            }

            if (room.status !== 'waiting') {
                toast.error('Room is full')
                return
            }

            await supabase
                .from('game_rooms')
                .update({ guest_id: user.id, status: 'playing' })
                .eq('id', room.id)

            setCurrentRoom({ ...room, guest_id: user.id })
            setGameStatus('playing')
            setShowJoinRoom(false)
            toast.success('Joined room!')
        } catch (error) {
            console.error('Error joining room:', error)
            toast.error('Failed to join room')
        }
    }

    const subscribeToGame = () => {
        const subscription = supabase
            .channel(`taprace-${currentRoom.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'game_moves',
                filter: `room_id=eq.${currentRoom.id}`
            }, (payload) => {
                if (payload.new.player_id !== user.id) {
                    const score = JSON.parse(payload.new.game_state).score
                    setOpponentScore(score)
                    if (score >= TARGET_SCORE) {
                        setWinner('Opponent won!')
                        setGameStatus('finished')
                    }
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${currentRoom.id}`
            }, (payload) => {
                if (payload.new.guest_id && gameStatus === 'waiting') {
                    setGameStatus('playing')
                    toast.success('Opponent joined! Start tapping!')
                }
            })
            .subscribe()

        return () => subscription.unsubscribe()
    }

    const handleTap = async () => {
        if (gameStatus !== 'playing') return

        const newScore = myScore + 1
        setMyScore(newScore)

        if (newScore % 5 === 0 || newScore >= TARGET_SCORE) {
            // Sync every 5 taps or on win to save DB writes
            await supabase.from('game_moves').insert({
                room_id: currentRoom.id,
                player_id: user.id,
                move_number: newScore,
                game_state: JSON.stringify({ score: newScore })
            })
        }

        if (newScore >= TARGET_SCORE) {
            setWinner('You won!')
            setGameStatus('finished')
            await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', currentRoom.id)
        }
    }

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="page-container taprace-page">
            <div className="page-header">
                <h1>⚡ Tap Race</h1>
            </div>

            <div className="page-content">
                {!currentRoom ? (
                    <div className="game-menu">
                        <LiquidGlassButton onClick={() => setShowCreateRoom(true)} icon={<Play size={20} />} fullWidth>
                            Create Room
                        </LiquidGlassButton>
                        <LiquidGlassButton onClick={() => setShowJoinRoom(true)} variant="secondary" fullWidth>
                            Join Room
                        </LiquidGlassButton>

                        {showCreateRoom && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="room-modal">
                                <h3>Create New Room</h3>
                                <LiquidGlassButton onClick={handleCreateRoom} fullWidth>Generate Room Code</LiquidGlassButton>
                            </motion.div>
                        )}

                        {showJoinRoom && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="room-modal">
                                <h3>Join Room</h3>
                                <input
                                    type="text"
                                    placeholder="Enter room code..."
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    className="input"
                                    maxLength={6}
                                />
                                <LiquidGlassButton onClick={handleJoinRoom} fullWidth>Join Game</LiquidGlassButton>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <div className="game-arena">
                        {gameStatus === 'waiting' && (
                            <div className="room-code-display">
                                <p>Share code:</p>
                                <div className="code-container">
                                    <h2>{roomCode}</h2>
                                    <button onClick={copyRoomCode} className="copy-btn">
                                        {copied ? <Check size={20} /> : <Copy size={20} />}
                                    </button>
                                </div>
                                <span>Waiting for opponent...</span>
                            </div>
                        )}

                        {gameStatus === 'playing' && (
                            <div className="race-track">
                                <div className="score-board">
                                    <div className="my-score">
                                        <span>You</span>
                                        <strong>{myScore}</strong>
                                    </div>
                                    <div className="vs">VS</div>
                                    <div className="opp-score">
                                        <span>Opponent</span>
                                        <strong>{opponentScore}</strong>
                                    </div>
                                </div>

                                <div className="progress-bars">
                                    <div className="progress-container">
                                        <motion.div
                                            className="progress-fill my-progress"
                                            animate={{ height: `${(myScore / TARGET_SCORE) * 100}%` }}
                                        />
                                    </div>
                                    <div className="progress-container">
                                        <motion.div
                                            className="progress-fill opp-progress"
                                            animate={{ height: `${(opponentScore / TARGET_SCORE) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    className="tap-button"
                                    onClick={handleTap}
                                >
                                    <Zap size={48} />
                                    TAP!
                                </motion.button>
                            </div>
                        )}

                        {winner && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="game-result">
                                <h2>{winner}</h2>
                                <LiquidGlassButton onClick={() => navigate('/games')} fullWidth>Back to Lobby</LiquidGlassButton>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default TapRace
