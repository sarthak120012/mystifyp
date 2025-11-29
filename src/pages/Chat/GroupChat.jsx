import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Smile, MoreVertical, Users, Settings } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { formatDistanceToNow } from '../../lib/utils'
import toast from 'react-hot-toast'
import './ChatRoom.css' // Reuse styles
import GroupSettingsModal from './GroupSettingsModal'

const GroupChat = () => {
    const { groupId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [group, setGroup] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        fetchGroupDetails()
        fetchMessages()
        const subscription = subscribeToMessages()

        return () => {
            if (subscription) supabase.removeChannel(subscription)
        }
    }, [groupId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchGroupDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single()

            if (error) throw error
            setGroup(data)
        } catch (error) {
            console.error('Error fetching group:', error)
            toast.error('Group not found')
            navigate('/chat')
        }
    }

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('group_messages')
                .select(`
                    *,
                    sender:sender_id (id, username, full_name, avatar_url)
                `)
                .eq('group_id', groupId)
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
            .channel(`group-${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'group_messages',
                    filter: `group_id=eq.${groupId}`
                },
                async (payload) => {
                    // Fetch sender details for the new message
                    if (payload.new.sender_id) {
                        const { data: sender } = await supabase
                            .from('profiles')
                            .select('id, username, full_name, avatar_url')
                            .eq('id', payload.new.sender_id)
                            .single()

                        setMessages(prev => [...prev, { ...payload.new, sender }])
                    } else {
                        // System message
                        setMessages(prev => [...prev, payload.new])
                    }
                }
            )
            .subscribe()

        return channel
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        try {
            const { error } = await supabase
                .from('group_messages')
                .insert({
                    group_id: groupId,
                    sender_id: user.id,
                    content: newMessage.trim(),
                    type: 'text'
                })

            if (error) throw error
            setNewMessage('')
            setShowEmojiPicker(false)
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Failed to send message')
        }
    }

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji)
    }

    if (loading) return <div className="loading-container"><p>Loading group...</p></div>

    return (
        <div className="chat-room-container">
            {/* Header */}
            <div className="chat-room-header glass-header">
                <button onClick={() => navigate('/chat')} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <div className="partner-profile" onClick={() => setShowSettings(true)}>
                    <div className="avatar-wrapper">
                        <img
                            src={group?.avatar_url}
                            alt={group?.name}
                            className="partner-avatar"
                        />
                    </div>
                    <div className="partner-info">
                        <h2>{group?.name}</h2>
                        <span className="username">Tap for info</span>
                    </div>
                </div>

                <button className="menu-btn" onClick={() => setShowSettings(true)}>
                    <Settings size={24} />
                </button>
            </div>

            {/* Messages */}
            <div className="messages-container" onClick={() => setShowEmojiPicker(false)}>
                {messages.map((message) => {
                    if (message.type === 'system') {
                        return (
                            <div key={message.id} className="system-message">
                                <span>{message.content}</span>
                            </div>
                        )
                    }

                    const isOwn = message.sender_id === user.id

                    return (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`message-wrapper ${isOwn ? 'own' : 'partner'}`}
                        >
                            {!isOwn && (
                                <div className="message-sender-avatar">
                                    <img
                                        src={message.sender?.avatar_url}
                                        className="message-avatar"
                                        alt="avatar"
                                    />
                                </div>
                            )}
                            <div className="message-content-group">
                                {!isOwn && <span className="sender-name">{message.sender?.full_name}</span>}
                                <div className="message-bubble">
                                    <p>{message.content}</p>
                                    <div className="message-footer">
                                        <span className="time">
                                            {formatDistanceToNow(message.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
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
                        placeholder="Message group..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
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

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <GroupSettingsModal
                        group={group}
                        onClose={() => setShowSettings(false)}
                        onUpdate={() => fetchGroupDetails()}
                        onLeave={() => navigate('/chat')}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default GroupChat
