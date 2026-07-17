'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen, Sword, Crown, Lock, Star, Trophy,
  Zap, Target, TrendingUp, Clock, CheckCircle2,
  ArrowRight, Flame, Award, BarChart3, RefreshCw,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Challenge {
  id: string
  title: string
  description: string
  difficulty: string
  min_accuracy_to_pass: number
}
interface BestMap { [id: string]: { accuracy_score: number; passed: boolean } }
interface Submission {
  id: string
  challenge_id: string
  accuracy_score: number
  passed: boolean
  submitted_at: string
  user_prompt: string
}
interface Props {
  profile: { full_name: string | null; created_at: string } | null
  email: string
  challenges: Challenge[]
  bestByChallenge: BestMap
  submissions: Submission[]
  passedCount: number
  avgScore: number
  totalAttempts: number
  passedByDiff: Record<string, boolean>
}

/* ── XP per difficulty ─────────────────────────────────────────────────────── */
const XP: Record<string, number> = { beginner: 100, intermediate: 200, advanced: 350 }

/* ── Tab config ────────────────────────────────────────────────────────────── */
const TABS = [
  {
    key: 'beginner',
    label: 'Beginner',
    Icon: BookOpen,
    color: 'from-sky-400 to-blue-500',
    glow: 'rgba(56,189,248,0.3)',
    accent: '#38bdf8',
    passAt: 60,
    terrain: 'The Misty Meadows',
  },
  {
    key: 'intermediate',
    label: 'Intermediate',
    Icon: Sword,
    color: 'from-violet-400 to-purple-600',
    glow: 'rgba(139,92,246,0.3)',
    accent: '#8b5cf6',
    passAt: 70,
    terrain: 'The Iron Citadel',
  },
  {
    key: 'advanced',
    label: 'Advanced',
    Icon: Crown,
    color: 'from-amber-400 to-orange-500',
    glow: 'rgba(251,191,36,0.3)',
    accent: '#f59e0b',
    passAt: 80,
    terrain: 'The Summit of Mastery',
  },
]

/* ── Progress ring ─────────────────────────────────────────────────────────── */
function ProgressRing({ pct, totalXP, level }: { pct: number; totalXP: number; level: string }) {
  const [animated, setAnimated] = useState(false)
  const R = 72
  const circ = 2 * Math.PI * R
  const offset = circ - (pct / 100) * circ

  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t) }, [])

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full animate-pulse-glow-indigo"
        style={{ background: 'transparent' }}
      />
      <svg width={180} height={180} className="-rotate-90">
        {/* Track */}
        <circle cx={90} cy={90} r={R} fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth={10} />
        {/* Fill */}
        <circle
          cx={90} cy={90} r={R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={animated ? offset : circ}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-sans text-3xl font-bold text-indigo-600 leading-none">{pct}%</span>
        <span className="font-sans text-[10px] text-slate/50 tracking-widest uppercase mt-1">Overall</span>
        <span className="font-sans text-xs font-semibold text-slate/70 mt-0.5">{level}</span>
        <span className="font-sans text-[10px] text-indigo-500 font-bold mt-1">{totalXP} XP</span>
      </div>
    </div>
  )
}

/* ── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, value, label, sub, color }: {
  icon: React.ElementType; value: string | number; label: string; sub?: string; color: string
}) {
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-4 animate-slide-up">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${color} shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-sans text-xl font-bold text-slate-dark leading-none">{value}</p>
        <p className="font-sans text-xs text-slate/55 mt-0.5">{label}</p>
        {sub && <p className="font-sans text-[10px] text-indigo-500 font-semibold mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Quest card ────────────────────────────────────────────────────────────── */
