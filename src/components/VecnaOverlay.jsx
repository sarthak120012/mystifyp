import React, { useState, useEffect, useRef } from 'react'
import './VecnaOverlay.css'

const VecnaOverlay = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const containerRef = useRef(null)

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1
            const y = (e.clientY / window.innerHeight) * 2 - 1
            setMousePosition({ x, y })
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    const getParallaxStyle = (depth) => {
        const moveX = -mousePosition.x * depth * 20
        const moveY = -mousePosition.y * depth * 20
        const rotateX = mousePosition.y * depth * 3
        const rotateY = -mousePosition.x * depth * 3

        return {
            transform: `
                translate3d(${moveX}px, ${moveY}px, ${depth * 15}px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
            `,
            transition: 'transform 0.4s ease-out'
        }
    }

    return (
        <div className="vecna-container" ref={containerRef}>
            <div className="vecna-vines" style={getParallaxStyle(1)}></div>
            <div className="vecna-silhouette" style={getParallaxStyle(2)}></div>
            <div className="vecna-clock" style={getParallaxStyle(3)}>
                <div className="clock-face"></div>
                <div className="clock-pendulum"></div>
            </div>
            <div className="vecna-particles" style={getParallaxStyle(4)}></div>
        </div>
    )
}

export default VecnaOverlay
