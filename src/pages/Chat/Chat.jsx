import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MessageCircle, Plus, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { formatDistanceToNow } from '../../lib/utils'
import CreateGroupModal from './CreateGroupModal'
import './Chat.css'

const Chat = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [conversations, setConversations] = useState([])
    const [groups, setGroups] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [showCreateGroup, setShowCreateGroup] = useState(false)

    useEffect(() => {
        fetchData()
        subscribeToMessages()
        subscribeToGroups()
    }, [])

    const fetchData = async () => {
        await Promise.all([fetchConversations(), fetchGroups()])
        setLoading(false)
    }

    const fetchConversations = async () => {
        try {
            const { data: messages, error } = await supabase
                .from('messages')
                .select(`
          *,
          sender:sender_id (id, username, full_name, avatar_url),
          receiver:receiver_id (id, username, full_name, avatar_url)
        `)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false })

            if (error) throw error

            const conversationsMap = new Map()

            messages?.forEach(msg => {
                const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
                const partner = msg.sender_id === user.id ? msg.receiver : msg.sender

                if (!conversationsMap.has(partnerId)) {
                    conversationsMap.set(partnerId, {
                        id: partnerId,
                        type: 'direct',
                        partner,
                        lastMessage: msg,
                        unreadCount: 0,
                        updatedAt: new Date(msg.created_at)
                    })
                }

                if (msg.receiver_id === user.id && !msg.read) {
                    const conv = conversationsMap.get(partnerId)
                    conv.unreadCount++
                }
            })

            setConversations(Array.from(conversationsMap.values()))
        } catch (error) {
            console.error('Error fetching conversations:', error)
        }
    }

    const fetchGroups = async () => {
        try {
            // 1. Get groups user is in
            const { data: memberships, error: memberError } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id)

            if (memberError) throw memberError

            const groupIds = memberships.map(m => m.group_id)

            if (groupIds.length === 0) {
                setGroups([])
                return
            }

            // 2. Get group details
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('*')
                .in('id', groupIds)

            if (groupsError) throw groupsError

            // 3. Get last message for each group
            const groupsWithMsg = await Promise.all(groupsData.map(async (group) => {
                const { data: lastMsg } = await supabase
                    .from('group_messages')
                    .select('*')
                    .eq('group_id', group.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                return {
                    id: group.id,
                    type: 'group',
                    name: group.name,
                    avatar_url: group.avatar_url,
                    lastMessage: lastMsg || { content: 'No messages yet', created_at: group.created_at },
                    updatedAt: new Date(lastMsg?.created_at || group.created_at)
                }
            }))

            setGroups(groupsWithMsg)
        } catch (error) {
            console.error('Error fetching groups:', error)
        }
    }

    const subscribeToMessages = () => {
        // ... existing subscription logic ...
        // For brevity, re-fetching on any message change
        const subscription = supabase
            .channel('chat-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchConversations)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'group_messages' }, fetchGroups)
            .subscribe()

        return () => subscription.unsubscribe()
    }

    const subscribeToGroups = () => {
        const subscription = supabase
            .channel('group-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${user.id}` }, fetchGroups)
            .subscribe()

        return () => subscription.unsubscribe()
    }

    // Merge and sort
    const allChats = [...conversations, ...groups].sort((a, b) => b.updatedAt - a.updatedAt)

    const filteredChats = allChats.filter(chat => {
        const name = chat.type === 'group' ? chat.name : chat.partner?.full_name
        return name?.toLowerCase().includes(searchQuery.toLowerCase())
    })

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Messages</h1>
                <button
                    className="create-group-btn"
                    onClick={() => setShowCreateGroup(true)}
                >
                    <Plus size={20} /> New Group
                </button>
            </div>

            <div className="page-content">
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {loading ? (
                    <div className="loading-container">
                        <p>Loading messages...</p>
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="empty-state">
                        <MessageCircle size={64} style={{ opacity: 0.3 }} />
                        <p>No conversations yet</p>
                    </div>
                ) : (
                    <div className="conversations-list">
                        {filteredChats.map((chat) => (
                            <motion.div
                                key={chat.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="conversation-item"
                                onClick={() => navigate(chat.type === 'group' ? `/chat/group/${chat.id}` : `/chat/${chat.id}`)}
                            >
                                <div className="avatar-wrapper">
                                    <img
                                        src={chat.type === 'group' ? chat.avatar_url : chat.partner?.avatar_url}
                                        alt="avatar"
                                        className="conv-avatar"
                                    />
                                    {chat.type === 'group' && (
                                        <div className="group-badge">
                                            <Users size={10} />
                                        </div>
                                    )}
                                </div>

                                <div className="conv-info">
                                    <div className="conv-header">
                                        <h3>{chat.type === 'group' ? chat.name : chat.partner?.full_name}</h3>
                                        <span className="conv-time">
                                            {formatDistanceToNow(chat.lastMessage?.created_at)}
                                        </span>
                                    </div>
                                    <p className="conv-preview">
                                        {chat.lastMessage?.sender_id === user.id && 'You: '}
                                        {chat.lastMessage?.content}
                                    </p>
                                </div>
                                {chat.unreadCount > 0 && (
                                    <div className="unread-badge">{chat.unreadCount}</div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showCreateGroup && (
                    <CreateGroupModal
                        onClose={() => setShowCreateGroup(false)}
                        onGroupCreated={fetchGroups}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default Chat
