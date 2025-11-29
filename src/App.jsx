import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import { supabase } from './lib/supabase'
import { BottomNav } from './components/BottomNav'
import { SplashScreen } from './components/SplashScreen'

// Auth Pages
import SignIn from './pages/Auth/SignIn'
import SignUp from './pages/Auth/SignUp'
import Onboarding from './pages/Auth/Onboarding'

// Main Pages
import Home from './pages/Home/Home'
import Search from './pages/Search/Search'
import Chat from './pages/Chat/Chat'
import ChatRoom from './pages/Chat/ChatRoom'
import GroupChat from './pages/Chat/GroupChat'
import Profile from './pages/Profile/Profile'
import ViewProfile from './pages/Profile/ViewProfile'
import Settings from './pages/Settings/Settings'
import Leaderboard from './pages/Leaderboard/Leaderboard'
import Vault from './pages/Vault/Vault'
import Notifications from './pages/Notifications/Notifications'
import EditProfile from './pages/Profile/EditProfile'

import './styles/index.css'

function App() {
  const { user, setUser, setSession, setProfile } = useAuthStore()
  const { initializeTheme } = useThemeStore()
  const [showSplash, setShowSplash] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize theme
    initializeTheme()

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Fetch user profile
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={!user ? <SignIn /> : <Navigate to="/home" />} />
          <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/home" />} />
          <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/signin" />} />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={user ? <Home /> : <Navigate to="/signin" />}
          />
          <Route
            path="/search"
            element={user ? <Search /> : <Navigate to="/signin" />}
          />
          <Route
            path="/chat"
            element={user ? <Chat /> : <Navigate to="/signin" />}
          />
          <Route
            path="/chat/group/:groupId"
            element={user ? <GroupChat /> : <Navigate to="/signin" />}
          />
          <Route
            path="/chat/:partnerId"
            element={user ? <ChatRoom /> : <Navigate to="/signin" />}
          />

          <Route
            path="/profile"
            element={user ? <Profile /> : <Navigate to="/signin" />}
          />
          <Route
            path="/profile/:id"
            element={user ? <ViewProfile /> : <Navigate to="/signin" />}
          />
          <Route
            path="/settings"
            element={user ? <Settings /> : <Navigate to="/signin" />}
          />
          <Route
            path="/leaderboard"
            element={user ? <Leaderboard /> : <Navigate to="/signin" />}
          />
          <Route
            path="/vault"
            element={user ? <Vault /> : <Navigate to="/signin" />}
          />
          <Route
            path="/notifications"
            element={user ? <Notifications /> : <Navigate to="/signin" />}
          />
          <Route
            path="/edit-profile"
            element={user ? <EditProfile /> : <Navigate to="/signin" />}
          />

          {/* Default Route */}
          <Route path="*" element={<Navigate to={user ? "/home" : "/signin"} />} />
        </Routes>

        {/* Bottom Navigation - Only show when authenticated and NOT in chat room */}
        {user && <ConditionalBottomNav />}

        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(12px)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-2)',
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}

// Helper component to conditionally render BottomNav
const ConditionalBottomNav = () => {
  const location = useLocation()
  // Hide bottom nav in chat room (e.g., /chat/some-id)
  const isChatRoom = location.pathname.startsWith('/chat/')

  if (isChatRoom) return null
  return <BottomNav />
}

export default App
