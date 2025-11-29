import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Copy, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { generateRoomCode } from '../../lib/utils'
import { LiquidGlassButton } from '../../components/LiquidGlassButton'
import toast from 'react-hot-toast'
import './TicTacToe.css'

const TicTacToe = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [showCreateRoom, setShowCreateRoom] = useState(false)
    const [showJoinRoom, setShowJoinRoom] = useState(false)
    const [roomCode, setRoomCode] = useState('')
    const [copied, setCopied] = useState(false)
    const [currentRoom, setCurrentRoom] = useState(null)
    const [board, setBoard] = useState(Array(9).fill(null))
    const [isMyTurn, setIsMyTurn] = useState(false)
    const [winner, setWinner] = useState(null)
    const [gameStatus, setGameStatus] = useState('waiting')

    useEffect(() => {
        // Check for existing active room on mount
        const checkActiveRoom = async () => {
            try {
                // Check if user is host or guest in an active room
                const { data: room } = await supabase
                    .from('game_rooms')
                    .select('*')
                    .or(`host_id.eq.${user.id},guest_id.eq.${user.id}`)
                    .eq('game_type', 'tictactoe')
                    .neq('status', 'finished')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                if (room) {
                    setCurrentRoom(room)
                    setRoomCode(room.room_code)
                    setGameStatus(room.status)

                    // Restore board state
                    const { data: moves } = await supabase
                        .from('game_moves')
                        .select('*')
                        .eq('room_id', room.id)
                        .order('move_number', { ascending: true })

                    if (moves && moves.length > 0) {
                        const newBoard = Array(9).fill(null)
                        let lastMoveBy = null
                        moves.forEach(move => {
                            const state = JSON.parse(move.game_state)
                            newBoard[state.position] = state.symbol
                            lastMoveBy = move.player_id
                        })
                        setBoard(newBoard)

                        // Determine turn
                        if (room.status === 'playing') {
                            setIsMyTurn(lastMoveBy !== user.id)
                        }
                    } else {
                        // No moves yet, host's turn
                        setIsMyTurn(room.host_id === user.id)
                    }

                    toast.success('Rejoined active game!')
                }
            } catch (error) {
                console.log('No active game found')
            }
        }

        if (user) {
            checkActiveRoom()
        }
    }, [user])

    useEffect(() => {
        if (currentRoom) {
            subscribeToGame()
            checkGameState()
        }
    }, [currentRoom])

    const handleCreateRoom = async () => {
        try {
            const code = generateRoomCode()
            const { data, error } = await supabase
                .from('game_rooms')
                .insert({
                    room_code: code,
                    game_type: 'tictactoe',
                    host_id: user.id,
                    status: 'waiting'
                })
                .select()
                .single()

            if (error) throw error

            setCurrentRoom(data)
            setRoomCode(code)
            setIsMyTurn(true)
            setGameStatus('waiting')
            setShowCreateRoom(false)
            toast.success(`Room created! Code: ${code}`)
        } catch (error) {
            console.error('Error creating room:', error)
            toast.error('Failed to create room')
        }
    }

    const handleJoinRoom = async () => {
        if (!roomCode.trim()) {
            toast.error('Please enter a room code')
            return
        }

        try {
            const { data: room, error } = await supabase
                .from('game_rooms')
                .select('*')
                .eq('room_code', roomCode.toUpperCase())
                .eq('game_type', 'tictactoe')
                .single()

            if (error || !room) {
                toast.error('Room not found')
                return
            }

            if (room.status !== 'waiting') {
                toast.error('Room is full or game already started')
                return
            }

            await supabase
                .from('game_rooms')
                .update({
                    guest_id: user.id,
                    status: 'playing'
                })
                .eq('id', room.id)

            setCurrentRoom({ ...room, guest_id: user.id })
            setIsMyTurn(false)
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
            .channel(`tictactoe-${currentRoom.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'game_moves',
                    filter: `room_id=eq.${currentRoom.id}`
                },
                () => {
                    checkGameState()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'game_rooms',
                    filter: `id=eq.${currentRoom.id}`
                },
                (payload) => {
                    if (payload.new.guest_id && gameStatus === 'waiting') {
                        setGameStatus('playing')
                        toast.success('Opponent joined!')
                    }
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }

    const checkGameState = async () => {
        try {
            const { data: moves } = await supabase
                .from('game_moves')
                .select('*')
                .eq('room_id', currentRoom.id)
                .order('move_number', { ascending: true })

            const newBoard = Array(9).fill(null)
            let lastMoveBy = null

            moves?.forEach(move => {
                const state = JSON.parse(move.game_state)
                newBoard[state.position] = state.symbol
                lastMoveBy = move.player_id
            })

            setBoard(newBoard)

            if (gameStatus === 'playing') {
                setIsMyTurn(lastMoveBy !== user.id)
            }

            const winnerSymbol = calculateWinner(newBoard)
            if (winnerSymbol) {
                const isWinner = (winnerSymbol === 'X' && currentRoom.host_id === user.id) ||
                    (winnerSymbol === 'O' && currentRoom.guest_id === user.id)
                setWinner(isWinner ? 'You won!' : 'You lost!')
                setGameStatus('finished')

                if (isWinner) {
                    await awardPoints(user.id, 10)
                }
            } else if (newBoard.every(cell => cell !== null)) {
                setWinner('Draw!')
                setGameStatus('finished')
            }
        } catch (error) {
            console.error('Error checking game state:', error)
        }
    }

    const calculateWinner = (squares) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ]

        for (let [a, b, c] of lines) {
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a]
            }
        }
        return null
    }

    const awardPoints = async (userId, points) => {
        try {
            const today = new Date().toISOString().split('T')[0]

            const { data: leaderboard } = await supabase
                .from('leaderboard')
                .select('*')
                .eq('user_id', userId)
                .eq('date', today)
                .single()

            if (leaderboard) {
                await supabase
                    .from('leaderboard')
                    .update({ points: leaderboard.points + points })
                    .eq('id', leaderboard.id)
            } else {
                await supabase
                    .from('leaderboard')
                    .insert({
                        user_id: userId,
                        date: today,
                        points
                    })
            }
        } catch (error) {
            console.error('Error awarding points:', error)
        }
    }

    const handleCellClick = async (index) => {
        if (!isMyTurn || board[index] || gameStatus !== 'playing') return

        try {
            const symbol = currentRoom.host_id === user.id ? 'X' : 'O'

            const { data: moves } = await supabase
                .from('game_moves')
                .select('*')
                .eq('room_id', currentRoom.id)

            const moveNumber = (moves?.length || 0) + 1

            await supabase
                .from('game_moves')
                .insert({
                    room_id: currentRoom.id,
                    player_id: user.id,
                    move_number: moveNumber,
                    game_state: JSON.stringify({ position: index, symbol })
                })

            setIsMyTurn(false)
        } catch (error) {
            console.error('Error making move:', error)
            toast.error('Failed to make move')
        }
    }

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success('Room code copied!')
    }

    const handlePlayAgain = async () => {
        await supabase
            .from('game_moves')
            .delete()
            .eq('room_id', currentRoom.id)

        setBoard(Array(9).fill(null))
        setWinner(null)
        setGameStatus('playing')
        setIsMyTurn(currentRoom.host_id === user.id)
    }

    return (
        <div className="page-container tictactoe-page">
            <div className="page-header">
                <h1>⭕ Tic-Tac-Toe</h1>
            </div>

            <div className="page-content">
                {!currentRoom ? (
                    <div className="game-menu">
                        <LiquidGlassButton
                            onClick={() => setShowCreateRoom(true)}
                            icon={<Play size={20} />}
                            fullWidth
                        >
                            Create Room
                        </LiquidGlassButton>

                        <LiquidGlassButton
                            onClick={() => setShowJoinRoom(true)}
                            variant="secondary"
                            fullWidth
                        >
                            Join Room
                        </LiquidGlassButton>

                        {showCreateRoom && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="room-modal"
                            >
                                <h3>Create New Room</h3>
                                <p>Click below to generate a room code and share it with a friend!</p>
                                <LiquidGlassButton onClick={handleCreateRoom} fullWidth>
                                    Generate Room Code
                                </LiquidGlassButton>
                            </motion.div>
                        )}

                        {showJoinRoom && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="room-modal"
                            >
                                <h3>Join Room</h3>
                                <input
                                    type="text"
                                    placeholder="Enter room code..."
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    className="input"
                                    maxLength={6}
                                />
                                <LiquidGlassButton onClick={handleJoinRoom} fullWidth>
                                    Join Game
                                </LiquidGlassButton>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <div className="game-arena">
                        {gameStatus === 'waiting' && (
                            <div className="room-code-display">
                                <p>Share this code with your friend:</p>
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
                            <div className="game-status">
                                <p>{isMyTurn ? "Your turn!" : "Opponent's turn..."}</p>
                                <p>You are: {currentRoom.host_id === user.id ? 'X' : 'O'}</p>
                            </div>
                        )}

                        <div className="tictactoe-board">
                            {board.map((cell, index) => (
                                <motion.button
                                    key={index}
                                    whileHover={!cell && isMyTurn && gameStatus === 'playing' ? { scale: 1.05 } : {}}
                                    whileTap={!cell && isMyTurn && gameStatus === 'playing' ? { scale: 0.95 } : {}}
                                    className={`tictactoe-cell ${cell ? 'filled' : ''}`}
                                    onClick={() => handleCellClick(index)}
                                    disabled={!isMyTurn || !!cell || gameStatus !== 'playing'}
                                >
                                    {cell}
                                </motion.button>
                            ))}
                        </div>

                        {winner && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="game-result"
                            >
                                <h2>{winner}</h2>
                                <div className="result-actions">
                                    <LiquidGlassButton onClick={handlePlayAgain} fullWidth>
                                        Play Again
                                    </LiquidGlassButton>
                                    <LiquidGlassButton
                                        onClick={() => navigate('/games')}
                                        variant="secondary"
                                        fullWidth
                                    >
                                        Back to Lobby
                                    </LiquidGlassButton>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default TicTacToe
