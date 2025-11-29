import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { generateRoomCode } from '../../lib/utils'
import { LiquidGlassButton } from '../../components/LiquidGlassButton'
import toast from 'react-hot-toast'
import './Bingo.css'

const Bingo = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [currentRoom, setCurrentRoom] = useState(null)
    const [roomCode, setRoomCode] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [showJoin, setShowJoin] = useState(false)
    const [board, setBoard] = useState([])
    const [calledNumbers, setCalledNumbers] = useState([])
    const [gameStatus, setGameStatus] = useState('waiting')

    useEffect(() => {
        // Rejoin logic (simplified)
        const check = async () => {
            const { data } = await supabase.from('game_rooms').select('*').or(`host_id.eq.${user.id},guest_id.eq.${user.id}`).eq('game_type', 'bingo').neq('status', 'finished').single()
            if (data) { setCurrentRoom(data); setGameStatus(data.status); setRoomCode(data.room_code); }
        }
        if (user) check()
    }, [user])

    useEffect(() => {
        if (currentRoom) {
            const sub = supabase.channel(`bingo-${currentRoom.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'game_moves', filter: `room_id=eq.${currentRoom.id}` },
                    (payload) => {
                        const move = JSON.parse(payload.new.game_state)
                        if (move.type === 'call') setCalledNumbers(prev => [...prev, move.number])
                        if (move.type === 'win') { setGameStatus('finished'); toast.success('Game Over!'); }
                    })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${currentRoom.id}` },
                    (payload) => { if (payload.new.status === 'playing') { setGameStatus('playing'); generateBoard(); } })
                .subscribe()
            return () => sub.unsubscribe()
        }
    }, [currentRoom])

    const generateBoard = () => {
        const nums = Array.from({ length: 25 }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
        setBoard(nums)
    }

    const handleCreate = async () => {
        const code = generateRoomCode()
        const { data } = await supabase.from('game_rooms').insert({ room_code: code, game_type: 'bingo', host_id: user.id }).select().single()
        setCurrentRoom(data); setRoomCode(code); setShowCreate(false);
    }

    const handleJoin = async () => {
        const { data } = await supabase.from('game_rooms').select('*').eq('room_code', roomCode).single()
        if (data) {
            await supabase.from('game_rooms').update({ guest_id: user.id, status: 'playing' }).eq('id', data.id)
            setCurrentRoom(data); setGameStatus('playing'); generateBoard(); setShowJoin(false);
        }
    }

    const callNumber = async () => {
        if (currentRoom.host_id !== user.id) return
        const num = Math.floor(Math.random() * 25) + 1
        await supabase.from('game_moves').insert({
            room_id: currentRoom.id, player_id: user.id, move_number: Date.now(),
            game_state: JSON.stringify({ type: 'call', number: num })
        })
    }

    return (
        <div className="page-container bingo-page">
            <div className="page-header"><h1>🎲 Bingo</h1></div>
            <div className="page-content">
                {!currentRoom ? (
                    <div className="game-menu">
                        <LiquidGlassButton onClick={() => setShowCreate(true)} fullWidth>Create Room</LiquidGlassButton>
                        <LiquidGlassButton onClick={() => setShowJoin(true)} variant="secondary" fullWidth>Join Room</LiquidGlassButton>
                        {showCreate && <div className="room-modal"><LiquidGlassButton onClick={handleCreate}>Generate Code</LiquidGlassButton></div>}
                        {showJoin && <div className="room-modal"><input value={roomCode} onChange={e => setRoomCode(e.target.value)} /><LiquidGlassButton onClick={handleJoin}>Join</LiquidGlassButton></div>}
                    </div>
                ) : (
                    <div className="game-arena">
                        {gameStatus === 'waiting' ? <h2>Code: {roomCode}</h2> : (
                            <>
                                <div className="bingo-board">
                                    {board.map((num, i) => (
                                        <div key={i} className={`bingo-cell ${calledNumbers.includes(num) ? 'marked' : ''}`}>
                                            {num}
                                        </div>
                                    ))}
                                </div>
                                {currentRoom.host_id === user.id && (
                                    <LiquidGlassButton onClick={callNumber} style={{ marginTop: 20 }}>Call Number</LiquidGlassButton>
                                )}
                                <div className="last-called">
                                    Last Called: {calledNumbers[calledNumbers.length - 1] || '-'}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Bingo
