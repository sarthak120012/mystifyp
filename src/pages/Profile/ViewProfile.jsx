import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, UserPlus, UserCheck, MessageCircle, Grid } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { PostCard } from '../../components/PostCard'
import { FollowersModal } from '../../components/FollowersModal'
import toast from 'react-hot-toast'
import './Profile.css'

const ViewProfile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [profile, setProfile] = useState(null)
    const [userPosts, setUserPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [showFollowersModal, setShowFollowersModal] = useState(false)
    const [modalType, setModalType] = useState('followers')
    const [stats, setStats] = useState({
        posts: 0,
        followers: 0,
        following: 0
    })

    useEffect(() => {
        if (id) {
            fetchProfile()
            fetchUserPosts()
            checkFollowStatus()
        }
    }, [id])

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setProfile(data)

            // Manually count actual followers and following for THIS user
            const { count: followersCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', id)

            const { count: followingCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', id)

            setStats(prev => ({
                ...prev,
                followers: followersCount || 0,
                following: followingCount || 0
            }))
        } catch (error) {
            console.error('Error fetching profile:', error)
            toast.error('Profile not found')
            navigate('/home')
        }
    }

    const fetchUserPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', id)
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

    const checkFollowStatus = async () => {
        try {
            const { data } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', user.id)
                .eq('following_id', id)
                .single()

            setIsFollowing(!!data)
        } catch (error) {
            // Not following
        }
    }

    const toggleFollow = async () => {
        try {
            if (isFollowing) {
                await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', id)

                setIsFollowing(false)
                toast.success('Unfollowed')
            } else {
                await supabase
                    .from('follows')
                    .insert({
                        follower_id: user.id,
                        following_id: id
                    })

                await supabase
                    .from('notifications')
                    .insert({
                        user_id: id,
                        type: 'follow',
                        actor_id: user.id
                    })

                setIsFollowing(true)
                toast.success('Following')
            }

            // Wait for database triggers
            await new Promise(resolve => setTimeout(resolve, 300))

            // Manually count and update
            const { count: followersCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', id)

            const { count: followingCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', id)

            setStats(prev => ({
                ...prev,
                followers: followersCount || 0,
                following: followingCount || 0
            }))
        } catch (error) {
            console.error('Error toggling follow:', error)
            toast.error('Failed to update follow status')
        }
    }

    const handleMessage = () => {
        navigate(`/chat/${id}`)
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <p>Loading profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="profile-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
            </div>

            <div className="profile-layout">
                <div className="profile-left">
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
                        <p className="profile-bio-left">{profile.bio}</p>
                    )}
                </div>

                <div className="profile-right">
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

                    <div className="profile-actions-vertical">
                        <button
                            onClick={toggleFollow}
                            className={`action-btn-large follow-btn-large ${isFollowing ? 'following' : ''}`}
                        >
                            {isFollowing ? (
                                <>
                                    <UserCheck size={20} />
                                    Following
                                </>
                            ) : (
                                <>
                                    <UserPlus size={20} />
                                    Follow
                                </>
                            )}
                        </button>

                        <button onClick={handleMessage} className="action-btn-large message-btn-large">
                            <MessageCircle size={20} />
                            Chat
                        </button>
                    </div>
                </div>
            </div>

            <div className="profile-tabs">
                <button className="tab active">
                    <Grid size={20} />
                    Posts
                </button>
            </div>

            <div className="profile-posts-feed">
                {userPosts.length === 0 ? (
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
                userId={id}
                type={modalType}
            />
        </div>
    )
}

export default ViewProfile
