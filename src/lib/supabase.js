import { createClient } from '@supabase/supabase-js'

// Fallback to active Supabase project credentials for production deployments (Netlify/Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tsicnvkeaohslywliima.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaWNudmtlYW9oc2x5d2xpaW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjE0ODIsImV4cCI6MjA5OTQ5NzQ4Mn0.ANtuEnQXqzS7uXKXxm1-27gRvwisv6Rl9FkB6sOZyJA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
