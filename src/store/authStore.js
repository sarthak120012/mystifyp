import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            profile: null,
            session: null,
            loading: true,

            setUser: (user) => set({ user }),
            setProfile: (profile) => set({ profile }),
            setSession: (session) => set({ session }),
            setLoading: (loading) => set({ loading }),

            signOut: async () => {
                await supabase.auth.signOut()
                set({ user: null, profile: null, session: null })
            },

            refreshProfile: async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    set({ profile })
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                session: state.session
            })
        }
    )
)
