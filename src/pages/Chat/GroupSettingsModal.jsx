import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Trash2, LogOut, Shield, Search, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import './GroupSettingsModal.css'

const GroupSettingsModal = ({ group, onClose, onUpdate, onLeave }) => {
    const { user } = useAuthStore()
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddMembers, setShowAddMembers] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])

    const isAdmin = group?.admin_id === user.id

    useEffect(() => {
        fetchMembers()
    }, [group.id])

    // Search users to add
    useEffect(() => {
        if (!showAddMembers) return

        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([])
                return
            }

            try {
                // Get IDs of current members to exclude
                const memberIds = members.map(m => m.user_id)

                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url')
                    .ilike('username', `%${searchQuery}%`)
                    .not('id', 'in', `(${memberIds.join(',')})`)
                    .limit(5)

                if (error) throw error
                setSearchResults(data || [])
            } catch (error) {
                console.error('Error searching users:', error)
            }
        }

        const timeoutId = setTimeout(searchUsers, 300)
        return () => clearTimeout(timeoutId)
    }, [searchQuery, showAddMembers, members])

    const fetchMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    *,
                    profile:user_id (id, username, full_name, avatar_url)
                `)
                .eq('group_id', group.id)

            if (error) throw error
            setMembers(data || [])
        } catch (error) {
            console.error('Error fetching members:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddMembers = async () => {
        try {
            const membersToAdd = selectedUsers.map(u => ({
                group_id: group.id,
                user_id: u.id
            }))

            const { error } = await supabase
                .from('group_members')
                .insert(membersToAdd)

            if (error) throw error

            // System message
            await supabase
                .from('group_messages')
                .insert({
                    group_id: group.id,
                    content: `${user.user_metadata?.full_name} added ${selectedUsers.map(u => u.username).join(', ')}`,
                    type: 'system'
                })

            toast.success('Members added')
            setShowAddMembers(false)
            setSelectedUsers([])
            fetchMembers()
        } catch (error) {
            console.error('Error adding members:', error)
            toast.error('Failed to add members')
        }
    }

    const handleKickMember = async (memberId, memberName) => {
        if (!confirm(`Are you sure you want to remove ${memberName}?`)) return

        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', group.id)
                .eq('user_id', memberId)

            if (error) throw error

            // System message
            await supabase
                .from('group_messages')
                .insert({
                    group_id: group.id,
                    content: `${memberName} was removed by admin`,
                    type: 'system'
                })

            toast.success('Member removed')
            fetchMembers()
        } catch (error) {
            console.error('Error removing member:', error)
            toast.error('Failed to remove member')
        }
    }

    const handleLeaveGroup = async () => {
        if (!confirm('Are you sure you want to leave this group?')) return

        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', group.id)
                .eq('user_id', user.id)

            if (error) throw error

            // System message
            await supabase
                .from('group_messages')
                .insert({
                    group_id: group.id,
                    content: `${user.user_metadata?.full_name} left the group`,
                    type: 'system'
                })

            toast.success('Left group')
            onLeave()
        } catch (error) {
            console.error('Error leaving group:', error)
            toast.error('Failed to leave group')
        }
    }

    const handleDeleteGroup = async () => {
        if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return

        try {
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', group.id)

            if (error) throw error

            toast.success('Group deleted')
            onLeave()
        } catch (error) {
            console.error('Error deleting group:', error)
            toast.error('Failed to delete group')
        }
    }

    const handleUserSelect = (selectedUser) => {
        if (selectedUsers.find(u => u.id === selectedUser.id)) {
            setSelectedUsers(prev => prev.filter(u => u.id !== selectedUser.id))
        } else {
            setSelectedUsers(prev => [...prev, selectedUser])
        }
    }

    return (
        <div className="modal-overlay">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="modal-content group-settings-modal"
            >
                <div className="modal-header">
                    <h3>Group Info</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="group-info-header">
                        <img src={group.avatar_url} alt={group.name} className="group-avatar-large" />
                        <div className="group-text">
                            <h2>{group.name}</h2>
                            <span>{members.length} members</span>
                        </div>
                    </div>

                    <div className="members-section">
                        <div className="section-header">
                            <h4>Members</h4>
                            <button
                                className="add-member-btn"
                                onClick={() => setShowAddMembers(!showAddMembers)}
                            >
                                <UserPlus size={16} /> Add
                            </button>
                        </div>

                        {showAddMembers && (
                            <div className="add-members-panel">
                                <div className="search-bar">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="users-list small">
                                    {searchResults.map(u => {
                                        const isSelected = selectedUsers.find(sel => sel.id === u.id)
                                        return (
                                            <div
                                                key={u.id}
                                                className={`user-item ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleUserSelect(u)}
                                            >
                                                <img src={u.avatar_url} alt={u.username} />
                                                <span>{u.username}</span>
                                                {isSelected && <Check size={14} className="check-icon" />}
                                            </div>
                                        )
                                    })}
                                </div>
                                {selectedUsers.length > 0 && (
                                    <button className="btn-primary full-width" onClick={handleAddMembers}>
                                        Add {selectedUsers.length} Members
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="members-list">
                            {members.map(member => (
                                <div key={member.id} className="member-item">
                                    <img src={member.profile?.avatar_url} alt={member.profile?.username} />
                                    <div className="member-info">
                                        <span className="name">{member.profile?.full_name}</span>
                                        {group.admin_id === member.user_id && <span className="admin-badge">Admin</span>}
                                    </div>

                                    {isAdmin && member.user_id !== user.id && (
                                        <button
                                            className="kick-btn"
                                            onClick={() => handleKickMember(member.user_id, member.profile?.full_name)}
                                            title="Remove member"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="danger-zone">
                        <button className="danger-action-btn" onClick={handleLeaveGroup}>
                            <LogOut size={18} /> Leave Group
                        </button>

                        {isAdmin && (
                            <button className="danger-action-btn delete" onClick={handleDeleteGroup}>
                                <Trash2 size={18} /> Delete Group
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default GroupSettingsModal
