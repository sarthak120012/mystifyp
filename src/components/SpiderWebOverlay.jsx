import React from 'react'
import './SpiderWebOverlay.css'

const SpiderWebOverlay = () => {
    return (
        <div className="spider-web-container">
            {/* Corner Webs */}
            <div className="web-corner top-left">
                <svg viewBox="0 0 150 150" className="web-svg">
                    {/* Radial lines */}
                    <line x1="0" y1="0" x2="150" y2="150" className="web-line" />
                    <line x1="0" y1="0" x2="150" y2="100" className="web-line" />
                    <line x1="0" y1="0" x2="150" y2="50" className="web-line" />
                    <line x1="0" y1="0" x2="100" y2="0" className="web-line" />
                    <line x1="0" y1="0" x2="50" y2="0" className="web-line" />
                    <line x1="0" y1="0" x2="100" y2="150" className="web-line" />
                    <line x1="0" y1="0" x2="50" y2="150" className="web-line" />
                    <line x1="0" y1="0" x2="0" y2="150" className="web-line" />

                    {/* Concentric curves */}
                    <path d="M 0 30 Q 30 30 30 0" className="web-line" fill="none" />
                    <path d="M 0 60 Q 60 60 60 0" className="web-line" fill="none" />
                    <path d="M 0 90 Q 90 90 90 0" className="web-line" fill="none" />
                    <path d="M 0 120 Q 120 120 120 0" className="web-line" fill="none" />
                </svg>
            </div>

            <div className="web-corner top-right">
                <svg viewBox="0 0 150 150" className="web-svg">
                    <line x1="150" y1="0" x2="0" y2="150" className="web-line" />
                    <line x1="150" y1="0" x2="0" y2="100" className="web-line" />
                    <line x1="150" y1="0" x2="0" y2="50" className="web-line" />
                    <line x1="150" y1="0" x2="50" y2="0" className="web-line" />
                    <line x1="150" y1="0" x2="100" y2="0" className="web-line" />
                    <line x1="150" y1="0" x2="50" y2="150" className="web-line" />
                    <line x1="150" y1="0" x2="100" y2="150" className="web-line" />
                    <line x1="150" y1="0" x2="150" y2="150" className="web-line" />

                    <path d="M 150 30 Q 120 30 120 0" className="web-line" fill="none" />
                    <path d="M 150 60 Q 90 60 90 0" className="web-line" fill="none" />
                    <path d="M 150 90 Q 60 90 60 0" className="web-line" fill="none" />
                    <path d="M 150 120 Q 30 120 30 0" className="web-line" fill="none" />
                </svg>
            </div>

            {/* Floating web strands */}
            <div className="web-strand strand-1"></div>
            <div className="web-strand strand-2"></div>
            <div className="web-strand strand-3"></div>

            {/* Creepy particles */}
            <div className="web-particles"></div>

            {/* Pulsing red glow in corners */}
            <div className="web-glow glow-1"></div>
            <div className="web-glow glow-2"></div>
        </div>
    )
}

export default SpiderWebOverlay
