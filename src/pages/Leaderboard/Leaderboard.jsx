import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import './Leaderboard.css'

const Leaderboard = () => {
    const { user } = useAuthStore()
    const [leaderboard, setLeaderboard] = useState([])
    const [myRank, setMyRank] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLeaderboard()
        subscribeToLeaderboard()
    }, [])

    const subscribeToLeaderboard = () => {
        const subscription = supabase
            .channel('leaderboard-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leaderboard'
                },
                () => {
                    fetchLeaderboard()
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }

    const fetchLeaderboard = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]

            // 1. Fetch ALL profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')

            if (profilesError) throw profilesError

            // 2. Fetch today's leaderboard entries
            const { data: leaderboardData, error: leaderboardError } = await supabase
                .from('leaderboard')
                .select('user_id, points')
                .eq('date', today)

            if (leaderboardError) throw leaderboardError

            // 3. Merge and Sort
            const mergedData = profiles.map(profile => {
                const entry = leaderboardData?.find(l => l.user_id === profile.id)
                return {
                    id: entry?.id || profile.id, // Use leaderboard ID if exists, else profile ID (for key)
                    user_id: profile.id,
                    points: entry?.points || 0,
                    profiles: profile
                }
            })

            // Sort by points (desc), then by name (asc) for stability
            mergedData.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points
                return a.profiles.full_name.localeCompare(b.profiles.full_name)
            })

            setLeaderboard(mergedData)

            const userIndex = mergedData.findIndex(entry => entry.user_id === user.id)
            if (userIndex !== -1) {
                setMyRank(userIndex + 1)
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const getRankIcon = (rank) => {
        if (rank === 1) return { icon: '🥇', color: '#FFD700' }
        if (rank === 2) return { icon: '🥈', color: '#C0C0C0' }
        if (rank === 3) return { icon: '🥉', color: '#CD7F32' }
        return null
    }

    return (
        <div className="page-container leaderboard-page">
            <div className="page-header">
                <h1>🏆 Leaderboard</h1>
            </div>

            <div className="page-content">
                <div className="leaderboard-info">
                    <Trophy size={32} />
                    <div>
                        <h3>Daily Rankings</h3>
                        <p>Resets every day at midnight UTC</p>
                        {myRank && (
                            <span className="my-rank">Your Rank: #{myRank}</span>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <p>Loading rankings...</p>
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="empty-state">
                        <Medal size={64} style={{ opacity: 0.3 }} />
                        <p>No rankings yet today</p>
                        <span>Play games to earn points!</span>
                    </div>
                ) : (
                    <>
                        {/* Podium Section */}
                        <div className="podium-container">
                            {/* 2nd Place */}
                            {leaderboard[1] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="podium-item second"
                                >
                                    <div className="podium-avatar-container">
                                        <img src={leaderboard[1].profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="2nd" />
                                        <div className="podium-rank">2</div>
                                    </div>
                                    <div className="podium-info">
                                        <h3>{leaderboard[1].profiles?.full_name}</h3>
                                        <div className="podium-points">
                                            <TrendingUp size={14} />
                                            {leaderboard[1].points} pts
                                        </div>
                                    </div>
                                    <div className="podium-stand"></div>
                                </motion.div>
                            )}

                            {/* 1st Place */}
                            {leaderboard[0] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="podium-item first"
                                >
                                    <div className="crown">👑</div>
                                    <div className="podium-avatar-container">
                                        <img src={leaderboard[0].profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="1st" />
                                        <div className="podium-rank">1</div>
                                    </div>
                                    <div className="podium-info">
                                        <h3>{leaderboard[0].profiles?.full_name}</h3>
                                        <div className="podium-points">
                                            <TrendingUp size={16} />
                                            {leaderboard[0].points} pts
                                        </div>
                                    </div>
                                    <div className="podium-stand"></div>
                                </motion.div>
                            )}

                            {/* 3rd Place */}
                            {leaderboard[2] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="podium-item third"
                                >
                                    <div className="podium-avatar-container">
                                        <img src={leaderboard[2].profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="3rd" />
                                        <div className="podium-rank">3</div>
                                    </div>
                                    <div className="podium-info">
                                        <h3>{leaderboard[2].profiles?.full_name}</h3>
                                        <div className="podium-points">
                                            <TrendingUp size={14} />
                                            {leaderboard[2].points} pts
                                        </div>
                                    </div>
                                    <div className="podium-stand"></div>
                                </motion.div>
                            )}
                        </div>

                        {/* List Section (Rest of users) */}
                        <div className="leaderboard-list">
                            {leaderboard.slice(3).map((entry, index) => {
                                const rank = index + 4
                                const isUser = entry.user_id === user.id

                                return (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`leaderboard-item ${isUser ? 'current-user' : ''}`}
                                    >
                                        <div className="rank-display">
                                            <span className="rank-number">#{rank}</span>
                                        </div>

                                        <img
                                            src={entry.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                            alt={entry.profiles?.username}
                                            className="user-avatar"
                                        />

                                        <div className="user-info">
                                            <h3>{entry.profiles?.full_name || 'Unknown'}</h3>
                                            <span>@{entry.profiles?.username}</span>
                                        </div>

                                        <div className="points-display">
                                            <TrendingUp size={16} />
                                            <strong>{entry.points}</strong>
                                            <span>pts</span>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Leaderboard
