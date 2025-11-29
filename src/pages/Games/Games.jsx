import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Gamepad2, Users, Trophy } from 'lucide-react'
import './Games.css'

const Games = () => {
    const navigate = useNavigate()

    const games = [
        {
            id: 'tictactoe',
            name: 'Tic-Tac-Toe',
            description: '3x3 classic strategy game',
            icon: '⭕',
            color: '#4AB3FF',
            available: true
        },
        {
            id: 'taprace',
            name: 'Tap Race',
            description: 'Rapid tap competition',
            icon: '⚡',
            color: '#FF9CB7',
            available: true
        },
        {
            id: 'memoryflip',
            name: 'Memory Flip',
            description: 'Match the cards',
            icon: '🎴',
            color: '#A85CFF',
            available: true
        },
        {
            id: 'bingo',
            name: 'Bingo 5x5',
            description: 'Classic bingo game',
            icon: '🎲',
            color: '#00E8FF',
            available: true
        },
        {
            id: 'numberbattle',
            name: 'Number Battle',
            description: 'Guess the number',
            icon: '🔢',
            color: '#6D5CFF',
            available: true
        }
    ]

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Games</h1>
            </div>

            <div className="page-content">
                <div className="games-stats">
                    <div className="stat-card">
                        <Gamepad2 size={24} />
                        <div>
                            <strong>5</strong>
                            <span>Total Games</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Users size={24} />
                        <div>
                            <strong>Multiplayer</strong>
                            <span>Real-time</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Trophy size={24} />
                        <div>
                            <strong>Leaderboard</strong>
                            <span>Daily Ranks</span>
                        </div>
                    </div>
                </div>

                <div className="games-grid">
                    {games.map((game, index) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`game-card ${!game.available ? 'disabled' : ''}`}
                            onClick={() => game.available && navigate(`/games/${game.id}`)}
                            style={{ '--game-color': game.color }}
                        >
                            <div className="game-icon">{game.icon}</div>
                            <h3>{game.name}</h3>
                            <p>{game.description}</p>
                            {!game.available && (
                                <div className="coming-soon">Coming Soon</div>
                            )}
                        </motion.div>
                    ))}
                </div>

                <div className="info-section">
                    <h3>How to Play</h3>
                    <ol>
                        <li>Select a game from the list</li>
                        <li>Create a room or join with a code</li>
                        <li>Wait for opponent to join</li>
                        <li>Play and earn leaderboard points!</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}

export default Games
