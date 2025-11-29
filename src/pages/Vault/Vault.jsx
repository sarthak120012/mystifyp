import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Lock, FileText, Mic, Image, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { LiquidGlassButton } from '../../components/LiquidGlassButton'
import toast from 'react-hot-toast'
import './Vault.css'

const Vault = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [isLocked, setIsLocked] = useState(true)
    const [pin, setPin] = useState('')
    const [hasPin, setHasPin] = useState(false)
    const [activeTab, setActiveTab] = useState('notes')
    const [items, setItems] = useState([])
    const [showNewItem, setShowNewItem] = useState(false)
    const [newItemContent, setNewItemContent] = useState('')
    const [recording, setRecording] = useState(false)
    const [showPin, setShowPin] = useState(false)

    useEffect(() => {
        checkPinExists()
    }, [])

    useEffect(() => {
        if (!isLocked) {
            fetchVaultItems()
        }
    }, [isLocked, activeTab])

    const checkPinExists = async () => {
        try {
            const { data } = await supabase
                .from('vault_pins')
                .select('*')
                .eq('user_id', user.id)
                .single()

            setHasPin(!!data)
        } catch (error) {
            setHasPin(false)
        }
    }

    const handleUnlock = async () => {
        if (!hasPin) {
            // Create new PIN
            if (pin.length < 4) {
                toast.error('PIN must be at least 4 digits')
                return
            }

            try {
                await supabase
                    .from('vault_pins')
                    .insert({
                        user_id: user.id,
                        pin_hash: pin // In production, hash this!
                    })

                setHasPin(true)
                setIsLocked(false)
                toast.success('Vault PIN created!')
            } catch (error) {
                toast.error('Failed to create PIN')
            }
        } else {
            // Verify PIN
            try {
                const { data, error } = await supabase
                    .from('vault_pins')
                    .select('pin_hash')
                    .eq('user_id', user.id)
                    .single()

                if (error) throw error

                if (data.pin_hash === pin) {
                    setIsLocked(false)
                    toast.success('Vault unlocked!')
                } else {
                    toast.error('Incorrect PIN')
                    setPin('')
                }
            } catch (error) {
                toast.error('Failed to verify PIN')
            }
        }
    }

    const fetchVaultItems = async () => {
        try {
            const { data, error } = await supabase
                .from('vault_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('item_type', activeTab)
                .order('created_at', { ascending: false })

            if (error) throw error
            setItems(data || [])
        } catch (error) {
            console.error('Error fetching vault items:', error)
        }
    }

    const handleAddItem = async () => {
        if (!newItemContent.trim()) {
            toast.error('Content cannot be empty')
            return
        }

        try {
            await supabase
                .from('vault_items')
                .insert({
                    user_id: user.id,
                    item_type: activeTab,
                    content: newItemContent,
                    encrypted: false // In production, encrypt this!
                })

            setNewItemContent('')
            setShowNewItem(false)
            fetchVaultItems()
            toast.success('Item added to vault!')
        } catch (error) {
            toast.error('Failed to add item')
        }
    }

    const handleDeleteItem = async (itemId) => {
        try {
            await supabase
                .from('vault_items')
                .delete()
                .eq('id', itemId)

            fetchVaultItems()
            toast.success('Item deleted')
        } catch (error) {
            toast.error('Failed to delete item')
        }
    }

    const startRecording = () => {
        toast.info('Voice recording feature coming soon!')
        // In production, implement actual voice recording
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('private_vault')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('private_vault')
                .getPublicUrl(fileName)

            await supabase
                .from('vault_items')
                .insert({
                    user_id: user.id,
                    item_type: 'photos',
                    content: publicUrl,
                    encrypted: false
                })

            fetchVaultItems()
            toast.success('Photo added to vault!')
        } catch (error) {
            toast.error('Failed to upload photo')
        }
    }

    if (isLocked) {
        return (
            <div className="vault-container">
                <div className="vault-lock-screen">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="lock-icon-container"
                    >
                        <Lock size={64} />
                    </motion.div>

                    <h1>Private Vault</h1>
                    <p>{hasPin ? 'Enter your PIN to unlock' : 'Create a PIN to secure your vault'}</p>

                    <div className="pin-input-container">
                        <div className="pin-input-group">
                            <input
                                type={showPin ? 'text' : 'password'}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder={hasPin ? 'Enter PIN' : 'Create PIN (min 4 digits)'}
                                maxLength={6}
                                className="pin-input"
                            />
                            <button
                                onClick={() => setShowPin(!showPin)}
                                className="pin-toggle"
                            >
                                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <LiquidGlassButton
                            onClick={handleUnlock}
                            disabled={pin.length < 4}
                            fullWidth
                        >
                            {hasPin ? 'Unlock Vault' : 'Create PIN & Unlock'}
                        </LiquidGlassButton>

                        <button onClick={() => navigate(-1)} className="back-link">
                            ← Back to Settings
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container vault-page">
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <h1>🔒 Private Vault</h1>
                <button onClick={() => setIsLocked(true)} className="lock-btn">
                    <Lock size={20} />
                </button>
            </div>

            <div className="page-content">
                <div className="vault-tabs">
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`vault-tab ${activeTab === 'notes' ? 'active' : ''}`}
                    >
                        <FileText size={20} />
                        <span>Notes</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('voice')}
                        className={`vault-tab ${activeTab === 'voice' ? 'active' : ''}`}
                    >
                        <Mic size={20} />
                        <span>Voice</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('photos')}
                        className={`vault-tab ${activeTab === 'photos' ? 'active' : ''}`}
                    >
                        <Image size={20} />
                        <span>Photos</span>
                    </button>
                </div>

                <div className="vault-content">
                    {activeTab === 'notes' && (
                        <div className="vault-section">
                            <button
                                onClick={() => setShowNewItem(true)}
                                className="add-item-btn"
                            >
                                <Plus size={20} />
                                <span>New Note</span>
                            </button>

                            <AnimatePresence>
                                {showNewItem && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="new-item-form"
                                    >
                                        <textarea
                                            value={newItemContent}
                                            onChange={(e) => setNewItemContent(e.target.value)}
                                            placeholder="Write your private note..."
                                            className="note-textarea"
                                            rows={6}
                                        />
                                        <div className="form-actions">
                                            <LiquidGlassButton onClick={handleAddItem}>
                                                Save Note
                                            </LiquidGlassButton>
                                            <button
                                                onClick={() => {
                                                    setShowNewItem(false)
                                                    setNewItemContent('')
                                                }}
                                                className="cancel-btn"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="vault-items">
                                {items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="vault-item note-item"
                                    >
                                        <p>{item.content}</p>
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="delete-btn"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'voice' && (
                        <div className="vault-section">
                            <button onClick={startRecording} className="add-item-btn">
                                <Mic size={20} />
                                <span>{recording ? 'Stop Recording' : 'Record Voice Note'}</span>
                            </button>

                            <div className="vault-items">
                                {items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="vault-item voice-item"
                                    >
                                        <Mic size={24} />
                                        <span>Voice Note</span>
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="delete-btn"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'photos' && (
                        <div className="vault-section">
                            <label className="add-item-btn">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <Image size={20} />
                                <span>Add Photo</span>
                            </label>

                            <div className="vault-items photos-grid">
                                {items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="vault-item photo-item"
                                    >
                                        <img src={item.content} alt="Vault photo" />
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="delete-btn"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {items.length === 0 && !showNewItem && (
                        <div className="empty-vault">
                            <p>No {activeTab} in your vault yet</p>
                            <span>Add your first item to get started</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Vault
