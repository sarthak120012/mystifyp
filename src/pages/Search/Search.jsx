import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search as SearchIcon, UserPlus, UserCheck, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import './Search.css'

const Search = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [followStatus, setFollowStatus] = useState({})

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                searchUsers()
            } else {
                setResults([])
            }
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [searchQuery])

    const searchUsers = async () => {
        setLoading(true)
        try {
            const query = searchQuery.trim().toLowerCase()
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
                .neq('id', user.id)
                .limit(20)

            if (error) throw error

            setResults(data || [])

            // Check follow status for each user
            if (data && data.length > 0) {
                const userIds = data.map(u => u.id)
                const { data: follows } = await supabase
                    .from('follows')
                    .select('following_id')
                    .eq('follower_id', user.id)
                    .in('following_id', userIds)

                const statusMap = {}
                follows?.forEach(f => {
                    statusMap[f.following_id] = true
                })
                setFollowStatus(statusMap)
            }
        } catch (error) {
            console.error('Error searching users:', error)
            toast.error('Search failed')
        } finally {
            setLoading(false)
        }
    }

    const toggleFollow = async (profileId) => {
        try {
            const isFollowing = followStatus[profileId]

            if (isFollowing) {
                // Unfollow
                await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', profileId)

                setFollowStatus(prev => ({ ...prev, [profileId]: false }))
                toast.success('Unfollowed')
            } else {
                // Follow
                await supabase
                    .from('follows')
                    .insert({
                        follower_id: user.id,
                        following_id: profileId
                    })

                setFollowStatus(prev => ({ ...prev, [profileId]: true }))

                // Create notification
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: profileId,
                        type: 'follow',
                        actor_id: user.id
                    })

                toast.success('Following')
            }

            // Wait for database triggers
            await new Promise(resolve => setTimeout(resolve, 200))

            // Refresh search results to update follower counts
            await searchUsers()
        } catch (error) {
            console.error('Error toggling follow:', error)
            toast.error('Failed to update follow status')
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Search</h1>
            </div>

            <div className="page-content">
                <div className="search-bar">
                    <SearchIcon size={20} />
                    <input
                        type="text"
                        placeholder="Search users by username or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {loading && (
                    <div className="loading-container">
                        <Loader className="spin" size={24} />
                    </div>
                )}

                <div className="search-results">
                    {results.map((profile) => (
                        <motion.div
                            key={profile.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => navigate(`/profile/${profile.id}`)}
                            className="user-card"
                            style={{ cursor: 'pointer' }}
                        >
                            <img
                                src={profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                alt={profile.username}
                                className="user-avatar"
                            />
                            <div className="user-info">
                                <h3>{profile.full_name}</h3>
                                <p>@{profile.username}</p>
                                {profile.bio && <span className="user-bio">{profile.bio}</span>}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleFollow(profile.id)
                                }}
                                className={`follow-btn ${followStatus[profile.id] ? 'following' : ''}`}
                            >
                                {followStatus[profile.id] ? (
                                    <>
                                        <UserCheck size={18} />
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={18} />
                                        Follow
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {!loading && searchQuery && results.length === 0 && (
                    <div className="empty-state">
                        <p>No users found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Search
