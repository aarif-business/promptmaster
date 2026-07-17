import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Map, Sword, Crown, Lock, ChevronDown, Star,
  Compass, Sparkles, Trophy, ArrowRight, Shield,
  Zap, Target, BookOpen, CheckCircle2,
} from 'lucide-react'

const STAGES = [
  {
    difficulty: 'beginner',
    Icon: BookOpen,
    medal: '🥉',
    label: 'Beginner',
    terrain: 'The Misty Meadows',
    desc: 'Learn to see. Describe what is in front of you with clarity and intention.',
    challenges: 10,
    passAt: 60,
    accentFrom: '#d4e0e9',
    accentTo: '#e6e5e4',
    glowColor: 'rgba(120,160,190,0.3)',
    tag: 'Start Here',
    tagColor: 'bg-steel-faint text-steel border-steel-muted',
  },
  {
    difficulty: 'intermediate',
    Icon: Sword,
    medal: '🥈',
    label: 'Intermediate',
    terrain: 'The Iron Citadel',
    desc: 'Sharpen your craft. Capture mood, light, atmosphere, and fine detail.',
    challenges: 20,
    passAt: 70,
    accentFrom: '#c8d8e4',
    accentTo: '#d4e0e9',
    glowColor: 'rgba(81,107,132,0.3)',
    tag: 'Unlocks after Beginner',
    tagColor: 'bg-fog-muted text-slate/50 border-fog-border',
  },
  {
    difficulty: 'advanced',
    Icon: Crown,
    medal: '🥇',
    label: 'Advanced',
    terrain: 'The Summit of Mastery',
    desc: 'Master the art. Every nuance, every shadow, every breath of the scene.',
    challenges: 30,
    passAt: 80,
    accentFrom: '#b8cdd9',
    accentTo: '#c8d8e4',
    glowColor: 'rgba(58,79,98,0.4)',
    tag: 'Unlocks after Intermediate',
    tagColor: 'bg-fog-muted text-slate/50 border-fog-border',
  },
]

const FEATURES = [
  { Icon: Target,   title: 'Semantic AI Scoring',  desc: 'Gemini evaluates meaning, not keywords' },
  { Icon: Zap,      title: 'Non-Repetitive Images', desc: 'Fresh image every attempt from a curated pool' },
  { Icon: Shield,   title: 'Progressive Unlocks',   desc: 'Earn your way through each realm' },
  { Icon: Trophy,   title: 'Medal System',          desc: 'Bronze, Silver, Gold — collect them all' },
]

