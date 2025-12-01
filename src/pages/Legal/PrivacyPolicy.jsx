import React from 'react'
import { motion } from 'framer-motion'
import { Shield, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PrivacyPolicy = () => {
    const navigate = useNavigate()

    return (
        <div className="page-container">
            <div className="profile-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="legal-content"
            >
                <div className="legal-header">
                    <Shield size={48} className="text-accent" />
                    <h1>Privacy Policy</h1>
                </div>

                <div className="legal-section">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <h2>1. Introduction</h2>
                    <p>Welcome to Mystify. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website or use our application.</p>

                    <h2>2. Contact Details</h2>
                    <p>Full Name: SARTHAK CHOUDHARY</p>
                    <p>Email: choudharysarthak799@gmail.com</p>
                    <p>Address: TOWN NAKUR MOHALLA AFGHAN 247243, DISTRICT SAHARANPUR, STATE UTTAR PRADHESH, INDIA</p>

                    <h2>3. Data We Collect</h2>
                    <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                    <ul>
                        <li>Identity Data: Username, display name, avatar.</li>
                        <li>Contact Data: Email address.</li>
                        <li>Technical Data: IP address, device information.</li>
                        <li>Usage Data: How you use our app.</li>
                    </ul>

                    <h2>4. How We Use Your Data</h2>
                    <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                    <ul>
                        <li>To register you as a new user.</li>
                        <li>To manage our relationship with you.</li>
                        <li>To improve our website, products/services, marketing or customer relationships.</li>
                    </ul>

                    <h2>5. Data Security</h2>
                    <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.</p>
                </div>
            </motion.div>
        </div>
    )
}

export default PrivacyPolicy
