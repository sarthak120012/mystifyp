import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { CreatePost } from '../../components/CreatePost'
import { PostCard } from '../../components/PostCard'
import { Bell, Loader } from 'lucide-react'
import './Home.css'

const Home = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(0)
    const [unreadCount, setUnreadCount] = useState(0)
    const POSTS_PER_PAGE = 10

    useEffect(() => {
        fetchPosts()
        fetchUnreadCount()
        subscribeToNewPosts()
        subscribeToNotifications()
    }, [])

    const fetchPosts = async (pageNum = 0) => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
                .order('created_at', { ascending: false })
                .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1)

            if (error) throw error

            if (pageNum === 0) {
                setPosts(data || [])
            } else {
                setPosts(prev => [...prev, ...(data || [])])
            }

            setHasMore((data || []).length === POSTS_PER_PAGE)
            setPage(pageNum)
        } catch (error) {
            console.error('Error fetching posts:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUnreadCount = async () => {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('read', false)

            if (error) throw error
            setUnreadCount(count || 0)
        } catch (error) {
            console.error('Error fetching unread count:', error)
        }
    }

    const subscribeToNewPosts = () => {
        const subscription = supabase
            .channel('posts-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'posts'
                },
                async (payload) => {
                    const { data } = await supabase
                        .from('posts')
                        .select(`
              *,
              profiles:user_id (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
                        .eq('id', payload.new.id)
                        .single()

                    if (data) {
                        setPosts(prev => [data, ...prev])
                    }
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }

    const subscribeToNotifications = () => {
        const subscription = supabase
            .channel('notifications-bell')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    setUnreadCount(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }

    const handlePostCreated = (newPost) => {
        setPosts(prev => [newPost, ...prev])
    }

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchPosts(page + 1)
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Home Feed</h1>
                <div className="notification-bell" onClick={() => navigate('/notifications')}>
                    <Bell size={24} />
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                    )}
                </div>
            </div>

            <div className="page-content">
                <CreatePost onPostCreated={handlePostCreated} />

                {loading && page === 0 ? (
                    <div className="loading-container">
                        <Loader className="spin" size={32} />
                        <p>Loading posts...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="empty-state">
                        <p>No posts yet. Be the first to share something!</p>
                    </div>
                ) : (
                    <>
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDelete={(postId) => setPosts(posts.filter(p => p.id !== postId))}
                            />
                        ))}

                        {hasMore && (
                            <button onClick={loadMore} className="load-more-btn" disabled={loading}>
                                {loading ? <Loader className="spin" size={20} /> : 'Load More'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default Home
