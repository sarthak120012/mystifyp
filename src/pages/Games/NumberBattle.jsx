import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { generateRoomCode } from '../../lib/utils'
import { LiquidGlassButton } from '../../components/LiquidGlassButton'
import './NumberBattle.css'

const NumberBattle = () => {
    const { user } = useAuthStore()
    const [currentRoom, setCurrentRoom] = useState(null)
    const [roomCode, setRoomCode] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [showJoin, setShowJoin] = useState(false)
    const [currentNumber, setCurrentNumber] = useState(50)
    const [gameStatus, setGameStatus] = useState('waiting')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const check = async () => {
            const { data } = await supabase.from('game_rooms').select('*').or(`host_id.eq.${user.id},guest_id.eq.${user.id}`).eq('game_type', 'numberbattle').neq('status', 'finished').single()
            if (data) { setCurrentRoom(data); setGameStatus(data.status); setRoomCode(data.room_code); }
        }
        if (user) check()
    }, [user])

    useEffect(() => {
        if (currentRoom) {
            const sub = supabase.channel(`battle-${currentRoom.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'game_moves', filter: `room_id=eq.${currentRoom.id}` },
                    (payload) => {
                        const move = JSON.parse(payload.new.game_state)
                        setCurrentNumber(move.number)
                        setMessage(move.message)
                    })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${currentRoom.id}` },
                    (payload) => { if (payload.new.status === 'playing') setGameStatus('playing') })
                .subscribe()
            return () => sub.unsubscribe()
        }
    }, [currentRoom])

    const handleCreate = async () => {
        const code = generateRoomCode()
        const { data } = await supabase.from('game_rooms').insert({ room_code: code, game_type: 'numberbattle', host_id: user.id }).select().single()
        setCurrentRoom(data); setRoomCode(code); setShowCreate(false);
    }

    const handleJoin = async () => {
        const { data } = await supabase.from('game_rooms').select('*').eq('room_code', roomCode).single()
        if (data) {
            await supabase.from('game_rooms').update({ guest_id: user.id, status: 'playing' }).eq('id', data.id)
            setCurrentRoom(data); setGameStatus('playing'); setShowJoin(false);
        }
    }

    const handleGuess = async (guess) => {
        const nextNum = Math.floor(Math.random() * 100) + 1
        const won = (guess === 'higher' && nextNum > currentNumber) || (guess === 'lower' && nextNum < currentNumber)
        const msg = won ? `${user.email} guessed right! (${nextNum})` : `${user.email} guessed wrong! (${nextNum})`

        await supabase.from('game_moves').insert({
            room_id: currentRoom.id, player_id: user.id, move_number: Date.now(),
            game_state: JSON.stringify({ number: nextNum, message: msg })
        })
    }

    return (
        <div className="page-container battle-page">
            <div className="page-header"><h1>🔢 Number Battle</h1></div>
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
                            <div className="battle-arena">
                                <div className="current-number">{currentNumber}</div>
                                <div className="battle-controls">
                                    <button onClick={() => handleGuess('higher')}>Higher ▲</button>
                                    <button onClick={() => handleGuess('lower')}>Lower ▼</button>
                                </div>
                                <p className="battle-message">{message}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default NumberBattle
