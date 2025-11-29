import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Check, Users, Camera } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import './CreateGroupModal.css'

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
    const { user } = useAuthStore()
    const [step, setStep] = useState(1) // 1: Details, 2: Members
    const [groupName, setGroupName] = useState('')
    const [groupAvatar, setGroupAvatar] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])
    const [loading, setLoading] = useState(false)

    // Search users to add
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([])
                return
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url')
                    .ilike('username', `%${searchQuery}%`)
                    .neq('id', user.id)
                    .limit(5)

                if (error) throw error
                setSearchResults(data || [])
            } catch (error) {
                console.error('Error searching users:', error)
            }
        }

        const timeoutId = setTimeout(searchUsers, 300)
        return () => clearTimeout(timeoutId)
    }, [searchQuery, user.id])

    const handleUserSelect = (selectedUser) => {
        if (selectedUsers.find(u => u.id === selectedUser.id)) {
            setSelectedUsers(prev => prev.filter(u => u.id !== selectedUser.id))
        } else {
            setSelectedUsers(prev => [...prev, selectedUser])
        }
    }

    const handleCreateGroup = async () => {
        if (!groupName.trim()) return
        setLoading(true)

        try {
            const groupId = crypto.randomUUID()

            // 1. Create Group (Insert only, no select to avoid RLS race)
            const { error: groupError } = await supabase
                .from('groups')
                .insert({
                    id: groupId,
                    name: groupName,
                    avatar_url: groupAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${groupName}`,
                    admin_id: user.id
                })

            if (groupError) throw groupError

            // 2. Add Admin (Self) & Members
            const membersToAdd = [
                { group_id: groupId, user_id: user.id },
                ...selectedUsers.map(u => ({ group_id: groupId, user_id: u.id }))
            ]

            const { error: membersError } = await supabase
                .from('group_members')
                .insert(membersToAdd)

            if (membersError) throw membersError

            // 3. Add System Message
            const { error: msgError } = await supabase
                .from('group_messages')
                .insert({
                    group_id: groupId,
                    content: `Group created by ${user.user_metadata?.full_name || 'Admin'}. ${selectedUsers.length} members added.`,
                    type: 'system'
                })

            if (msgError) throw msgError

            toast.success('Group created successfully!')
            onGroupCreated()
            onClose()
        } catch (error) {
            console.error('Error creating group:', error)
            toast.error(`Failed to create group: ${error.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="modal-content create-group-modal"
            >
                <div className="modal-header">
                    <h3>Create New Group</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    {step === 1 ? (
                        <div className="step-content">
                            <div className="avatar-selection-section">
                                <label>Choose Group Avatar</label>
                                <div className="avatar-grid">
                                    {['Group', 'Team', 'Squad', 'Family', 'Work', 'Fun', 'Gaming', 'Trip'].map((seed) => {
                                        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`
                                        const isSelected = groupAvatar === avatarUrl
                                        return (
                                            <div
                                                key={seed}
                                                className={`avatar-option ${isSelected ? 'selected' : ''}`}
                                                onClick={() => setGroupAvatar(avatarUrl)}
                                            >
                                                <img src={avatarUrl} alt={seed} />
                                                {isSelected && <div className="selected-overlay"><Check size={16} /></div>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Group Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Weekend Plans"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button
                                className="btn-primary full-width"
                                disabled={!groupName.trim()}
                                onClick={() => setStep(2)}
                            >
                                Next: Add Members
                            </button>
                        </div>
                    ) : (
                        <div className="step-content">
                            <div className="search-bar">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="selected-users-chips">
                                {selectedUsers.map(u => (
                                    <div key={u.id} className="user-chip">
                                        <img src={u.avatar_url} alt={u.username} />
                                        <span>{u.username}</span>
                                        <button onClick={() => handleUserSelect(u)}><X size={12} /></button>
                                    </div>
                                ))}
                            </div>

                            <div className="users-list">
                                {searchResults.map(u => {
                                    const isSelected = selectedUsers.find(sel => sel.id === u.id)
                                    return (
                                        <div
                                            key={u.id}
                                            className={`user-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleUserSelect(u)}
                                        >
                                            <img src={u.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={u.username} />
                                            <div className="user-info">
                                                <h4>{u.full_name}</h4>
                                                <span>@{u.username}</span>
                                            </div>
                                            {isSelected && <Check size={18} className="check-icon" />}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                                <button
                                    className="btn-primary"
                                    onClick={handleCreateGroup}
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : `Create Group (${selectedUsers.length + 1})`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default CreateGroupModal
