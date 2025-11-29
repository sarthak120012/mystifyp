import React, { useState, useEffect, useRef } from 'react'
import './StrangerThingsClouds.css'

const StrangerThingsClouds = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const containerRef = useRef(null)

    useEffect(() => {
        const handleMouseMove = (e) => {
            // Normalize mouse position to -1 to 1 range
            const x = (e.clientX / window.innerWidth) * 2 - 1
            const y = (e.clientY / window.innerHeight) * 2 - 1
            setMousePosition({ x, y })
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    // Calculate parallax transforms for different layers
    const getLayerTransform = (depth) => {
        const moveX = mousePosition.x * depth * 15
        const moveY = mousePosition.y * depth * 15
        const rotateX = mousePosition.y * depth * 2
        const rotateY = -mousePosition.x * depth * 2

        return {
            transform: `
                translate3d(${moveX}px, ${moveY}px, ${depth * 20}px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
            `,
            transition: 'transform 0.3s ease-out'
        }
    }

    return (
        <div className="st-sky-container" ref={containerRef}>
            <div
                className="st-fog-layer layer-1"
                style={getLayerTransform(3)}
            ></div>
            <div
                className="st-fog-layer layer-2"
                style={getLayerTransform(2)}
            ></div>
            <div
                className="st-fog-layer layer-3"
                style={getLayerTransform(1)}
            ></div>
            <div
                className="st-lightning"
                style={getLayerTransform(2.5)}
            ></div>
            <div
                className="st-particles"
                style={getLayerTransform(4)}
            ></div>
        </div>
    )
}

export default StrangerThingsClouds
