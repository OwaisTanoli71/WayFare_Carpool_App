import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import InputField from '../components/InputField'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMsg('Please enter your new password below.')
      }
    })
  }, [])

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    // Security Fix [LpDos]: Restrict password length to 128 characters
    if (password.length > 128) {
      setError('Password cannot exceed 128 characters')
      return
    }
    
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      setError(error.message)
    } else {
      setMsg('Password updated successfully. Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-6 py-12">
      <div className="w-full max-w-sm rounded-[2rem] border border-ink-700/50 bg-[#121620] p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-black text-white">Reset Password</h1>
          <p className="mt-2 text-xs text-ink-300">Enter your new password below.</p>
        </div>
        
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <InputField
            label="New Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 chars"
          />
          <InputField
            label="Confirm Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
          
          {error && <div className="rounded-lg bg-danger/10 p-3 text-xs text-danger">{error}</div>}
          {msg && <div className="rounded-lg bg-verified/10 p-3 text-xs text-verified">{msg}</div>}
          
          <Button variant="primary" type="submit" disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
