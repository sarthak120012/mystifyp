import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './SplashScreen.css'

export const SplashScreen = ({ onFinish }) => {
    const [show, setShow] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false)
            setTimeout(onFinish, 500)
        }, 2500)

        return () => clearTimeout(timer)
    }, [onFinish])

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="splash-screen"
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="splash-content"
                    >
                        <motion.div
                            animate={{
                                rotateY: 360,
                                scale: [1, 1.2, 1]
                            }}
                            transition={{
                                rotateY: { duration: 2, repeat: Infinity, ease: "linear" },
                                scale: { duration: 1.5, repeat: Infinity }
                            }}
                            className="splash-logo"
                        >
                            <div className="logo-3d">
                                <span className="logo-text">M</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="splash-title"
                        >
                            Mystify
                        </motion.h1>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="splash-subtitle"
                        >
                            Anonymous Chat
                        </motion.p>

                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.7, duration: 1.5 }}
                            className="splash-loader"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
