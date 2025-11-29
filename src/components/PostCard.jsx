import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Send, MoreVertical, Edit, Trash2, Flag, UserX, X, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from '../lib/utils'
import toast from 'react-hot-toast'
import './PostCard.css'

export const PostCard = ({ post, onUpdate, onDelete }) => {
    const { user } = useAuthStore()
    const [liked, setLiked] = useState(false)
    const [likesCount, setLikesCount] = useState(post.likes_count || 0)
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
    const [showComments, setShowComments] = useState(false)
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)

    // Menu & Modals
    const [showMenu, setShowMenu] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [showBlockConfirm, setShowBlockConfirm] = useState(false)

    // Edit state
    const [editCaption, setEditCaption] = useState(post.caption || '')
    const [editLoading, setEditLoading] = useState(false)

    // Report state
    const [reportReason, setReportReason] = useState('spam')
    const [reportNotes, setReportNotes] = useState('')

    const menuRef = useRef(null)
    const isOwner = post.user_id === user?.id

    useEffect(() => {
        checkIfLiked()

        // Real-time subscriptions
        const channel = supabase
            .channel(`post-${post.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'likes',
                    filter: `post_id=eq.${post.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setLikesCount(prev => prev + 1)
                        // Check if this user liked it
                        if (payload.new.user_id === user.id) {
                            setLiked(true)
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setLikesCount(prev => Math.max(0, prev - 1))
                        // Check if this user unliked it
                        if (payload.old.user_id === user.id) {
                            setLiked(false)
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'comments',
                    filter: `post_id=eq.${post.id}`
                },
                async (payload) => {
                    setCommentsCount(prev => prev + 1)

                    if (showComments) {
                        const { data } = await supabase
                            .from('comments')
                            .select(`
                                *,
                                profiles:user_id (
                                    id,
                                    username,
                                    avatar_url
                                )
                            `)
                            .eq('id', payload.new.id)
                            .single()

                        if (data) {
                            setComments(prev => [...prev, data])
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [post.id, showComments, user.id])

    useEffect(() => {
        if (showComments) {
            fetchComments()
        }
    }, [showComments])

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const checkIfLiked = async () => {
        const { data } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .single()

        setLiked(!!data)
    }

    const handleLike = async () => {
        try {
            if (liked) {
                await supabase
                    .from('likes')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', user.id)

                setLiked(false)
            } else {
                await supabase
                    .from('likes')
                    .insert({
                        post_id: post.id,
                        user_id: user.id
                    })

                setLiked(true)

                // Create notification for post owner
                if (post.user_id !== user.id) {
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: post.user_id,
                            type: 'like',
                            actor_id: user.id,
                            post_id: post.id
                        })
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error)
            toast.error('Failed to update like')
        }
    }

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles:user_id (
                    id,
                    username,
                    avatar_url
                )
            `)
            .eq('post_id', post.id)
            .order('created_at', { ascending: true })

        if (!error && data) {
            setComments(data)
        }
    }

    const handleComment = async (e) => {
        e.preventDefault()
        if (!newComment.trim()) return

        setLoading(true)

        try {
            const mentions = newComment.match(/@(\w+)/g)?.map(m => m.substring(1)) || []

            const { error } = await supabase
                .from('comments')
                .insert({
                    post_id: post.id,
                    user_id: user.id,
                    content: newComment.trim(),
                    mentions
                })

            if (error) throw error

            setNewComment('')

            // Create notification for post owner
            if (post.user_id !== user.id) {
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: post.user_id,
                        type: 'comment',
                        actor_id: user.id,
                        post_id: post.id
                    })
            }

            toast.success('Comment added!')
        } catch (error) {
            console.error('Error adding comment:', error)
            toast.error('Failed to add comment')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = async () => {
        if (!editCaption.trim() && !post.image_url) {
            toast.error('Post must have caption or image')
            return
        }

        setEditLoading(true)
        try {
            const { error } = await supabase
                .from('posts')
                .update({ caption: editCaption.trim() })
                .eq('id', post.id)

            if (error) throw error

            toast.success('Post updated!')
            setShowEditModal(false)
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error('Error updating post:', error)
            toast.error('Failed to update post')
        } finally {
            setEditLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', post.id)

            if (error) throw error

            toast.success('Post deleted!')
            setShowDeleteConfirm(false)
            if (onDelete) onDelete(post.id)
        } catch (error) {
            console.error('Error deleting post:', error)
            toast.error('Failed to delete post')
        }
    }

    const handleReport = async () => {
        try {
            const { error } = await supabase
                .from('reports')
                .insert({
                    reporter_id: user.id,
                    reported_user_id: post.user_id,
                    post_id: post.id,
                    reason: reportReason,
                    type: 'post',
                    notes: reportNotes.trim() || null
                })

            if (error) throw error

            toast.success('Report submitted!')
            setShowReportModal(false)
            setReportReason('spam')
            setReportNotes('')
        } catch (error) {
            console.error('Error reporting post:', error)
            toast.error('Failed to submit report')
        }
    }

    const handleBlock = async () => {
        try {
            const { error } = await supabase
                .from('blocks')
                .insert({
                    user_id: user.id,
                    blocked_user_id: post.user_id
                })

            if (error) throw error

            toast.success('User blocked!')
            setShowBlockConfirm(false)
            if (onDelete) onDelete(post.id) // Remove from feed
        } catch (error) {
            console.error('Error blocking user:', error)
            toast.error('Failed to block user')
        }
    }

    const renderCaption = (text) => {
        if (!text) return null
        const parts = text.split(/(@\w+)/g)
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return (
                    <span key={i} className="mention">
                        {part}
                    </span>
                )
            }
            return part
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="post-card"
        >
            <div className="post-header">
                <img
                    src={post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={post.profiles?.username}
                    className="post-avatar"
                />
                <div className="post-user-info">
                    <h3>{post.profiles?.full_name || post.profiles?.username || 'Unknown'}</h3>
                    <span>@{post.profiles?.username || 'user'}</span>
                    <span className="post-time">
                        {formatDistanceToNow(post.created_at)}
                    </span>
                </div>
                <div className="post-menu-wrapper" ref={menuRef}>
                    <button onClick={() => setShowMenu(!showMenu)} className="post-menu-btn">
                        <MoreVertical size={20} />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="post-dropdown-menu"
                            >
                                {isOwner ? (
                                    <>
                                        <button onClick={() => { setShowEditModal(true); setShowMenu(false); }}>
                                            <Edit size={18} /> Edit Post
                                        </button>
                                        <button onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} className="danger">
                                            <Trash2 size={18} /> Delete Post
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setShowReportModal(true); setShowMenu(false); }}>
                                            <Flag size={18} /> Report Post
                                        </button>
                                        <button onClick={() => { setShowBlockConfirm(true); setShowMenu(false); }} className="danger">
                                            <UserX size={18} /> Block User
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {post.caption && (
                <p className="post-caption">
                    {renderCaption(post.caption)}
                </p>
            )}

            {post.image_url && (
                <div className="post-image-container">
                    <img src={post.image_url} alt="Post" className="post-image" />
                </div>
            )}

            <div className="post-stats">
                <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
                <span>{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
            </div>

            <div className="post-actions">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLike}
                    className={`action-btn ${liked ? 'liked' : ''}`}
                >
                    <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
                    <span>Like</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowComments(!showComments)}
                    className="action-btn"
                >
                    <MessageCircle size={24} />
                    <span>Comment</span>
                </motion.button>
            </div>

            {showComments && (
                <div className="comments-section">
                    <div className="comments-list">
                        {comments.map((comment) => (
                            <div key={comment.id} className="comment">
                                <img
                                    src={comment.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                    alt={comment.profiles?.username}
                                    className="comment-avatar"
                                />
                                <div className="comment-content">
                                    <span className="comment-username">@{comment.profiles?.username}</span>
                                    <p>{renderCaption(comment.content)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleComment} className="comment-form">
                        <input
                            type="text"
                            placeholder="Add a comment... (use @username to mention)"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="input"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            className="send-btn"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Edit Post</h3>
                                <button onClick={() => setShowEditModal(false)} className="close-btn">
                                    <X size={24} />
                                </button>
                            </div>
                            <textarea
                                value={editCaption}
                                onChange={(e) => setEditCaption(e.target.value)}
                                className="input"
                                rows={4}
                                placeholder="What's on your mind?"
                                disabled={editLoading}
                            />
                            <div className="modal-actions">
                                <button onClick={() => setShowEditModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button onClick={handleEdit} className="btn-primary" disabled={editLoading}>
                                    {editLoading ? <Loader className="spin" size={18} /> : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3>Delete Post?</h3>
                            <p>This action cannot be undone.</p>
                            <div className="modal-actions">
                                <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button onClick={handleDelete} className="btn-danger">
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setShowReportModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Report Post</h3>
                                <button onClick={() => setShowReportModal(false)} className="close-btn">
                                    <X size={24} />
                                </button>
                            </div>
                            <select
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                className="input"
                            >
                                <option value="spam">Spam</option>
                                <option value="harassment">Harassment</option>
                                <option value="inappropriate">Inappropriate Content</option>
                                <option value="misinformation">Misinformation</option>
                                <option value="other">Other</option>
                            </select>
                            <textarea
                                value={reportNotes}
                                onChange={(e) => setReportNotes(e.target.value)}
                                className="input"
                                rows={3}
                                placeholder="Additional details (optional)"
                            />
                            <div className="modal-actions">
                                <button onClick={() => setShowReportModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button onClick={handleReport} className="btn-danger">
                                    Submit Report
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Block Confirmation */}
            <AnimatePresence>
                {showBlockConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setShowBlockConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3>Block @{post.profiles?.username}?</h3>
                            <p>You won't see their posts or messages anymore.</p>
                            <div className="modal-actions">
                                <button onClick={() => setShowBlockConfirm(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button onClick={handleBlock} className="btn-danger">
                                    Block User
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
