'use client'

import { useSupabase } from '@/components/SupabaseProvider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignIn() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      if (!email) throw new Error('Enter your email')

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback`,
        },
      })
      if (error) throw error
      setMessage('Magic link sent! Check your email to continue.')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Sign in with Email</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">{message}</div>
        )}

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="email"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          By continuing, you agree to our terms and privacy policy
        </p>
      </div>
    </div>
  )
}
