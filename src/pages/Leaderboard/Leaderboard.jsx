import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './Leaderboard.css'

const Leaderboard = () => {
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchUsers()

        // Real-time subscription for new users
        const subscription = supabase
            .channel('public:profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="page-container leaderboard-page">
            <div className="page-header">
                <h1>Community</h1>
            </div>

            <div className="page-content">
                <div className="search-bar-container">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="user-search-input"
                    />
                </div>

                {loading ? (
                    <div className="loading-container">
                        <p>Loading community...</p>
                    </div>
                ) : (
                    <div className="users-grid">
                        {filteredUsers.map((profile, index) => (
                            <motion.div
                                key={profile.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="user-card"
                                onClick={() => navigate(`/profile/${profile.id}`)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <img
                                    src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                                    alt={profile.username}
                                    className="user-card-avatar"
                                />
                                <div className="user-card-info">
                                    <h3>{profile.full_name || 'Unknown'}</h3>
                                    <span>@{profile.username}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Leaderboard
