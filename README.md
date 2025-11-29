# Mystify - Real-time Social Gaming Platform

A comprehensive mobile-first social platform with chat, posts, multiplayer games, and secure private vault, built with React, Vite, and Supabase.

## 🚀 Features

### ✅ Phase I - COMPLETED
- **Authentication System**
  - Email/Password sign up and sign in
  - Multi-step onboarding (username, bio, avatar)
  - 12 auto-generated 3D avatars (using DiceBear API)
  - Protected routes

- **Theme System**
  - 4 Beautiful Themes:
    - 🌊 **Bubble Dream** - Floating bubbles with neon gradients
    - 🐱 **CatPlay Cute** - Pastel pink with cat mascots
    - 🌌 **Ultra Vision** - Sci-fi cyberpunk with hologram effects
    - ✨ **Default Modern** - Clean glass morphism
  - Instant theme switching
  - Persistent theme preference

- **UI/UX**
  - Mobile-first responsive design
  - Fixed bottom navigation (Home, Search, Chat, Games, Profile)
  - Liquid glass buttons with neon glow
  - Smooth page transitions
  - 8px spacing system
  - Touch-friendly (48px minimum)

- **Database Schema**
  - Complete Supabase schema with all tables
  - Row Level Security (RLS) policies
  - Storage buckets for posts, avatars, private vault
  - Optimized indexes and triggers

### 🚧 Phase 2 - IN PROGRESS
- Home feed with posts
- Search & user profiles
- Real-time chat system
- Social features (follow, like, comment)
- Multiplayer games
- Leaderboard system
- Private vault with encryption
- Admin panel

## 📁 Project Structure

```
mystifyapp/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── LiquidGlassButton.jsx
│   │   └── BottomNav.jsx
│   ├── pages/            # Page components
│   │   ├── Auth/         # Authentication pages
│   │   ├── Home/         # Home feed
│   │   ├── Search/       # User search
│   │   ├── Chat/         # Messaging
│   │   ├── Games/        # Multiplayer games
│   │   └── Profile/      # User profiles
│   ├── store/            # State management (Zustand)
│   │   ├── authStore.js
│   │   └── themeStore.js
│   ├── lib/              # Utilities
│   │   └── supabase.js   # Supabase client
│   └── styles/           # Global styles & themes
│       └── index.css
├── supabase/             # Database files
│   ├── schema.sql        # Database schema
│   ├── rls-policies.sql  # Security policies
│   ├── storage-buckets.sql # Storage config
│   └── README.md         # Setup instructions
└── package.json
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ installed
- Supabase account with project created

### 1. Clone & Install Dependencies
```bash
cd mystifyapp
npm install
```

### 2. Configure Supabase Database

**IMPORTANT:** You must set up the database before the app will work.

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rtuwmosbodkgibickflf

2. Navigate to **SQL Editor**

3. Run each SQL file in this order:
   - Copy contents of `supabase/schema.sql` → Paste → Run
   - Copy contents of `supabase/rls-policies.sql` → Paste → Run
   - Copy contents of `supabase/storage-buckets.sql` → Paste → Run

4. Verify setup:
   - Check **Table Editor** - you should see all tables (profiles, posts, messages, etc.)
   - Check **Storage** - you should see 3 buckets (posts, avatars, private_vault)

### 3. Run Development Server
```bash
npm run dev
```

Visit http://localhost:5173

## 🎨 Theme System

Switch between 4 themes anytime:

1. **Bubble Dream** 🌊
   - Neon blue/purple gradients
   - Floating bubble animations
   - Perfect for dreamy vibes

2. **CatPlay Cute** 🐱
   - Soft pastel pink colors
   - Cat icons and paw effects
   - Playful and adorable

3. **Ultra Vision** 🌌
   - Deep space background
   - Neon cyberpunk aesthetics
   - Sci-fi hologram UI

4. **Default Modern** ✨
   - Clean white/blue palette
   - Premium glass morphism
   - Professional look

Theme preference is automatically saved to your profile!

## 🔐 Authentication

### Sign Up
1. Email + Password (min 6 characters)
2. Create username & bio
3. Choose from 12 generated 3D avatars
4. Click "Generate New" for different avatar styles

### Sign In
- Email + Password authentication
- Session persists automatically

## 📱 Mobile-First Design

The app is optimized for mobile devices:
- Touch-friendly buttons (minimum 48px)
- Fixed bottom navigation (always visible)
- Smooth swipe gestures
- Responsive grid layouts
- Optimized for 360px - 768px screens

## 🎮 Upcoming Features

### Phase 2
- **Posts System**
  - Upload images with captions
  - Like/unlike posts
  - Comment with @mentions
  - Real-time feed updates

- **Chat System**
  - One-to-one messaging
  - Typing indicators with emoji
  - Message reactions (❤️😂😢🔥👍)
  - Read receipts
  - Online status

- **Games** (Multiplayer with real-time sync)
  - Tic-Tac-Toe
  - Tap Race
  - Memory Flip
  - Bingo 5x5
  - Number Battle

- **Leaderboard**
  - Daily points system
  - Top 50 rankings
  - Trophy badges for top 3
  - Auto-reset at midnight UTC

- **Private Vault**
  - PIN-protected
  - AES encryption
  - Store photos, voice notes, text
  - Strict access control

- **Admin Panel** (Web only)
  - User management
  - Content moderation
  - Reports handling
  - Leaderboard reset

## 🔧 Tech Stack

- **Frontend:** React 18 + Vite
- **Routing:** React Router v6
- **State Management:** Zustand
- **Animations:** Framer Motion
- **UI Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Realtime (WebSockets)
- **Storage:** Supabase Storage
- **Authentication:** Supabase Auth
- **Encryption:** CryptoJS (for vault)

## 🌐 Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder, ready for deployment to:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting service

## 🐛 Troubleshooting

### "Cannot read properties of null" errors
- Make sure you've run all 3 SQL files in Supabase
- Check that RLS is enabled on tables
- Verify storage buckets exist

### "Invalid email or password"
- Ensure you're using a valid email format
- Password must be at least 6 characters

### Themes not switching
- Clear browser localStorage
- Refresh the page
- Check browser console for errors

### Avatar images not loading
- Check internet connection (avatars use DiceBear API)
- Try clicking "Generate New" button

## 📄 License

This project is for educational purposes. 

## 👨‍💻 Developer

Built for the Mystify platform - A next-generation social gaming experience.

---

**Current Status:** ✅ Phase 1 Complete (Auth + Themes + Database)
**Next Up:** 🚧 Phase 2 (Posts + Chat + Games)
