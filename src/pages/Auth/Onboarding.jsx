import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Calendar, Image, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { LiquidGlassButton } from '../../components/LiquidGlassButton'
import './Auth.css'

const Onboarding = () => {
    const navigate = useNavigate()
    const { user, refreshProfile } = useAuthStore()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Step 1: Username & DOB
    const [username, setUsername] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [gender, setGender] = useState('')
    const [bio, setBio] = useState('')

    // Step 2: Avatar Selection
    const [selectedAvatar, setSelectedAvatar] = useState(null)
    const [avatarSeed, setAvatarSeed] = useState(Date.now())

    // Generate 6 high-quality avatar URLs
    const generateAvatars = () => {
        const styles = ['adventurer', 'avataaars', 'big-ears', 'bottts', 'personas', 'pixel-art']
        const avatars = []

        for (let i = 0; i < 6; i++) {
            const style = styles[i % styles.length]
            const seed = `${avatarSeed}-${i}`
            avatars.push({
                id: i,
                url: `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`
            })
        }

        return avatars
    }

    const avatars = generateAvatars()

    const handleStep1Next = () => {
        if (!username.trim()) {
            toast.error('Please enter a username')
            return
        }
        if (!dateOfBirth) {
            toast.error('Please enter your date of birth')
            return
        }
        if (!gender) {
            toast.error('Please select your gender')
            return
        }
        setStep(2)
    }

    const handleComplete = async () => {
        if (selectedAvatar === null) {
            toast.error('Please select an avatar')
            return
        }

        setLoading(true)

        try {
            const avatarUrl = avatars[selectedAvatar].url

            // Log for debugging
            console.log('Selected avatar URL:', avatarUrl)

            // Validate avatar URL
            if (!avatarUrl || !avatarUrl.startsWith('http')) {
                throw new Error('Invalid avatar URL generated')
            }

            // Create or update profile
            const { error, data } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: username.toLowerCase().replace(/\\s+/g, ''),
                    full_name: username,
                    // date_of_birth: dateOfBirth, // Column missing in DB
                    gender: gender,
                    bio: bio || null,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            console.log('Profile created:', data)
            await refreshProfile()
            toast.success('Profile created successfully!')
            navigate('/home')
        } catch (error) {
            console.error('Profile creation error:', error)
            toast.error(error.message || 'Failed to create profile. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="onboarding-container">
                <div className="onboarding-progress">
                    <div className={`progress-dot ${step >= 1 ? 'active' : ''}`} />
                    <div className={`progress-dot ${step >= 2 ? 'active' : ''}`} />
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="onboarding-card"
                        >
                            <div className="onboarding-header">
                                <h2 className="onboarding-title">
                                    <User size={28} style={{ display: 'inline', marginRight: '8px' }} />
                                    Create Your Profile
                                </h2>
                                <p className="onboarding-description">
                                    Tell us a bit about yourself
                                </p>
                            </div>

                            <div className="auth-form">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Username (no spaces)"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="input"
                                        maxLength={20}
                                    />
                                </div>

                                <div className="input-group">
                                    <input
                                        type="date"
                                        placeholder="Date of Birth"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        className="input"
                                        style={{ color: dateOfBirth ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                                    />
                                </div>

                                <div className="input-group">
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="input"
                                        style={{ color: gender ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                                    >
                                        <option value="" disabled>Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <textarea
                                        placeholder="Bio (optional)"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="input"
                                        rows={3}
                                        maxLength={150}
                                        style={{ resize: 'none', paddingTop: '12px' }}
                                    />
                                </div>

                                <LiquidGlassButton onClick={handleStep1Next} fullWidth>
                                    Next
                                </LiquidGlassButton>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="onboarding-card"
                        >
                            <div className="onboarding-header">
                                <h2 className="onboarding-title">
                                    <Image size={28} style={{ display: 'inline', marginRight: '8px' }} />
                                    Choose Your Avatar
                                </h2>
                                <p className="onboarding-description">
                                    Pick one or generate new avatars
                                </p>
                            </div>

                            <div className="avatar-grid">
                                {avatars.map((avatar) => (
                                    <motion.div
                                        key={avatar.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`avatar-option ${selectedAvatar === avatar.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedAvatar(avatar.id)}
                                    >
                                        <img src={avatar.url} alt={`Avatar ${avatar.id}`} />
                                    </motion.div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <LiquidGlassButton
                                    onClick={() => setAvatarSeed(Date.now())}
                                    icon={<RefreshCw size={18} />}
                                    fullWidth
                                    variant="secondary"
                                >
                                    Generate New
                                </LiquidGlassButton>
                                <LiquidGlassButton
                                    onClick={handleComplete}
                                    fullWidth
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Complete'}
                                </LiquidGlassButton>
                            </div>

                            <LiquidGlassButton
                                onClick={() => setStep(1)}
                                fullWidth
                                variant="secondary"
                                style={{ marginTop: 'var(--space-2)' }}
                            >
                                Back
                            </LiquidGlassButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    )
}

export default Onboarding
