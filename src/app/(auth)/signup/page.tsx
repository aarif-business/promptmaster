'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-sans text-xs tracking-[0.4em] uppercase text-steel/60 mb-2">Join the Academy</p>
          <h1 className="font-serif text-4xl text-steel">Create Account</h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-16 bg-fog-border" />
            <span className="text-steel/40 text-sm">✦</span>
            <div className="h-px w-16 bg-fog-border" />
          </div>
        </div>

        <form onSubmit={handleSignup} className="card-classic space-y-5">
          <div>
            <label className="block font-sans text-xs tracking-widest uppercase text-slate/60 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="input-classic"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="block font-sans text-xs tracking-widest uppercase text-slate/60 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-classic"
              placeholder="scholar@example.com"
              required
            />
          </div>
          <div>
            <label className="block font-sans text-xs tracking-widest uppercase text-slate/60 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-classic"
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-xs font-sans text-steel-dark bg-steel/10 border border-steel/20 px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full text-center">
            {loading ? 'Creating account…' : 'Begin My Training'}
          </button>
        </form>

        <p className="text-center mt-6 font-sans text-sm text-slate/60">
          Already enrolled?{' '}
          <Link href="/login" className="text-steel hover:text-steel-dark underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
