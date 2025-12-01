import React from 'react'
import { motion } from 'framer-motion'
import { FileText, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const TermsConditions = () => {
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
                    <FileText size={48} className="text-accent" />
                    <h1>Terms & Conditions</h1>
                </div>

                <div className="legal-section">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <h2>1. Agreement to Terms</h2>
                    <p>By accessing our app, you agree to be bound by these Terms and Conditions and agree that you are responsible for the agreement with any applicable local laws.</p>

                    <h2>2. User Representations</h2>
                    <p>By using the Application, you represent and warrant that:</p>
                    <ul>
                        <li>All registration information you submit will be true, accurate, current, and complete.</li>
                        <li>You have the legal capacity and you agree to comply with these Terms of Use.</li>
                        <li>You will not use the Application for any illegal or unauthorized purpose.</li>
                    </ul>

                    <h2>3. Prohibited Activities</h2>
                    <p>You may not access or use the Application for any purpose other than that for which we make the Application available. The Application may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>

                    <h2>4. Contact Us</h2>
                    <p>In order to resolve a complaint regarding the Application or to receive further information regarding use of the Application, please contact us at:</p>
                    <p><strong>SARTHAK CHOUDHARY</strong></p>
                    <p>Address: TOWN NAKUR MOHALLA AFGHAN 247243, DISTRICT SAHARANPUR, STATE UTTAR PRADHESH, INDIA</p>
                    <p>Email: choudharysarthak799@gmail.com</p>
                </div>
            </motion.div>
        </div>
    )
}

export default TermsConditions
