'use client'

import { useState, useEffect } from 'react'
import { evaluatePrompt, checkLevelComplete, getDailyUsage } from '@/app/actions'
import dynamic from 'next/dynamic'

const Certificate = dynamic(() => import('@/components/Certificate'), { ssr: false })

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner:     'text-steel-light bg-steel-faint border-steel-muted',
  intermediate: 'text-steel bg-steel-faint border-steel/40',
  advanced:     'text-steel-dark bg-steel/10 border-steel-dark/30',
}

const DIFFICULTY_ICONS: Record<string, string> = {
  beginner:     '📜',
  intermediate: '🔮',
  advanced:     '⚗️',
}

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: string
  image_topic: string
  min_accuracy_to_pass: number
}

interface Breakdown {
  subjects: number
  scene: number
  lighting: number
  colors: number
  composition: number
}

interface EvalResult {
  score: number
  feedback: string
  passed: boolean
  breakdown?: Breakdown
}

interface Props {
  challenge: Challenge
  priorBest: { accuracy_score: number; passed: boolean } | null
  imageUrl: string
  referencePrompt: string
  challengeImageId: string
  userName: string
}

const BREAKDOWN_LABELS: { key: keyof Breakdown; label: string; max: number }[] = [
  { key: 'subjects',    label: 'Subjects & Objects', max: 30 },
  { key: 'scene',       label: 'Scene & Environment', max: 20 },
  { key: 'lighting',    label: 'Lighting & Atmosphere', max: 15 },
  { key: 'colors',      label: 'Color & Tone', max: 15 },
  { key: 'composition', label: 'Composition & Detail', max: 20 },
]

