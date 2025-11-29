import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://opsynqvpowyznswrnmen.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3lucXZwb3d5em5zd3JubWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzE0MzIsImV4cCI6MjA3OTg0NzQzMn0.zaoIIDn7w1xzzMT0Ucw4r8oBWs6sUo173d9K600wIA0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