export default async function HomePage() {
  let passedByDiff: Record<string, boolean> = {}
  let isLoggedIn = false

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      isLoggedIn = true
      const [{ data: challenges }, { data: subs }] = await Promise.all([
        supabase.from('challenges').select('id, difficulty'),
        supabase.from('submissions').select('challenge_id, passed').eq('user_id', user.id).eq('passed', true),
      ])
      const passedIds = new Set((subs ?? []).map(s => s.challenge_id))
      for (const diff of ['beginner', 'intermediate', 'advanced']) {
        passedByDiff[diff] = (challenges ?? []).filter(c => c.difficulty === diff).some(c => passedIds.has(c.id))
      }
    }
  } catch { /* unauthenticated */ }

  const isUnlocked = (diff: string, idx: number) => {
    if (idx === 0) return true
    if (!isLoggedIn) return false
    return passedByDiff[STAGES[idx - 1].difficulty] ?? false
  }

  return (
    <div className="relative overflow-hidden">

      {/* ── Ambient background blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-steel/6 blur-[120px] animate-float-slow" />
        <div className="absolute top-[30%] right-[-8%] w-[400px] h-[400px] rounded-full bg-steel/5 blur-[100px] animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[-5%] left-[20%] w-[600px] h-[300px] rounded-full bg-steel/4 blur-[80px] animate-float-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-24 pb-20">

        {/* Floating ambient icons */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Compass className="absolute top-16 left-[7%] w-8 h-8 text-steel/20 animate-float" style={{ animationDelay: '0s' }} />
          <Sparkles className="absolute top-32 right-[9%] w-6 h-6 text-steel/20 animate-float" style={{ animationDelay: '0.8s' }} />
          <Star className="absolute bottom-24 left-[11%] w-5 h-5 text-steel/15 animate-float" style={{ animationDelay: '1.4s' }} />
          <Zap className="absolute bottom-16 right-[7%] w-7 h-7 text-steel/20 animate-float" style={{ animationDelay: '0.4s' }} />
          <Target className="absolute top-48 left-[20%] w-5 h-5 text-steel/10 animate-float-slow" style={{ animationDelay: '1s' }} />
          <Shield className="absolute top-20 right-[22%] w-5 h-5 text-steel/10 animate-float-slow" style={{ animationDelay: '1.8s' }} />
        </div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 bg-steel/10 border border-steel/25 px-5 py-2 rounded-full mb-8 animate-slide-up"
          style={{ animationDelay: '0s' }}
        >
          <Star className="w-3.5 h-3.5 text-steel animate-star-spin" />
          <span className="font-sans text-xs tracking-[0.3em] uppercase text-steel font-semibold">
            The Academy of Artificial Eloquence
          </span>
          <Star className="w-3.5 h-3.5 text-steel animate-star-spin" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Headline */}
        <h1
          className="font-serif text-6xl md:text-8xl text-steel leading-[1.05] max-w-4xl mb-6 animate-slide-up"
          style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}
        >
          Master the Art<br />
          <em className="text-steel-light">of the Prompt</em>
        </h1>

        {/* Divider */}
        <div
          className="flex items-center justify-center gap-4 mb-6 animate-slide-up"
          style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}
        >
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-fog-border" />
          <Star className="w-4 h-4 text-steel/40 animate-star-spin" />
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-fog-border" />
        </div>

        {/* Subtext */}
        <p
          className="font-sans text-base text-slate/65 max-w-md leading-relaxed mb-10 animate-slide-up"
          style={{ animationDelay: '0.25s', opacity: 0, animationFillMode: 'forwards' }}
        >
          An AI-powered adventure where you describe images, earn medals, and unlock new realms.
          Each stage is a new challenge. Each prompt is your weapon.
        </p>

        {/* CTA */}
        <div
          className="flex flex-wrap gap-4 justify-center animate-slide-up"
          style={{ animationDelay: '0.35s', opacity: 0, animationFillMode: 'forwards' }}
        >
          {isLoggedIn ? (
            <>
              <Link href="/challenges" className="btn-primary text-sm px-8 py-3 flex items-center gap-2.5 group">
                <Compass className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                Go to Quests
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link href="/dashboard" className="btn-ghost text-sm px-8 py-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className="btn-primary text-sm px-8 py-3 flex items-center gap-2.5 group">
                <Sword className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                Begin Your Quest
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link href="/login" className="btn-ghost text-sm px-8 py-3 flex items-center gap-2">
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Scroll hint */}
        <div className="mt-16 flex flex-col items-center gap-2 opacity-40 animate-fade-in" style={{ animationDelay: '1s' }}>
          <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-slate">explore</span>
          <ChevronDown className="w-4 h-4 text-steel animate-float" />
        </div>
      </section>

      {/* ── Feature pills ── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <div
              key={title}
              className="group border border-fog-border bg-fog-muted/60 p-4 hover:border-steel/40 hover:bg-steel/5 hover:-translate-y-1 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${0.4 + i * 0.08}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <Icon className="w-5 h-5 text-steel/60 mb-2.5 group-hover:text-steel transition-colors duration-200" />
              <p className="font-sans text-xs font-semibold text-steel tracking-wide mb-1">{title}</p>
              <p className="font-sans text-[11px] text-slate/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Level Map ── */}
      <section className="max-w-2xl mx-auto px-6 pb-28">

        {/* Section header */}
        <div
          className="text-center mb-12 animate-slide-up"
          style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}
        >
          <div className="inline-flex items-center gap-2 bg-steel/10 border border-steel/20 px-4 py-1.5 rounded-full mb-4">
            <Map className="w-3.5 h-3.5 text-steel" />
            <span className="font-sans text-xs tracking-[0.3em] uppercase text-steel font-semibold">World Map</span>
          </div>
          <h2 className="font-serif text-4xl text-steel mb-3">Choose Your Realm</h2>
          <p className="font-sans text-sm text-slate/55 max-w-sm mx-auto">
            {isLoggedIn
              ? 'Your journey so far — complete each realm to unlock the next.'
              : 'Beginner is open to all. Earn your way through each realm.'}
          </p>
        </div>

        {/* Map path */}
        <div className="relative flex flex-col">
          {STAGES.map((stage, idx) => {
            const unlocked = isUnlocked(stage.difficulty, idx)
            const passed   = passedByDiff[stage.difficulty] ?? false
            const { Icon } = stage

            return (
              <div key={stage.difficulty}>

                {/* ── Connector ── */}
                {idx > 0 && (
                  <div className="flex justify-center relative z-10 my-1">
                    <div className="flex flex-col items-center gap-0.5 py-2">
                      {[0, 1, 2, 3].map(i => (
                        <div
                          key={i}
                          className={`w-px h-4 rounded-full transition-all duration-700 ${
                            unlocked ? 'bg-steel/50' : 'bg-fog-border'
                          }`}
                          style={{ transitionDelay: `${i * 80}ms` }}
                        />
                      ))}
                      <div className={`mt-1 transition-all duration-500 ${unlocked ? 'opacity-100 scale-100' : 'opacity-25 scale-75'}`}>
                        {unlocked
                          ? <ChevronDown className="w-4 h-4 text-steel animate-float" />
                          : <Lock className="w-3.5 h-3.5 text-slate/30" />
                        }
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Stage card ── */}
                <div
                  className={`relative overflow-hidden border-2 transition-all duration-500 animate-slide-up ${
                    passed
                      ? 'border-steel shadow-lg shadow-steel/10'
                      : unlocked
                      ? 'border-fog-border hover:border-steel/50 hover:shadow-md hover:shadow-steel/8'
                      : 'border-fog-border opacity-55'
                  }`}
                  style={{
                    animationDelay: `${0.55 + idx * 0.15}s`,
                    opacity: 0,
                    animationFillMode: 'forwards',
                    background: unlocked
                      ? `linear-gradient(135deg, ${stage.accentFrom}55 0%, ${stage.accentTo}33 100%)`
                      : undefined,
                  }}
                >
                  {/* Shimmer overlay on passed */}
                  {passed && (
                    <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                  )}

                  {/* Glow dot top-right on unlocked */}
                  {unlocked && !passed && (
                    <div className="absolute top-4 right-4">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-steel/40" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-steel/60" />
                      </span>
                    </div>
                  )}

                  {/* Card header */}
                  <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">

                      {/* Icon circle */}
                      <div
                        className={`relative shrink-0 w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                          passed
                            ? 'border-steel bg-steel/15 shadow-md shadow-steel/20'
                            : unlocked
                            ? 'border-steel/40 bg-steel/8'
                            : 'border-fog-border bg-fog-muted'
                        }`}
                        style={passed ? { boxShadow: `0 0 20px ${stage.glowColor}` } : undefined}
                      >
                        {unlocked
                          ? <Icon className={`w-6 h-6 transition-colors duration-300 ${passed ? 'text-steel-dark' : 'text-steel'}`} />
                          : <Lock className="w-5 h-5 text-slate/30" />
                        }
                        {passed && (
                          <CheckCircle2 className="absolute -bottom-1 -right-1 w-5 h-5 text-steel bg-fog-muted rounded-full" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-slate/45">
                            Stage {idx + 1} · {stage.terrain}
                          </p>
                          <span className={`font-sans text-[10px] px-2 py-0.5 border rounded-full tracking-wide ${stage.tagColor}`}>
                            {passed ? '✓ Completed' : unlocked ? stage.tag : stage.tag}
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl text-steel leading-tight">{stage.label}</h3>
                        <p className="font-sans text-xs text-slate/55 mt-1.5 leading-relaxed max-w-xs">{stage.desc}</p>
                      </div>
                    </div>

                    {/* Medal */}
                    {passed && (
                      <span className="text-3xl shrink-0 animate-bounce-in">{stage.medal}</span>
                    )}
                    {!unlocked && (
                      <Lock className="w-5 h-5 text-slate/25 shrink-0 mt-1" />
                    )}
                  </div>

                  {/* Stats + CTA row */}
                  <div className={`px-6 py-4 border-t border-fog-border flex items-center justify-between gap-4 ${!unlocked ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-steel/50" />
                        <div>
                          <p className="font-sans text-[10px] text-slate/40 leading-none mb-0.5">Challenges</p>
                          <p className="font-serif text-base font-bold text-steel leading-none">{stage.challenges}</p>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-fog-border" />
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-steel/50" />
                        <div>
                          <p className="font-sans text-[10px] text-slate/40 leading-none mb-0.5">Pass at</p>
                          <p className="font-serif text-base font-bold text-steel leading-none">{stage.passAt}%</p>
                        </div>
                      </div>
                    </div>

                    {unlocked ? (
                      isLoggedIn ? (
                        <Link
                          href="/challenges"
                          className={`group flex items-center gap-2 font-sans text-xs font-semibold px-4 py-2.5 border transition-all duration-200 hover:-translate-y-0.5 ${
                            passed
                              ? 'border-steel-muted bg-steel-faint text-steel-dark hover:bg-steel/20 hover:shadow-sm'
                              : 'border-steel/30 bg-steel/5 text-steel hover:bg-steel/12 hover:border-steel/50'
                          }`}
                        >
                          {passed ? 'Replay' : 'Start'}
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </Link>
                      ) : (
                        <Link
                          href="/signup"
                          className="group flex items-center gap-2 font-sans text-xs font-semibold px-4 py-2.5 border border-steel/30 bg-steel/5 text-steel hover:bg-steel/12 hover:border-steel/50 transition-all duration-200 hover:-translate-y-0.5"
                        >
                          Sign up to play
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </Link>
                      )
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate/35">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="font-sans text-xs">
                          {isLoggedIn ? 'Complete previous stage' : 'Sign up to unlock'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* ── Grand Master crown ── */}
          <div className={`flex justify-center mt-4 transition-all duration-700 ${passedByDiff['advanced'] ? 'opacity-100' : 'opacity-20'}`}>
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-col items-center gap-0.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`w-px h-4 rounded-full ${passedByDiff['advanced'] ? 'bg-steel/50' : 'bg-fog-border'}`} />
                ))}
              </div>
              <div className="relative">
                {passedByDiff['advanced'] && (
                  <div className="absolute inset-0 rounded-full animate-pulse-glow-gold" />
                )}
                <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${passedByDiff['advanced'] ? 'border-yellow-400/60 bg-yellow-50' : 'border-fog-border bg-fog-muted'}`}>
                  <Crown className={`w-7 h-7 ${passedByDiff['advanced'] ? 'text-yellow-500 animate-crown-glow' : 'text-slate/20'}`} />
                </div>
              </div>
              <p className="font-serif text-sm text-steel/70">Grand Master</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