export default function ChallengeClient({ challenge, priorBest, imageUrl, referencePrompt, challengeImageId, userName }: Props) {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<EvalResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [levelComplete, setLevelComplete] = useState(false)
  const [completedDifficulty, setCompletedDifficulty] = useState('')
  const [dailyUsed, setDailyUsed] = useState(0)
  const [dailyLimit, setDailyLimit] = useState(99)
  const [dailyAllowed, setDailyAllowed] = useState(true)
  const [resetsAt, setResetsAt] = useState('')

  useEffect(() => {
    getDailyUsage(challenge.id).then(({ used, limit, allowed, resetsAt }) => {
      setDailyUsed(used)
      setDailyLimit(limit)
      setDailyAllowed(allowed)
      setResetsAt(resetsAt)
    })
  }, [challenge.id])
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modalOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    const res = await evaluatePrompt(
      challenge.id,
      challengeImageId,
      prompt,
      challenge.min_accuracy_to_pass
    )
    setResult(res)
    if (res.error === 'daily_limit') {
      setDailyAllowed(false)
    } else {
      setDailyUsed(prev => prev + 1)
      if (dailyUsed + 1 >= dailyLimit) setDailyAllowed(false)
    }
    if (res.passed) {
      const { levelComplete: lc, difficulty: diff } = await checkLevelComplete(challenge.id)
      setLevelComplete(lc)
      setCompletedDifficulty(diff)
    }
    setLoading(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    if (result?.passed) {
      window.location.href = '/dashboard'
    } else {
      window.location.reload()
    }
  }

  const handleContinue = () => {
    window.location.href = '/dashboard'
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="font-sans text-xs tracking-widest uppercase text-slate/40 mb-6">
          Challenges &rsaquo; {challenge.title}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT — image + info */}
          <div className="card-classic space-y-4">
            <div className="flex items-start justify-between">
              <h1 className="font-serif text-2xl text-steel leading-tight">{challenge.title}</h1>
              <span className={`font-sans text-xs px-2.5 py-1 border rounded-full tracking-wide capitalize ${DIFFICULTY_STYLES[challenge.difficulty]}`}>
                {DIFFICULTY_ICONS[challenge.difficulty]} {challenge.difficulty}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-fog-border" />
              <span className="text-steel/30 text-xs">✦</span>
              <div className="h-px flex-1 bg-fog-border" />
            </div>

            <div className="relative w-full aspect-[4/3] border-2 border-fog-border overflow-hidden bg-fog-muted">
              {!imageLoadError ? (
                <img
                  src={imageUrl}
                  alt="Challenge image"
                  className="h-full w-full object-cover"
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-center p-6">
                  <div>
                    <p className="font-sans text-sm text-slate-500 mb-2">Image unavailable</p>
                    <p className="font-sans text-xs text-slate-400">Please refresh the page.</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-slate-dark/70 px-3 py-1.5 flex items-center justify-between">
                <p className="font-sans text-xs text-fog tracking-wide">Describe this image precisely</p>
                <span className="font-sans text-xs text-fog/60 italic">live image</span>
              </div>
            </div>

            <p className="font-sans text-sm text-slate/70 leading-relaxed">{challenge.description}</p>

            <div className="flex items-center justify-between border-t border-fog-border pt-3">
              <span className="font-sans text-xs text-slate/50 tracking-wide">Pass threshold</span>
              <span className="font-serif text-lg font-bold text-steel">{challenge.min_accuracy_to_pass}%</span>
            </div>

            {priorBest && (
              <div className={`flex items-center justify-between border rounded px-3 py-2 ${priorBest.passed ? 'border-steel-muted bg-steel-faint' : 'border-fog-border bg-fog-muted'}`}>
                <span className="font-sans text-xs text-slate/60">Your best score</span>
                <span className={`font-serif text-lg font-bold ${priorBest.passed ? 'text-steel' : 'text-steel-light'}`}>
                  {priorBest.accuracy_score}% {priorBest.passed ? '✓ Passed' : ''}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT — prompt input */}
          <div className="card-classic">
            <h2 className="font-serif text-xl text-steel mb-1">Your Prompt</h2>
            <p className="font-sans text-xs text-slate/50 mb-4 tracking-wide">
              Write a detailed image generation prompt that captures everything you see. Gemini AI will semantically compare your prompt to the reference — meaning matters, not keywords.
            </p>

            {/* Daily limit indicator */}
            <div className={`flex items-center justify-between mb-4 px-3 py-2 border rounded text-xs font-sans ${
              !dailyAllowed
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-fog-border bg-fog-muted text-slate/50'
            }`}>
              <span>Daily attempts</span>
              <span className="font-semibold">{dailyUsed} / {dailyLimit === 99 ? '…' : dailyLimit}</span>
            </div>

            {!dailyAllowed && (
              <div className="mb-4 px-3 py-2 border border-red-200 bg-red-50 text-xs font-sans text-red-600 rounded">
                ⏳ You've used all attempts for today. Resets at midnight.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={10}
                className="input-classic resize-none leading-relaxed"
                placeholder="Describe the subjects, setting, lighting, colors, mood, and composition…"
                required
              />
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs text-slate/40">{prompt.length} characters</span>
                <button type="submit" disabled={loading || !prompt.trim() || !dailyAllowed} className="btn-primary">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Evaluating…
                    </span>
                  ) : !dailyAllowed ? `Daily limit reached (${dailyUsed}/${dailyLimit})` : 'Submit Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {modalOpen && result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-lg bg-white border-2 border-fog-border shadow-2xl animate-slide-up overflow-y-auto"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header band */}
            <div className={`px-6 py-5 border-b border-fog-border ${result.passed ? 'bg-steel-faint' : 'bg-fog-muted'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-xs tracking-widest uppercase text-slate/50 mb-1">Evaluation Result</p>
                  <div className="flex items-center gap-3">
                    <span className={`font-serif text-5xl font-bold ${result.passed ? 'text-steel' : result.score >= 50 ? 'text-steel-light' : 'text-slate/50'}`}>
                      {result.score}%
                    </span>
                    <div className={`px-3 py-1 border text-xs font-sans font-bold tracking-widest uppercase ${result.passed ? 'border-steel-muted bg-steel/10 text-steel-dark' : 'border-slate/20 bg-slate/5 text-slate/60'}`}>
                      {result.passed ? '✓ PASSED' : '✗ FAILED'}
                    </div>
                  </div>
                </div>
                <button onClick={closeModal} className="text-slate/40 hover:text-slate/70 transition-colors text-2xl leading-none">×</button>
              </div>

              {/* Score bar */}
              <div className="mt-4 w-full bg-fog-border h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${result.passed ? 'bg-steel' : result.score >= 50 ? 'bg-steel-light' : 'bg-slate/30'}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-sans text-xs text-slate/40">0%</span>
                <span className="font-sans text-xs text-slate/40">Pass at {challenge.min_accuracy_to_pass}%</span>
                <span className="font-sans text-xs text-slate/40">100%</span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Feedback */}
              <div>
                <p className="font-sans text-xs tracking-widest uppercase text-slate/40 mb-2">AI Feedback</p>
                <p className="font-sans text-sm text-slate/75 leading-relaxed">{result.feedback}</p>
              </div>

              {/* Breakdown */}
              {result.breakdown && (
                <div>
                  <p className="font-sans text-xs tracking-widest uppercase text-slate/40 mb-3">Score Breakdown</p>
                  <div className="space-y-3">
                    {BREAKDOWN_LABELS.map(({ key, label, max }) => {
                      const val = result.breakdown![key] ?? 0
                      const pct = Math.round((val / max) * 100)
                      return (
                        <div key={key}>
                          <div className="flex justify-between mb-1">
                            <span className="font-sans text-xs text-slate/60">{label}</span>
                            <span className="font-sans text-xs font-semibold text-steel">{val}/{max}</span>
                          </div>
                          <div className="w-full bg-fog-border h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${pct >= 70 ? 'bg-steel' : pct >= 40 ? 'bg-steel-light' : 'bg-slate/30'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Certificate only on full level completion */}
              {result.passed && levelComplete && (
                <div className="border-t border-fog-border pt-5">
                  <p className="font-sans text-xs tracking-widest uppercase text-slate/40 mb-1">🎓 Level Complete!</p>
                  <p className="font-sans text-xs text-slate/50 mb-4">You've mastered the <span className="capitalize font-semibold">{completedDifficulty}</span> realm.</p>
                  <div className="overflow-x-auto">
                    <Certificate
                      userName={userName}
                      challengeTitle={`${completedDifficulty.charAt(0).toUpperCase() + completedDifficulty.slice(1)} Realm`}
                      difficulty={completedDifficulty}
                      score={result.score}
                    />
                  </div>
                </div>
              )}

              {/* Tip if failed */}
              {!result.passed && (
                <p className="font-sans text-xs text-slate/45 italic border-t border-fog-border pt-4">
                  Tip: Focus on the visual meaning — describe what you see conceptually, not just list keywords. Think about mood, atmosphere, and spatial relationships.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-fog-border flex gap-3 justify-end">
              {result.passed ? (
                <button onClick={handleContinue} className="btn-primary text-xs px-4 py-2">
                  Continue to Dashboard
                </button>
              ) : (
                <button onClick={closeModal} className="btn-secondary text-xs px-4 py-2">
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
