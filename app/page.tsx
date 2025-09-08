import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">
          Anonymous feedback, filtered and encrypted
        </h1>
        
        <div className="mt-8 space-y-4 text-lg text-gray-600">
          <div className="flex items-start gap-3">
            <span className="text-green-500 mt-1">✓</span>
            <p className="text-left">
              Receive anonymous feedback without the fear of hurtful comments
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-500 mt-1">✓</span>
            <p className="text-left">
              AI filters mean comments before they reach you
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-500 mt-1">✓</span>
            <p className="text-left">
              End-to-end encryption ensures even we can't read your feedback
            </p>
          </div>
        </div>

        <div className="mt-12">
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue
          </Link>
        </div>

        <div className="mt-8">
          <Link
            href="/how-it-works"
            className="text-blue-600 hover:underline"
          >
            Learn how it works →
          </Link>
        </div>
      </div>
    </main>
  )
}
