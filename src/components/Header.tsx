'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Medals { bronze: boolean; silver: boolean; gold: boolean }

export default function Header() {
  const [user, setUser]     = useState<User | null>(null)
  const [role, setRole]     = useState<string | null>(null)
  const [medals, setMedals] = useState<Medals>({ bronze: false, silver: false, gold: false })
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      setUser(data.user)

      const [{ data: profile }, { data: challenges }, { data: subs }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', data.user.id).single(),
        supabase.from('challenges').select('id, difficulty'),
        supabase.from('submissions').select('challenge_id, passed').eq('user_id', data.user.id).eq('passed', true),
      ])

      setRole(profile?.role ?? null)

      const passedIds = new Set((subs ?? []).map(s => s.challenge_id))
      const byDiff = (diff: string) =>
        (challenges ?? []).filter(c => c.difficulty === diff).some(c => passedIds.has(c.id))

      setMedals({
        bronze: byDiff('beginner'),
        silver: byDiff('intermediate'),
        gold:   byDiff('advanced'),
      })
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setRole(null); setMedals({ bronze: false, silver: false, gold: false }) }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAuth = pathname === '/login' || pathname === '/signup'

  return (
    <header className="border-b border-fog-border bg-fog-muted/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="h-0.5 bg-gradient-to-r from-steel-light via-steel to-steel-dark w-full" />
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href={user ? (role === 'admin' ? '/admin' : '/dashboard') : '/'} className="group flex flex-col leading-none shrink-0">
          <span className="font-serif text-xl text-steel tracking-tight group-hover:text-steel-dark transition-colors">
            PromptMaster
          </span>
          <span className="font-sans text-[9px] tracking-[0.35em] uppercase text-slate/40">Class</span>
        </Link>

        {/* Medals — center */}
        {user && !isAuth && (
          <div className="flex items-center gap-1 bg-fog border border-fog-border px-3 py-1.5 rounded-full">
            <MedalBadge earned={medals.bronze} icon="🥉" label="Beginner"     />
            <div className="w-px h-4 bg-fog-border mx-1" />
            <MedalBadge earned={medals.silver} icon="🥈" label="Intermediate" />
            <div className="w-px h-4 bg-fog-border mx-1" />
            <MedalBadge earned={medals.gold}   icon="🥇" label="Advanced"     />
          </div>
        )}

        {/* Nav */}
        <nav className="flex items-center gap-5 shrink-0">
          {user && !isAuth ? (
            <>
              {role === 'admin' ? (
                <>
                  <NavLink href="/admin" current={pathname}>Scholars</NavLink>
                  <button onClick={handleSignOut} className="font-sans text-sm text-slate/50 hover:text-steel transition-colors">Sign Out</button>
                </>
              ) : (
                <>
                  <NavLink href="/dashboard"  current={pathname}>Dashboard</NavLink>
                  <NavLink href="/challenges" current={pathname}>Quests</NavLink>
                  <button onClick={handleSignOut} className="font-sans text-sm text-slate/50 hover:text-steel transition-colors">Sign Out</button>
                </>
              )}
          ) : (
            <>
              <Link href="/login" className="font-sans text-sm text-slate/70 hover:text-steel transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                <span>⚔️</span> Begin Quest
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

function MedalBadge({ earned, icon, label }: { earned: boolean; icon: string; label: string }) {
  return (
    <div className="relative group flex items-center">
      <span
        className={`text-lg transition-all duration-300 ${
          earned ? 'opacity-100 animate-float drop-shadow-sm' : 'opacity-20 grayscale'
        }`}
        title={earned ? `${label} medal earned!` : `Complete ${label} to earn`}
      >
        {icon}
      </span>
      {/* Tooltip */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-dark text-fog text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {earned ? `${label} ✓` : `Locked`}
      </div>
    </div>
  )
}

function NavLink({ href, current, children }: { href: string; current: string; children: React.ReactNode }) {
  const active = current.startsWith(href)
  return (
    <Link
      href={href}
      className={`font-sans text-sm tracking-wide transition-all duration-200 ${
        active
          ? 'text-steel font-semibold border-b-2 border-steel pb-0.5'
          : 'text-slate/70 hover:text-steel'
      }`}
    >
      {children}
    </Link>
  )
}
