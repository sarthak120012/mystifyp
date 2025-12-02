import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { LiquidGlassButton } from '../../components/LiquidGlassButton'
import toast from 'react-hot-toast'
import './EditProfile.css'

const EditProfile = () => {
    const navigate = useNavigate()
    const { user, profile, setProfile } = useAuthStore()
    const [username, setUsername] = useState(profile?.username || '')
    const [bio, setBio] = useState(profile?.bio || '')
    const [gender, setGender] = useState(profile?.gender || '')
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
    const [loading, setLoading] = useState(false)
    const [avatarLoading, setAvatarLoading] = useState(false)

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be less than 2MB')
            return
        }

        setAvatarLoading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            setAvatarUrl(publicUrl)
            toast.success('Avatar uploaded!')
        } catch (error) {
            console.error('Error uploading avatar:', error)
            toast.error('Failed to upload avatar')
        } finally {
            setAvatarLoading(false)
        }
    }

    const handleSave = async () => {
        if (!username.trim()) {
            toast.error('Username is required')
            return
        }

        if (username.length < 3) {
            toast.error('Username must be at least 3 characters')
            return
        }

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    username: username.trim(),
                    bio: bio.trim() || null,
                    // gender: gender, // Column missing in DB
                    avatar_url: avatarUrl
                })
                .eq('id', user.id)
                .select()
                .single()

            if (error) {
                if (error.code === '23505') {
                    toast.error('Username already taken')
                } else {
                    throw error
                }
                return
            }

            setProfile(data)
            toast.success('Profile updated!')
            navigate(-1)
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <h1>Edit Profile</h1>
                <div style={{ width: '24px' }}></div>
            </div>

            <div className="page-content edit-profile-content">
                <div className="avatar-section">
                    <div className="avatar-preview">
                        <img
                            src={avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                            alt="Avatar"
                            className="avatar-image"
                        />
                        {avatarLoading && (
                            <div className="avatar-loading">
                                <Loader className="spin" size={32} />
                            </div>
                        )}
                    </div>

                    <label className="change-avatar-btn">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                            disabled={avatarLoading}
                        />
                        <Camera size={20} />
                        <span>Change Avatar</span>
                    </label>
                </div>

                <div className="form-section">
                    <div className="form-field">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="Enter username..."
                            className="input"
                            maxLength={20}
                        />
                        <span className="input-hint">
                            Only lowercase letters, numbers, and underscores
                        </span>
                    </div>

                    <div className="form-field">
                        <label>Gender</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="input"
                        >
                            <option value="" disabled>Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            className="textarea"
                            rows={4}
                            maxLength={150}
                        />
                        <span className="input-hint">
                            {bio.length}/150 characters
                        </span>
                    </div>
                </div>

                <div className="form-actions">
                    <LiquidGlassButton
                        onClick={() => navigate(-1)}
                        variant="secondary"
                        fullWidth
                    >
                        Cancel
                    </LiquidGlassButton>

                    <LiquidGlassButton
                        onClick={handleSave}
                        disabled={loading}
                        icon={loading ? <Loader className="spin" size={20} /> : null}
                        fullWidth
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </LiquidGlassButton>
                </div>
            </div>
        </div>
    )
}

export default EditProfile
