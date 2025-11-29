import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, Trash2, User, Heart, MessageSquare, Mail, Gamepad2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import './Notifications.css'

const Notifications = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, unread, read

    useEffect(() => {
        fetchNotifications()
        subscribeToNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
          *,
          profiles:actor_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setNotifications(data || [])
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const subscribeToNotifications = () => {
        const subscription = supabase
            .channel('user-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                async (payload) => {
                    const { data } = await supabase
                        .from('notifications')
                        .select(`
              *,
              profiles:actor_id (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
                        .eq('id', payload.new.id)
                        .single()

                    if (data) {
                        setNotifications(prev => [data, ...prev])
                    }
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }

    const markAsRead = async (notificationId) => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId)

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            )
        } catch (error) {
            console.error('Error marking as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false)

            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    const deleteNotification = async (notificationId) => {
        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)

            setNotifications(prev => prev.filter(n => n.id !== notificationId))
        } catch (error) {
            console.error('Error deleting notification:', error)
        }
    }

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'follow':
                return <User size={20} />
            case 'like':
                return <Heart size={20} />
            case 'comment':
                return <MessageSquare size={20} />
            case 'message':
                return <Mail size={20} />
            case 'game_invite':
                return <Gamepad2 size={20} />
            default:
                return <Bell size={20} />
        }
    }

    const getNotificationMessage = (notif) => {
        const username = notif.profiles?.username || 'Someone'
        switch (notif.type) {
            case 'follow':
                return `${username} started following you`
            case 'like':
                return `${username} liked your post`
            case 'comment':
                return `${username} commented on your post`
            case 'message':
                return `New message from ${username}`
            case 'game_invite':
                return `${username} invited you to play`
            default:
                return notif.message || 'New notification'
        }
    }

    const getNotificationColor = (type) => {
        switch (type) {
            case 'follow':
                return '#4AB3FF'
            case 'like':
                return '#FF4AB3'
            case 'comment':
                return '#A85CFF'
            case 'message':
                return '#00E8FF'
            case 'game_invite':
                return '#FFB74A'
            default:
                return 'var(--accent-primary)'
        }
    }

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read
        if (filter === 'read') return n.read
        return true
    })

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="page-container notifications-page">
            <div className="page-header">
                <h1>🔔 Notifications</h1>
                {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="mark-all-read-btn">
                        <Check size={16} /> Mark All Read
                    </button>
                )}
            </div>

            <div className="page-content">
                <div className="notification-filters">
                    <button
                        onClick={() => setFilter('all')}
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                    >
                        Unread ({unreadCount})
                    </button>
                    <button
                        onClick={() => setFilter('read')}
                        className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                    >
                        Read ({notifications.length - unreadCount})
                    </button>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <p>Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="empty-state">
                        <Bell size={64} style={{ opacity: 0.3 }} />
                        <p>No {filter !== 'all' ? filter : ''} notifications</p>
                        <span>When you get updates, they'll appear here</span>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {filteredNotifications.map((notif, index) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`notification-card ${!notif.read ? 'unread' : ''}`}
                                onClick={() => !notif.read && markAsRead(notif.id)}
                            >
                                <div
                                    className="notif-icon"
                                    style={{ backgroundColor: getNotificationColor(notif.type) }}
                                >
                                    {getNotificationIcon(notif.type)}
                                </div>

                                <img
                                    src={notif.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                    alt="avatar"
                                    className="notif-avatar"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (notif.actor_id) navigate(`/profile/${notif.actor_id}`)
                                    }}
                                />

                                <div className="notif-content">
                                    <p className="notif-message">{getNotificationMessage(notif)}</p>
                                    <span className="notif-time">
                                        {new Date(notif.created_at).toLocaleString()}
                                    </span>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteNotification(notif.id)
                                    }}
                                    className="delete-notif-btn"
                                >
                                    <Trash2 size={16} />
                                </button>

                                {!notif.read && <div className="unread-dot"></div>}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Notifications
