import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, X, Upload, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { LiquidGlassButton } from './LiquidGlassButton'
import './CreatePost.css'

export const CreatePost = ({ onPostCreated }) => {
    const { user } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)
    const [caption, setCaption] = useState('')
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [uploading, setUploading] = useState(false)

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB')
                return
            }
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleRemoveImage = () => {
        setImageFile(null)
        setImagePreview(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!caption.trim() && !imageFile) {
            toast.error('Please add a caption or image')
            return
        }

        setUploading(true)

        try {
            let publicUrl = null

            if (imageFile) {
                // Upload image to Supabase Storage
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${user.id}/${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('posts')
                    .upload(fileName, imageFile)

                if (uploadError) throw uploadError

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('posts')
                    .getPublicUrl(fileName)

                publicUrl = urlData.publicUrl
            }

            // Create post in database
            const { data: post, error: postError } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    caption: caption.trim() || null,
                    image_url: publicUrl
                })
                .select()
                .single()

            if (postError) throw postError

            toast.success('Post created!')
            setIsOpen(false)
            setCaption('')
            setImageFile(null)
            setImagePreview(null)

            if (onPostCreated) onPostCreated(post)
        } catch (error) {
            console.error('Error creating post:', error)
            toast.error(error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <>
            <div className="desktop-create-btn">
                <LiquidGlassButton
                    onClick={() => setIsOpen(true)}
                    icon={<Image size={20} />}
                    fullWidth
                >
                    Create Post
                </LiquidGlassButton>
            </div>

            <div className="mobile-create-fab">
                <label className="fab-btn">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            handleImageChange(e)
                            setIsOpen(true)
                        }}
                        style={{ display: 'none' }}
                    />
                    <div className="plus-icon">
                        <Upload size={24} />
                    </div>
                </label>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => !uploading && setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Create Post</h2>
                                <button
                                    onClick={() => !uploading && setIsOpen(false)}
                                    className="close-btn"
                                    disabled={uploading}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="create-post-form">
                                <textarea
                                    placeholder="What's on your mind?"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    className="input caption-input"
                                    rows={4}
                                    maxLength={500}
                                    disabled={uploading}
                                />

                                {imagePreview && (
                                    <div className="image-thumbnail-container">
                                        <div className="image-thumbnail">
                                            <img src={imagePreview} alt="Preview" />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="remove-thumbnail-btn"
                                                disabled={uploading}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="post-actions">
                                    <label className="image-picker-btn">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            disabled={uploading || imagePreview}
                                            style={{ display: 'none' }}
                                        />
                                        <Image size={20} />
                                        <span>{imagePreview ? 'Image Added' : 'Add Image'}</span>
                                    </label>

                                    <LiquidGlassButton
                                        type="submit"
                                        disabled={uploading || (!caption.trim() && !imageFile)}
                                        icon={uploading ? <Loader className="spin" size={20} /> : <Upload size={20} />}
                                    >
                                        {uploading ? 'Posting...' : 'Post'}
                                    </LiquidGlassButton>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
