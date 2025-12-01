import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Palette, Lock, LogOut, Trash2, Shield, FileText, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import toast from 'react-hot-toast'
import { LiquidGlassButton } from '../../components/LiquidGlassButton'
import './Settings.css'

const Settings = () => {
    const navigate = useNavigate()
    const { user, signOut } = useAuthStore()
    const { currentTheme, setTheme } = useThemeStore()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const themes = [
        { id: 'bubble', name: 'Bubble Dream', icon: '🌊', color: '#A85CFF' },
        { id: 'cat', name: 'CatPlay Cute', icon: '🐱', color: '#FF9CB7' },
        { id: 'ultra', name: 'Ultra Vision', icon: '🌌', color: '#5200FF' },
        { id: 'coffee', name: 'Coffee Break', icon: '☕', color: '#8D6E63' }
    ]

    const handleThemeChange = async (themeId) => {
        setTheme(themeId)

        try {
            await supabase
                .from('profiles')
                .update({ theme_preference: themeId })
                .eq('id', user.id)

            toast.success('Theme updated!')
        } catch (error) {
            console.error('Error updating theme:', error)
        }
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/signin')
    }

    const handleDeleteAccount = async () => {
        try {
            const { error } = await supabase.auth.admin.deleteUser(user.id)
            if (error) throw error

            toast.success('Account deleted')
            navigate('/signin')
        } catch (error) {
            console.error('Error deleting account:', error)
            toast.error('Failed to delete account. Please contact support.')
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Settings</h1>
            </div>

            <div className="page-content settings-content">
                {/* Theme Selection */}
                <div className="settings-section">
                    <div className="section-header">
                        <Palette size={24} />
                        <h2>Theme</h2>
                    </div>
                    <div className="themes-grid">
                        {themes.map((theme) => (
                            <motion.div
                                key={theme.id}
                                whileTap={{ scale: 0.95 }}
                                className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                                onClick={() => handleThemeChange(theme.id)}
                                style={{ '--theme-color': theme.color }}
                            >
                                <div className="theme-icon">{theme.icon}</div>
                                <span>{theme.name}</span>
                                {currentTheme === theme.id && (
                                    <div className="active-indicator">✓</div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Account */}
                <div className="settings-section">
                    <div className="section-header">
                        <Shield size={24} />
                        <h2>Account</h2>
                    </div>
                    <div className="settings-list">
                        <button
                            onClick={() => navigate('/vault')}
                            className="settings-item"
                        >
                            <Lock size={20} />
                            <span>Private Vault</span>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Legal */}
                <div className="settings-section">
                    <div className="section-header">
                        <FileText size={24} />
                        <h2>Legal</h2>
                    </div>
                    <div className="settings-list">
                        <button className="settings-item" onClick={() => navigate('/privacy-policy')}>
                            <FileText size={20} />
                            <span>Privacy Policy</span>
                            <ChevronRight size={20} />
                        </button>
                        <button className="settings-item" onClick={() => navigate('/terms-conditions')}>
                            <FileText size={20} />
                            <span>Terms of Service</span>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="settings-actions">
                    <LiquidGlassButton
                        onClick={handleSignOut}
                        icon={<LogOut size={20} />}
                        fullWidth
                    >
                        Sign Out
                    </LiquidGlassButton>

                    <button
                        className="delete-account-btn"
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        <Trash2 size={20} />
                        Delete Account
                    </button>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2>Delete Account?</h2>
                            <p>This action cannot be undone. All your data will be permanently deleted.</p>
                            <div className="modal-actions">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="liquid-glass-btn"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="delete-confirm-btn"
                                >
                                    Delete Forever
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Settings
