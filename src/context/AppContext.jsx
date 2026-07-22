import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    // Failsafe timeout: force loading to false after 3 seconds if it gets stuck
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 3000)

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        if (isMounted) setLoading(false)
      }
    }).catch(err => {
      console.error('Session error:', err)
      if (isMounted) setLoading(false)
    })

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setUser(null)
        if (isMounted) setLoading(false)
      }
    })

    return () => {
      isMounted = false
      clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      const localGenderPref = localStorage.getItem('wayfare_gender_pref')

      if (data) {
        setUser({ 
          ...data, 
          email: authUser.email, 
          role: data.role || null,
          gender_pref: data.gender_pref || localGenderPref || null
        })
      } else {
        // New user without a profile record yet
        const meta = authUser.user_metadata || {}
        
        // Upsert immediately using metadata provided during signup
        if (meta.name) {
           const { error: upsertErr } = await supabase.from('users').upsert({
              id: authUser.id,
              email: authUser.email,
              name: meta.name,
              age: meta.age,
              city: meta.city,
              gender: meta.gender,
              avatar: meta.name[0]?.toUpperCase() || 'U'
           })
           if (upsertErr) console.warn("Failed to upsert user profile:", upsertErr)
        }
        
        setUser({ 
          id: authUser.id, 
          email: authUser.email,
          name: meta.name,
          gender: meta.gender,
          age: meta.age,
          city: meta.city,
          avatar: meta.name ? meta.name[0]?.toUpperCase() : 'U',
          role: null,
          gender_pref: localGenderPref || null
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      // Fallback
      setUser({ id: authUser.id, email: authUser.email, avatar: 'U', role: null })
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AppContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
