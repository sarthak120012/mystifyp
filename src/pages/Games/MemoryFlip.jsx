import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Copy, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { generateRoomCode } from '../../lib/utils'
import { LiquidGlassButton } from '../../components/LiquidGlassButton'
import toast from 'react-hot-toast'
import './MemoryFlip.css'

const CARDS = ['🍎', '🍌', '🍇', '🍊', '🍓', '🥝', '🍒', '🍍']
const DECK = [...CARDS, ...CARDS].sort(() => Math.random() - 0.5)

const MemoryFlip = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [showCreateRoom, setShowCreateRoom] = useState(false)
    const [showJoinRoom, setShowJoinRoom] = useState(false)
    const [roomCode, setRoomCode] = useState('')
    const [currentRoom, setCurrentRoom] = useState(null)
    const [gameStatus, setGameStatus] = useState('waiting')
    const [cards, setCards] = useState(DECK.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false })))
    const [flippedIndices, setFlippedIndices] = useState([])
    const [isMyTurn, setIsMyTurn] = useState(false)
    const [scores, setScores] = useState({ host: 0, guest: 0 })
    const [winner, setWinner] = useState(null)

    useEffect(() => {
        const checkActiveRoom = async () => {
            try {
                const { data: room } = await supabase
                    .from('game_rooms')
                    .select('*')
                    .or(`host_id.eq.${user.id},guest_id.eq.${user.id}`)
                    .eq('game_type', 'memoryflip')
                    .neq('status', 'finished')
                    .single()

                if (room) {
                    setCurrentRoom(room)
                    setGameStatus(room.status)
                    // Restore state logic would go here (simplified for brevity)
                    toast.success('Rejoined active game!')
                }
            } catch (e) { }
        }
        if (user) checkActiveRoom()
    }, [user])

    useEffect(() => {
        if (currentRoom) subscribeToGame()
    }, [currentRoom])

    const subscribeToGame = () => {
        const subscription = supabase
            .channel(`memory-${currentRoom.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_moves', filter: `room_id=eq.${currentRoom.id}` },
                (payload) => {
                    const move = JSON.parse(payload.new.game_state)
                    handleRemoteMove(move)
                })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${currentRoom.id}` },
                (payload) => {
                    if (payload.new.guest_id && gameStatus === 'waiting') {
                        setGameStatus('playing')
                        setIsMyTurn(currentRoom.host_id === user.id)
                        toast.success('Game started!')
                    }
                })
            .subscribe()
        return () => subscription.unsubscribe()
    }

    const handleRemoteMove = (move) => {
        if (move.type === 'flip') {
            setCards(prev => prev.map((c, i) => i === move.index ? { ...c, flipped: true } : c))
        } else if (move.type === 'match') {
            setCards(prev => prev.map(c => move.indices.includes(c.id) ? { ...c, matched: true } : c))
            setScores(move.scores)
            setIsMyTurn(move.nextTurn === user.id)
        } else if (move.type === 'reset') {
            setCards(prev => prev.map((c, i) => move.indices.includes(i) ? { ...c, flipped: false } : c))
            setIsMyTurn(move.nextTurn === user.id)
        }
    }

    const handleCardClick = async (index) => {
        if (!isMyTurn || cards[index].flipped || cards[index].matched || flippedIndices.length >= 2) return

        // Flip locally
        const newCards = [...cards]
        newCards[index].flipped = true
        setCards(newCards)

        const newFlipped = [...flippedIndices, index]
        setFlippedIndices(newFlipped)

        // Broadcast flip
        await supabase.from('game_moves').insert({
            room_id: currentRoom.id,
            player_id: user.id,
            move_number: Date.now(),
            game_state: JSON.stringify({ type: 'flip', index })
        })

        if (newFlipped.length === 2) {
            const [first, second] = newFlipped
            if (cards[first].emoji === cards[second].emoji) {
                // Match
                const isHost = currentRoom.host_id === user.id
                const newScores = { ...scores, [isHost ? 'host' : 'guest']: scores[isHost ? 'host' : 'guest'] + 1 }
                setScores(newScores)

                await new Promise(r => setTimeout(r, 500))

                await supabase.from('game_moves').insert({
                    room_id: currentRoom.id,
                    player_id: user.id,
                    move_number: Date.now(),
                    game_state: JSON.stringify({
                        type: 'match',
                        indices: [first, second],
                        scores: newScores,
                        nextTurn: user.id // Keep turn on match
                    })
                })
                setCards(prev => prev.map((c, i) => [first, second].includes(i) ? { ...c, matched: true } : c))
                setFlippedIndices([])
            } else {
                // No match
                await new Promise(r => setTimeout(r, 1000))
                const nextPlayer = currentRoom.host_id === user.id ? currentRoom.guest_id : currentRoom.host_id

                await supabase.from('game_moves').insert({
                    room_id: currentRoom.id,
                    player_id: user.id,
                    move_number: Date.now(),
                    game_state: JSON.stringify({
                        type: 'reset',
                        indices: [first, second],
                        nextTurn: nextPlayer
                    })
                })
                setCards(prev => prev.map((c, i) => [first, second].includes(i) ? { ...c, flipped: false } : c))
                setFlippedIndices([])
                setIsMyTurn(false)
            }
        }
    }

    const handleCreateRoom = async () => {
        const code = generateRoomCode()
        const { data } = await supabase.from('game_rooms').insert({
            room_code: code, game_type: 'memoryflip', host_id: user.id, status: 'waiting'
        }).select().single()
        setCurrentRoom(data)
        setRoomCode(code)
        setShowCreateRoom(false)
    }

    const handleJoinRoom = async () => {
        const { data: room } = await supabase.from('game_rooms').select('*').eq('room_code', roomCode).single()
        if (room) {
            await supabase.from('game_rooms').update({ guest_id: user.id, status: 'playing' }).eq('id', room.id)
            setCurrentRoom({ ...room, guest_id: user.id })
            setGameStatus('playing')
            setShowJoinRoom(false)
        }
    }

    return (
        <div className="page-container memory-page">
            <div className="page-header"><h1>🎴 Memory Flip</h1></div>
            <div className="page-content">
                {!currentRoom ? (
                    <div className="game-menu">
                        <LiquidGlassButton onClick={() => setShowCreateRoom(true)} icon={<Play size={20} />} fullWidth>Create Room</LiquidGlassButton>
                        <LiquidGlassButton onClick={() => setShowJoinRoom(true)} variant="secondary" fullWidth>Join Room</LiquidGlassButton>
                        {showCreateRoom && <div className="room-modal"><LiquidGlassButton onClick={handleCreateRoom}>Generate Code</LiquidGlassButton></div>}
                        {showJoinRoom && <div className="room-modal"><input value={roomCode} onChange={e => setRoomCode(e.target.value)} /><LiquidGlassButton onClick={handleJoinRoom}>Join</LiquidGlassButton></div>}
                    </div>
                ) : (
                    <div className="game-arena">
                        {gameStatus === 'waiting' ? <h2>Code: {roomCode}</h2> : (
                            <>
                                <div className="score-board">
                                    <div>Host: {scores.host}</div>
                                    <div>Guest: {scores.guest}</div>
                                    <div>{isMyTurn ? "Your Turn" : "Opponent's Turn"}</div>
                                </div>
                                <div className="memory-grid">
                                    {cards.map((card, i) => (
                                        <motion.div
                                            key={i}
                                            className={`memory-card ${card.flipped || card.matched ? 'flipped' : ''}`}
                                            onClick={() => handleCardClick(i)}
                                            animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }}
                                        >
                                            <div className="card-front">❓</div>
                                            <div className="card-back">{card.emoji}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MemoryFlip
