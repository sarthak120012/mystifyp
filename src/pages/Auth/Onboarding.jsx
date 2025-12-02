import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Calendar, Image, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { LiquidGlassButton } from '../../components/LiquidGlassButton'
import './Auth.css'
import './AuthInput.css'

const Onboarding = () => {
    const navigate = useNavigate()
    const { user, refreshProfile } = useAuthStore()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Step 1: Username & DOB
    const [username, setUsername] = useState('')
    const [usernameAvailable, setUsernameAvailable] = useState(null)
    const [checkingUsername, setCheckingUsername] = useState(false)
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [gender, setGender] = useState('')
    const [bio, setBio] = useState('')

    // Check username availability
    const checkUsernameAvailability = async (username) => {
        if (!username || username.length < 3) {
            setUsernameAvailable(null)
            return
        }

        setCheckingUsername(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username.toLowerCase().trim())
                .single()

            if (error && error.code === 'PGRST116') {
                // Username not found, it's available
                setUsernameAvailable(true)
            } else if (data) {
                // Username exists
                setUsernameAvailable(false)
            }
        } catch (error) {
            console.error('Error checking username:', error)
        } finally {
            setCheckingUsername(false)
        }
    }

    // Debounce username check
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (username) {
                checkUsernameAvailability(username)
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [username])

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

    const handleStep1Next = async () => {
        if (!username.trim()) {
            toast.error('Please enter a username')
            return
        }
        if (username.length < 3) {
            toast.error('Username must be at least 3 characters')
            return
        }
        if (!dateOfBirth) {
            toast.error('Please enter your date of birth')
            return
        }

        // Check username availability before proceeding
        if (usernameAvailable === false) {
            toast.error('Username is already taken. Please choose another.')
            return
        }

        if (usernameAvailable === null) {
            // Force check if not done yet
            await checkUsernameAvailability(username)
            return // Let user click next again after check
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
            // FINAL username check before creating profile
            const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '')

            const { data: existingUser } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', cleanUsername)
                .single()

            if (existingUser) {
                toast.error('Username is already taken. Please go back and choose another.')
                setLoading(false)
                return
            }

            const avatarUrl = avatars[selectedAvatar].url

            // Validate avatar URL
            if (!avatarUrl || !avatarUrl.startsWith('http')) {
                throw new Error('Invalid avatar URL generated')
            }

            // Create profile
            const { error, data } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    username: cleanUsername,
                    full_name: username,
                    bio: bio || null,
                    avatar_url: avatarUrl,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) {
                console.error('Supabase error:', error)
                if (error.code === '23505') {
                    toast.error('Username already exists. Please choose another.')
                    setStep(1) // Go back to step 1
                    return
                }
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