function QuestCard({
  challenge, best, unlocked, tabAccent, tabColor, idx,
}: {
  challenge: Challenge
  best: { accuracy_score: number; passed: boolean } | undefined
  unlocked: boolean
  tabAccent: string
  tabColor: string
  idx: number
}) {
  const passed   = best?.passed ?? false
  const attempted = !!best && !passed
  const xp = XP[challenge.difficulty] ?? 100
  const label = `Challenge ${idx + 1}`

  if (!unlocked) {
    return (
      <div className="quest-card rounded-2xl p-5 opacity-50 cursor-not-allowed select-none">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-slate/30" />
          </div>
          <span className="font-sans text-[10px] text-slate/30 tracking-widest uppercase">Locked</span>
        </div>
        <p className="font-serif text-sm text-slate/40 leading-snug mb-2">{label}</p>
        <p className="font-sans text-[10px] text-slate/30">Pass the previous challenge to unlock</p>
      </div>
    )
  }

  return (
    <Link href={`/challenges/${challenge.id}`}>
      <div
        className={`quest-card rounded-2xl p-5 flex flex-col gap-3 h-full animate-slide-up ${passed ? 'quest-card-passed' : ''}`}
        style={{ animationDelay: `${idx * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${tabColor} shadow-sm`}>
            {passed
              ? <CheckCircle2 className="w-4 h-4 text-white" />
              : attempted
              ? <RefreshCw className="w-4 h-4 text-white" />
              : <Target className="w-4 h-4 text-white" />
            }
          </div>
          <span className="xp-badge">+{xp} XP</span>
        </div>

        {/* Title */}
        <div className="flex-1">
          <p className="font-serif text-sm font-semibold text-slate-dark leading-snug mb-1.5">
            {label}
          </p>
          <p className="font-sans text-[11px] text-slate/50 leading-relaxed line-clamp-2">
            {challenge.description}
          </p>
        </div>

        {/* Score bar if attempted */}
        {best && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-sans text-[10px] text-slate/40">Best score</span>
              <span className="font-sans text-[10px] font-bold" style={{ color: tabAccent }}>
                {best.accuracy_score}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate/10 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{
                  width: `${best.accuracy_score}%`,
                  background: `linear-gradient(90deg, ${tabAccent}99, ${tabAccent})`,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/60">
          <span className="font-sans text-[10px] text-slate/40">Pass at {challenge.min_accuracy_to_pass}%</span>
          <div
            className="flex items-center gap-1 font-sans text-xs font-semibold group-hover:gap-1.5 transition-all"
            style={{ color: tabAccent }}
          >
            {passed ? 'Replay' : attempted ? 'Retry' : 'Start'}
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── Main component ────────────────────────────────────────────────────────── */
export default function DashboardClient({
  profile, email, challenges, bestByChallenge,
  submissions, passedCount, avgScore, totalAttempts, passedByDiff,
}: Props) {
  const [activeTab, setActiveTab] = useState('beginner')

  const totalChallenges = challenges.length
  const overallPct = totalChallenges > 0 ? Math.round((passedCount / totalChallenges) * 100) : 0
  const totalXP = challenges.reduce((acc, c) => {
    if (bestByChallenge[c.id]?.passed) acc += XP[c.difficulty] ?? 100
    return acc
  }, 0)

  const levelLabel =
    passedCount >= 5 ? 'Advanced' :
    passedCount >= 2 ? 'Intermediate' : 'Beginner'

  const isUnlocked = (diff: string) => {
    const order = ['beginner', 'intermediate', 'advanced']
    const idx = order.indexOf(diff)
    if (idx === 0) return true
    return passedByDiff[order[idx - 1]] ?? false
  }

  // Within a difficulty, challenge at index i is locked until challenge i-1 is passed
  const isChallengeUnlocked = (diff: string, challengeIdx: number) => {
    if (!isUnlocked(diff)) return false
    if (challengeIdx === 0) return true
    const diffChallenges = challenges.filter(c => c.difficulty === diff)
    const prev = diffChallenges[challengeIdx - 1]
    return bestByChallenge[prev?.id]?.passed ?? false
  }

  const activeTabCfg = TABS.find(t => t.key === activeTab)!
  const tabChallenges = challenges.filter(c => c.difficulty === activeTab)

  const streak = Math.min(submissions.filter(s => s.passed).length, 7)

  return (
    <div className="dashboard-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Top hero row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile + ring card */}
          <div className="glass-card rounded-3xl p-6 flex flex-col items-center text-center gap-4 animate-slide-up lg:col-span-1">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="font-serif text-2xl text-white">
                  {(profile?.full_name || email)?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-sm">
                <Star className="w-3 h-3 text-white" />
              </div>
            </div>

            <div>
              <h2 className="font-serif text-xl text-slate-dark">{profile?.full_name || 'Scholar'}</h2>
              <p className="font-sans text-xs text-slate/50 mt-0.5">{email}</p>
            </div>

            {/* Progress ring */}
            <ProgressRing pct={overallPct} totalXP={totalXP} level={levelLabel} />

            {/* Streak */}
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200/60 rounded-full px-4 py-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-sans text-xs font-semibold text-orange-500">{streak} day streak</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4 content-start">
            <StatCard icon={Trophy}     value={passedCount}      label="Quests Passed"   sub={`+${passedCount * 150} XP earned`}  color="from-indigo-400 to-purple-500" />
            <StatCard icon={BarChart3}  value={`${avgScore}%`}   label="Average Score"   sub="Semantic accuracy"                  color="from-sky-400 to-blue-500"      />
            <StatCard icon={Zap}        value={totalAttempts}    label="Total Attempts"  sub="Keep going!"                        color="from-violet-400 to-purple-600" />
            <StatCard icon={TrendingUp} value={`${totalXP} XP`}  label="Total XP Earned" sub={`Level: ${levelLabel}`}             color="from-amber-400 to-orange-500"  />

            {/* Medal row */}
            <div className="col-span-2 glass-card rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <p className="font-sans text-xs tracking-widest uppercase text-slate/40 mb-3">Medal Collection</p>
              <div className="flex items-center gap-6">
                {[
                  { diff: 'beginner',     medal: '🥉', label: 'Bronze', color: 'text-amber-600' },
                  { diff: 'intermediate', medal: '🥈', label: 'Silver', color: 'text-slate-400' },
                  { diff: 'advanced',     medal: '🥇', label: 'Gold',   color: 'text-yellow-500' },
                ].map(({ diff, medal, label, color }) => (
                  <div key={diff} className="flex items-center gap-2">
                    <span className={`text-2xl transition-all duration-300 ${passedByDiff[diff] ? 'opacity-100 animate-float' : 'opacity-20 grayscale'}`}>
                      {medal}
                    </span>
                    <div>
                      <p className={`font-sans text-xs font-bold ${passedByDiff[diff] ? color : 'text-slate/30'}`}>{label}</p>
                      <p className="font-sans text-[10px] text-slate/40">{passedByDiff[diff] ? 'Earned' : 'Locked'}</p>
                    </div>
                  </div>
                ))}
                <div className="ml-auto">
                  <Award className={`w-6 h-6 ${passedByDiff['advanced'] ? 'text-yellow-400 animate-crown-glow' : 'text-slate/20'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quest tabs ── */}
        <div className="animate-slide-up" style={{ animationDelay: '0.25s', opacity: 0, animationFillMode: 'forwards' }}>

          {/* Tab bar */}
          <div className="glass-card rounded-2xl p-1.5 flex gap-1 mb-6">
            {TABS.map(tab => {
              const unlocked = isUnlocked(tab.key)
              const active = activeTab === tab.key
              const passed = passedByDiff[tab.key]
              const count = challenges.filter(c => c.difficulty === tab.key).length
              const passedCount_ = challenges.filter(c => c.difficulty === tab.key && bestByChallenge[c.id]?.passed).length

              return (
                <button
                  key={tab.key}
                  onClick={() => unlocked && setActiveTab(tab.key)}
                  disabled={!unlocked}
                  className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-sans text-sm font-semibold transition-all duration-300 ${
                    active
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                      : unlocked
                      ? 'text-slate/60 hover:text-slate-dark hover:bg-white/50'
                      : 'text-slate/30 cursor-not-allowed'
                  }`}
                >
                  {unlocked
                    ? <tab.Icon className="w-4 h-4 shrink-0" />
                    : <Lock className="w-4 h-4 shrink-0" />
                  }
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={`font-sans text-[10px] px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/25 text-white' : 'bg-slate/10 text-slate/50'
                  }`}>
                    {passedCount_}/{count}
                  </span>
                  {passed && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Tab header */}
          <div className="flex items-center justify-between mb-5 animate-tab-slide" key={activeTab}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${activeTabCfg.color}`} />
                <span className="font-sans text-[10px] tracking-widest uppercase text-slate/45">
                  {activeTabCfg.terrain}
                </span>
              </div>
              <h2 className="font-serif text-2xl text-slate-dark">{activeTabCfg.label} Quests</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs text-slate/50">Pass at</span>
              <span
                className="font-sans text-sm font-bold px-3 py-1 rounded-full"
                style={{ background: `${activeTabCfg.accent}18`, color: activeTabCfg.accent }}
              >
                {activeTabCfg.passAt}%
              </span>
            </div>
          </div>

          {/* Quest grid */}
          {isUnlocked(activeTab) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-tab-slide" key={`grid-${activeTab}`}>
              {tabChallenges.map((c, i) => (
                <QuestCard
                  key={c.id}
                  challenge={c}
                  best={bestByChallenge[c.id]}
                  unlocked={isChallengeUnlocked(activeTab, i)}
                  tabAccent={activeTabCfg.accent}
                  tabColor={activeTabCfg.color}
                  idx={i}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Lock className="w-10 h-10 text-slate/20 mx-auto mb-4" />
              <p className="font-serif text-lg text-slate/40 mb-2">Stage Locked</p>
              <p className="font-sans text-sm text-slate/35">
                Complete at least one {TABS[TABS.findIndex(t => t.key === activeTab) - 1]?.label} quest to unlock.
              </p>
              <button
                onClick={() => setActiveTab(TABS[TABS.findIndex(t => t.key === activeTab) - 1]?.key)}
                className="mt-5 inline-flex items-center gap-2 font-sans text-xs font-semibold px-4 py-2 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-200/60 hover:bg-indigo-100 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                Go to previous stage
              </button>
            </div>
          )}
        </div>

        {/* ── Recent activity ── */}
        {submissions.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.35s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-slate-dark flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Recent Activity
              </h2>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden">
              {submissions.slice(0, 8).map((s, i) => {
                const challenge = challenges.find(c => c.id === s.challenge_id)
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/40 ${i < submissions.slice(0, 8).length - 1 ? 'border-b border-white/50' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.passed ? 'bg-indigo-100' : 'bg-slate/8'}`}>
                      {s.passed
                        ? <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                        : <Target className="w-4 h-4 text-slate/40" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-slate-dark font-medium truncate">
                        {challenge ? `Challenge ${challenges.filter(c => c.difficulty === challenge.difficulty).findIndex(c => c.id === s.challenge_id) + 1} (${challenge.difficulty})` : 'Challenge'}
                      </p>
                      <p className="font-sans text-[11px] text-slate/45 truncate">{s.user_prompt}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-sans text-sm font-bold ${s.passed ? 'text-indigo-500' : s.accuracy_score >= 50 ? 'text-slate/60' : 'text-slate/40'}`}>
                        {s.accuracy_score}%
                      </p>
                      <p className="font-sans text-[10px] text-slate/35">
                        {new Date(s.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {submissions.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center animate-slide-up" style={{ animationDelay: '0.35s', opacity: 0, animationFillMode: 'forwards' }}>
            <Target className="w-10 h-10 text-indigo-300 mx-auto mb-4 animate-float" />
            <p className="font-serif text-lg text-slate/50 mb-2">No quests attempted yet</p>
            <p className="font-sans text-sm text-slate/35 mb-5">Start your first quest to begin earning XP and medals.</p>
            <Link href="/challenges" className="inline-flex items-center gap-2 btn-primary text-xs px-5 py-2.5">
              <Zap className="w-3.5 h-3.5" /> Start First Quest
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
