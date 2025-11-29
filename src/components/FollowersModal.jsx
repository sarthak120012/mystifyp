import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import './FollowersModal.css'

export const FollowersModal = ({ isOpen, onClose, userId, type }) => {
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen && userId) {
            fetchUsers()
        }
    }, [isOpen, userId, type])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            let query = supabase.from('follows')

            if (type === 'followers') {
                // Get people who follow this user
                const { data, error } = await query
                    .select(`
                        follower_id,
                        profiles:follower_id (
                            id,
                            username,
                            full_name,
                            avatar_url
                        )
                    `)
                    .eq('following_id', userId)

                if (error) throw error
                setUsers(data?.map(f => f.profiles) || [])
            } else {
                // Get people this user follows
                const { data, error } = await query
                    .select(`
                        following_id,
                        profiles:following_id (
                            id,
                            username,
                            full_name,
                            avatar_url
                        )
                    `)
                    .eq('follower_id', userId)

                if (error) throw error
                setUsers(data?.map(f => f.profiles) || [])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUserClick = (id) => {
        navigate(`/profile/${id}`)
        onClose()
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="modal-overlay"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="followers-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h2>{type === 'followers' ? 'Followers' : 'Following'}</h2>
                        <button onClick={onClose} className="close-btn">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="modal-body">
                        {loading ? (
                            <div className="loading-state">
                                <p>Loading...</p>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="empty-state">
                                <User size={48} style={{ opacity: 0.3 }} />
                                <p>No {type === 'followers' ? 'followers' : 'following'} yet</p>
                            </div>
                        ) : (
                            <div className="users-list">
                                {users.map((user) => (
                                    <motion.div
                                        key={user.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="user-item"
                                        onClick={() => handleUserClick(user.id)}
                                    >
                                        <img
                                            src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                            alt={user.username}
                                            className="user-avatar"
                                        />
                                        <div className="user-info">
                                            <h3>{user.full_name || user.username}</h3>
                                            <p>@{user.username}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
