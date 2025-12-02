import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings, Edit, Grid } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { PostCard } from '../../components/PostCard'
import { FollowersModal } from '../../components/FollowersModal'
import './Profile.css'

const Profile = () => {
    const navigate = useNavigate()
    const { user, profile } = useAuthStore()
    const [userPosts, setUserPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showFollowersModal, setShowFollowersModal] = useState(false)
    const [modalType, setModalType] = useState('followers')
    const [stats, setStats] = useState({
        posts: 0,
        followers: 0,
        following: 0
    })

    useEffect(() => {
        if (profile) {
            fetchUserPosts()
            fetchStats()
        }
    }, [profile])

    const fetchUserPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setUserPosts(data || [])
            setStats(prev => ({ ...prev, posts: (data || []).length }))
        } catch (error) {
            console.error('Error fetching posts:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            // Manually count actual followers and following
            const { count: followersCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', user.id)

            const { count: followingCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', user.id)

            setStats(prev => ({
                ...prev,
                followers: followersCount || 0,
                following: followingCount || 0
            }))
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    return (
        <div className="page-container">
            <div className="profile-header">
                <button
                    onClick={() => navigate('/settings')}
                    className="settings-btn"
                >
                    <Settings size={24} />
                </button>
            </div>

            <div className="profile-layout">
                <div className="profile-left">
                    <div className="profile-stats-horizontal">
                        <div className="stat-card">
                            <strong>{stats.posts}</strong>
                            <span>Posts</span>
                        </div>
                        <div
                            className="stat-card"
                            onClick={() => {
                                setModalType('followers')
                                setShowFollowersModal(true)
                            }}
                        >
                            <strong>{stats.followers}</strong>
                            <span>Followers</span>
                        </div>
                        <div
                            className="stat-card"
                            onClick={() => {
                                setModalType('following')
                                setShowFollowersModal(true)
                            }}
                        >
                            <strong>{stats.following}</strong>
                            <span>Following</span>
                        </div>
                    </div>

                    <button
                        className="action-btn-large edit-btn-large"
                        onClick={() => navigate('/edit-profile')}
                    >
                        <Edit size={20} />
                        Edit Profile
                    </button>
                </div>

                <div className="profile-right profile-right-avatar">
                    <motion.img
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={profile?.username}
                        className="profile-avatar-large"
                    />
                    <h1>{profile?.full_name || 'User'}</h1>
                    <p className="profile-username">@{profile?.username || 'username'}</p>
                    {profile?.bio && (
                        <p className="profile-bio-center">{profile.bio}</p>
                    )}
                </div>
            </div>

            <div className="profile-tabs">
                <button className="tab active">
                    <Grid size={20} />
                    Posts
                </button>
            </div>

            <div className="profile-posts-feed">
                {loading ? (
                    <div className="loading-container">
                        <p>Loading posts...</p>
                    </div>
                ) : userPosts.length === 0 ? (
                    <div className="empty-state">
                        <p>No posts yet</p>
                    </div>
                ) : (
                    userPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={{ ...post, profiles: profile }}
                            onUpdate={fetchUserPosts}
                            onDelete={() => {
                                setUserPosts(prev => prev.filter(p => p.id !== post.id))
                                setStats(prev => ({ ...prev, posts: prev.posts - 1 }))
                            }}
                        />
                    ))
                )}
            </div>

            <FollowersModal
                isOpen={showFollowersModal}
                onClose={() => setShowFollowersModal(false)}
                userId={user.id}
                type={modalType}
            />
        </div>
    )
}

export default Profile
