import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Smile, MoreVertical, Flag, UserX, X, AlertTriangle } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { formatDistanceToNow } from '../../lib/utils'
import toast from 'react-hot-toast'
import './ChatRoom.css'

const ChatRoom = () => {
    const { partnerId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [partner, setPartner] = useState(null)
    const [isTyping, setIsTyping] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [showBlockModal, setShowBlockModal] = useState(false)
    const [reportReason, setReportReason] = useState('spam')
    const [reportNotes, setReportNotes] = useState('')

    const messagesEndRef = useRef(null)
    const typingTimeoutRef = useRef(null)
    const menuRef = useRef(null)

    const reactions = ['❤️', '😂', '😮', '😢', '🔥', '👍']

    useEffect(() => {
        if (!user || !partnerId) {
            setLoading(false)
            return
        }

        fetchPartner()
        fetchMessages()

        const messagesSub = subscribeToMessages()
        const typingSub = subscribeToTyping()
        markMessagesAsRead()

        // Click outside listener for menu
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            if (messagesSub) supabase.removeChannel(messagesSub)
            if (typingSub) supabase.removeChannel(typingSub)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [partnerId, user])

    useEffect(() => {
        scrollToBottom()
    }, [messages, showEmojiPicker])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchPartner = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', partnerId)
                .single()

            setPartner(data)
        } catch (error) {
            console.error('Error fetching partner:', error)
        }
    }

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(
                    `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
                )
                .order('created_at', { ascending: true })

            if (error) throw error
            setMessages(data || [])
        } catch (error) {
            console.error('Error fetching messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`chat-${partnerId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${partnerId}`
                },
                (payload) => {
                    if (payload.new.receiver_id === user.id) {
                        setMessages(prev => [...prev, payload.new])
                        markMessageAsRead(payload.new.id)
                    }
                }
            )
            .subscribe()

        return channel
    }

    const subscribeToTyping = () => {
        const channel = supabase
            .channel(`typing-${partnerId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'typing_indicators',
                    filter: `user_id=eq.${partnerId}`
                },
                (payload) => {
                    if (payload.new?.is_typing && payload.new?.chat_partner_id === user.id) {
                        setIsTyping(true)
                        setTimeout(() => setIsTyping(false), 3000)
                    }
                }
            )
            .subscribe()

        return channel
    }

    const markMessagesAsRead = async () => {
        try {
            await supabase
                .from('messages')
                .update({ read: true })
                .eq('sender_id', partnerId)
                .eq('receiver_id', user.id)
                .eq('read', false)
        } catch (error) {
            console.error('Error marking messages as read:', error)
        }
    }

    const markMessageAsRead = async (messageId) => {
        try {
            await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', messageId)
        } catch (error) {
            console.error('Error marking message as read:', error)
        }
    }

    const handleTyping = async () => {
        try {
            await supabase
                .from('typing_indicators')
                .upsert({
                    user_id: user.id,
                    chat_partner_id: partnerId,
                    is_typing: true,
                    updated_at: new Date().toISOString()
                })

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }

            typingTimeoutRef.current = setTimeout(async () => {
                await supabase
                    .from('typing_indicators')
                    .update({ is_typing: false })
                    .eq('user_id', user.id)
                    .eq('chat_partner_id', partnerId)
            }, 2000)
        } catch (error) {
            console.error('Error updating typing status:', error)
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    sender_id: user.id,
                    receiver_id: partnerId,
                    content: newMessage.trim(),
                    delivered: true
                })
                .select()
                .single()

            if (error) throw error

            setMessages(prev => [...prev, data])
            setNewMessage('')
            setShowEmojiPicker(false)

            await supabase
                .from('typing_indicators')
                .update({ is_typing: false })
                .eq('user_id', user.id)
                .eq('chat_partner_id', partnerId)

            await supabase
                .from('notifications')
                .insert({
                    user_id: partnerId,
                    type: 'message',
                    actor_id: user.id,
                    message: newMessage.trim().substring(0, 50)
                })
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Failed to send message')
        }
    }

    const handleReaction = async (messageId, reaction) => {
        try {
            const message = messages.find(m => m.id === messageId)
            const currentReactions = typeof message.reactions === 'string'
                ? JSON.parse(message.reactions)
                : message.reactions || {}

            if (currentReactions[user.id] === reaction) {
                delete currentReactions[user.id]
            } else {
                currentReactions[user.id] = reaction
            }

            await supabase
                .from('messages')
                .update({ reactions: currentReactions })
                .eq('id', messageId)

            setMessages(prev => prev.map(m =>
                m.id === messageId
                    ? { ...m, reactions: currentReactions }
                    : m
            ))
        } catch (error) {
            console.error('Error adding reaction:', error)
        }
    }

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji)
    }

    const handleBlockUser = async () => {
        try {
            const { error } = await supabase
                .from('blocks')
                .insert({
                    user_id: user.id,
                    blocked_user_id: partnerId
                })

            if (error) throw error

            toast.success(`Blocked ${partner?.username}`)
            navigate('/chat')
        } catch (error) {
            console.error('Error blocking user:', error)
            toast.error('Failed to block user')
        }
    }

    const handleReportUser = async () => {
        try {
            const { error } = await supabase
                .from('reports')
                .insert({
                    reporter_id: user.id,
                    reported_user_id: partnerId,
                    reason: reportReason,
                    notes: reportNotes,
                    type: 'user',
                    status: 'pending'
                })

            if (error) throw error

            toast.success('User reported successfully')
            setShowReportModal(false)
        } catch (error) {
            console.error('Error reporting user:', error)
            toast.error('Failed to report user')
        }
    }

    if (!user) return <div className="loading-container"><p>Loading...</p></div>

    return (
        <div className="chat-room-container">
            {/* Header */}
            <div className="chat-room-header glass-header">
                <button onClick={() => navigate('/chat')} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <div className="partner-profile">
                    <div className="avatar-wrapper">
                        <img
                            src={partner?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                            alt={partner?.username}
                            className="partner-avatar"
                        />
                        <span className={`status-dot ${partner?.status === 'online' ? 'online' : ''}`}></span>
                    </div>
                    <div className="partner-info">
                        <h2>{partner?.full_name || partner?.username || 'Loading...'}</h2>
                        <span className="username">@{partner?.username}</span>
                    </div>
                </div>

                <div className="menu-container" ref={menuRef}>
                    <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>
                        <MoreVertical size={24} />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="dropdown-menu"
                            >
                                <button onClick={() => { setShowReportModal(true); setShowMenu(false); }}>
                                    <Flag size={18} /> Report User
                                </button>
                                <button onClick={() => { setShowBlockModal(true); setShowMenu(false); }} className="danger-item">
                                    <UserX size={18} /> Block User
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Messages */}
            <div className="messages-container" onClick={() => setShowEmojiPicker(false)}>
                {loading ? (
                    <div className="loading-container"><div className="loader"></div></div>
                ) : messages.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👋</div>
                        <p>Say hello to {partner?.full_name}!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.sender_id === user.id
                        const messageReactions = typeof message.reactions === 'string'
                            ? JSON.parse(message.reactions)
                            : message.reactions || {}

                        const reactionCounts = {}
                        Object.values(messageReactions).forEach(r => {
                            reactionCounts[r] = (reactionCounts[r] || 0) + 1
                        })

                        return (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`message-wrapper ${isOwn ? 'own' : 'partner'}`}
                            >
                                {!isOwn && (
                                    <img
                                        src={partner?.avatar_url}
                                        className="message-avatar"
                                        alt="avatar"
                                    />
                                )}
                                <div className="message-content-group">
                                    <div className="message-bubble">
                                        <p>{message.content}</p>
                                        <div className="message-footer">
                                            <span className="time">
                                                {formatDistanceToNow(message.created_at)}
                                            </span>
                                            {isOwn && message.read && (
                                                <span className="read-receipt">✓✓</span>
                                            )}
                                        </div>

                                        {Object.keys(reactionCounts).length > 0 && (
                                            <div className="reactions-display">
                                                {Object.entries(reactionCounts).map(([emoji, count]) => (
                                                    <span key={emoji} className="reaction-pill">
                                                        {emoji} {count > 1 && count}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="reaction-actions">
                                        {reactions.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleReaction(message.id, emoji)}
                                                className="quick-reaction"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })
                )}

                {isTyping && (
                    <div className="typing-indicator-wrapper">
                        <img src={partner?.avatar_url} className="message-avatar" alt="avatar" />
                        <div className="typing-bubble">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="input-area glass-panel">
                <AnimatePresence>
                    {showEmojiPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="emoji-picker-container"
                        >
                            <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={300} theme="light" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSendMessage} className="message-form">
                    <button
                        type="button"
                        className={`action-btn ${showEmojiPicker ? 'active' : ''}`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        <Smile size={24} />
                    </button>

                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value)
                            handleTyping()
                        }}
                        onFocus={() => setShowEmojiPicker(false)}
                        className="message-input"
                    />

                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="send-btn"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>

            {/* Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                        >
                            <div className="modal-header">
                                <h3>Report User</h3>
                                <button onClick={() => setShowReportModal(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <label>Reason</label>
                                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                                    <option value="spam">Spam</option>
                                    <option value="harassment">Harassment</option>
                                    <option value="inappropriate">Inappropriate Content</option>
                                    <option value="other">Other</option>
                                </select>
                                <label>Notes (Optional)</label>
                                <textarea
                                    value={reportNotes}
                                    onChange={(e) => setReportNotes(e.target.value)}
                                    placeholder="Please provide more details..."
                                />
                                <button onClick={handleReportUser} className="btn-primary full-width">
                                    Submit Report
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Block Modal */}
            <AnimatePresence>
                {showBlockModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                        >
                            <div className="modal-header warning">
                                <AlertTriangle size={24} />
                                <h3>Block User?</h3>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to block <strong>@{partner?.username}</strong>? They won't be able to message you or see your posts.</p>
                                <div className="modal-actions">
                                    <button onClick={() => setShowBlockModal(false)} className="btn-secondary">Cancel</button>
                                    <button onClick={handleBlockUser} className="btn-danger">Block User</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ChatRoom
