import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Search, MessageCircle, Gamepad2, User, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import './BottomNav.css'

export const BottomNav = () => {
    const location = useLocation()

    const navItems = [
        { path: '/home', icon: Home, label: 'Home' },
        { path: '/search', icon: Search, label: 'Search' },
        { path: '/leaderboard', icon: Users, label: 'Community' },
        { path: '/chat', icon: MessageCircle, label: 'Chat' },
        { path: '/profile', icon: User, label: 'Profile' }
    ]

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-container">
                {navItems.map(({ path, icon: Icon, label }) => {
                    const isActive = location.pathname.startsWith(path)

                    return (
                        <NavLink
                            key={path}
                            to={path}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="nav-item-content"
                            >
                                <Icon
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className="nav-label">{label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="active-indicator"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </motion.div>
                        </NavLink>
                    )
                })}
            </div>
        </nav>
    )
}
