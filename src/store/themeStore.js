import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
    persist(
        (set) => ({
            currentTheme: 'bubble', // 'bubble' | 'cat' | 'ultra' | 'coffee'

            setTheme: (theme) => {
                set({ currentTheme: theme })
                // Apply theme to document
                document.documentElement.setAttribute('data-theme', theme)
            },

            initializeTheme: () => {
                const stored = localStorage.getItem('theme-storage')
                if (stored) {
                    const { state } = JSON.parse(stored)
                    document.documentElement.setAttribute('data-theme', state.currentTheme || 'bubble')
                } else {
                    document.documentElement.setAttribute('data-theme', 'bubble')
                }
            }
        }),
        {
            name: 'theme-storage'
        }
    )
)
