import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'

const STAGE_META: Record<string, { icon: string; medal: string; color: string; bg: string; terrain: string }> = {
  beginner:     { icon: '🗺️', medal: '🥉', color: 'text-amber-600',  bg: 'from-amber-50 to-fog-muted',    terrain: 'The Misty Meadows'   },
  intermediate: { icon: '⚔️', medal: '🥈', color: 'text-slate-500',  bg: 'from-steel-faint to-fog-muted', terrain: 'The Iron Citadel'    },
  advanced:     { icon: '👑', medal: '🥇', color: 'text-yellow-500', bg: 'from-steel/20 to-fog-muted',    terrain: 'The Summit of Mastery' },
}

const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced']

export default async function ChallengesPage() {
  noStore()
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenges } = await admin
    .from('challenges')
    .select('id, title, description, difficulty, image_topic, min_accuracy_to_pass')
    .order('created_at', { ascending: true })

  const { data: submissions } = await admin
    .from('submissions')
    .select('challenge_id, accuracy_score, passed')
    .eq('user_id', user!.id)

  const bestByChallenge = (submissions ?? []).reduce<Record<string, { accuracy_score: number; passed: boolean }>>(
    (acc, s) => {
      if (!acc[s.challenge_id] || s.accuracy_score > acc[s.challenge_id].accuracy_score) acc[s.challenge_id] = s
      return acc
    }, {}
  )

  const grouped = DIFFICULTY_ORDER.map(diff => ({
    difficulty: diff,
    meta: STAGE_META[diff],
    challenges: (challenges ?? []).filter(c => c.difficulty === diff),
  }))

  const passedByDiff: Record<string, boolean> = {}
  grouped.forEach(({ difficulty, challenges: cs }) => {
    passedByDiff[difficulty] = cs.some(c => bestByChallenge[c.id]?.passed)
  })

  const isStageUnlocked = (diff: string) => {
    const idx = DIFFICULTY_ORDER.indexOf(diff)
    if (idx === 0) return true
    return passedByDiff[DIFFICULTY_ORDER[idx - 1]]
  }

  // Challenge at index i is unlocked only if challenge i-1 is passed
  const isChallengeUnlocked = (diff: string, idx: number) => {
    if (!isStageUnlocked(diff)) return false
    if (idx === 0) return true
    const diffChallenges = (challenges ?? []).filter(c => c.difficulty === diff)
    const prev = diffChallenges[idx - 1]
    return bestByChallenge[prev?.id]?.passed ?? false
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="text-center mb-14 animate-slide-up">
        <div className="inline-flex items-center gap-2 bg-steel/10 border border-steel/20 px-4 py-1.5 rounded-full mb-4">
          <span className="text-sm">🧭</span>
          <span className="font-sans text-xs tracking-[0.3em] uppercase text-steel font-semibold">World Map</span>
        </div>
        <h1 className="font-serif text-5xl text-steel mb-3">Choose Your Quest</h1>
        <p className="font-sans text-sm text-slate/60 max-w-md mx-auto">
          Complete each realm to unlock the next. Earn medals. Ascend to mastery.
        </p>
      </div>

      {/* World Map Path */}
      <div className="relative flex flex-col gap-0">
        {grouped.map(({ difficulty, meta, challenges: cs }, stageIdx) => {
          const unlocked = isStageUnlocked(difficulty)
          const stagePassed = passedByDiff[difficulty]

          return (
            <div key={difficulty} className="relative">
              {/* Connector path between stages */}
              {stageIdx > 0 && (
                <div className="flex justify-center -mt-1 mb-0 relative z-10">
                  <div className="flex flex-col items-center gap-1 py-3">
                    {[0,1,2].map(i => (
                      <div
                        key={i}
                        className={`w-0.5 h-4 rounded-full transition-all duration-500 ${unlocked ? 'bg-steel/60' : 'bg-fog-border'}`}
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                    <div className={`text-lg transition-all duration-500 ${unlocked ? 'opacity-100' : 'opacity-30'}`}>
                      {unlocked ? '⬇️' : '🔒'}
                    </div>
                  </div>
                </div>
              )}

              {/* Stage block */}
              <div
                className={`border-2 rounded-none overflow-hidden transition-all duration-500 ${
                  unlocked
                    ? stagePassed
                      ? 'border-steel bg-gradient-to-br ' + meta.bg
                      : 'border-fog-border bg-gradient-to-br ' + meta.bg + ' hover:border-steel/50'
                    : 'border-fog-border bg-fog-muted opacity-60'
                }`}
              >
                {/* Stage header */}
                <div className={`px-6 py-4 flex items-center justify-between border-b border-fog-border ${unlocked ? 'bg-white/20' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl ${unlocked ? 'animate-float' : ''}`} style={{ animationDelay: `${stageIdx * 0.4}s` }}>
                      {unlocked ? meta.icon : '🔒'}
                    </span>
                    <div>
                      <p className="font-sans text-xs tracking-widest uppercase text-slate/50">
                        Stage {stageIdx + 1} · {meta.terrain}
                      </p>
                      <h2 className="font-serif text-xl text-steel capitalize">{difficulty}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {stagePassed && (
                      <span className="text-3xl animate-bounce-in">{meta.medal}</span>
                    )}
                    {!unlocked && (
                      <span className="font-sans text-xs bg-fog-border text-slate/50 px-3 py-1 rounded-full">
                        Complete previous stage to unlock
                      </span>
                    )}
                  </div>
                </div>

                {/* Challenges grid */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cs.map((challenge, cIdx) => {
                    const challengeUnlocked = isChallengeUnlocked(difficulty, cIdx)
                    const best = bestByChallenge[challenge.id]
                    const passed = best?.passed ?? false
                    const attempted = !!best && !passed
                    const label = `Challenge ${cIdx + 1}`

                    if (!challengeUnlocked) {
                      return (
                        <div key={challenge.id} className="border border-fog-border bg-fog-muted/50 p-4 flex flex-col gap-2 opacity-50 cursor-not-allowed select-none">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🔒</span>
                            <p className="font-serif text-sm text-slate/50">{label}</p>
                          </div>
                          <p className="font-sans text-xs text-slate/30">
                            {!unlocked ? 'Complete previous stage to unlock' : 'Pass the previous challenge to unlock'}
                          </p>
                        </div>
                      )
                    }

                    return (
                      <Link key={challenge.id} href={`/challenges/${challenge.id}`} className="group">
                        <div
                          className={`border p-4 flex flex-col gap-2 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-steel/10 animate-slide-up ${
                            passed
                              ? 'border-steel bg-steel/5 hover:border-steel-dark'
                              : 'border-fog-border bg-fog-muted/60 hover:border-steel/50'
                          }`}
                          style={{ animationDelay: `${cIdx * 0.1}s`, animationFillMode: 'forwards', opacity: 0 }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xl">{passed ? '✅' : attempted ? '⚡' : '🎯'}</span>
                            {best && (
                              <span className={`font-serif text-lg font-bold ${passed ? 'text-steel' : 'text-steel-light'}`}>
                                {best.accuracy_score}%
                              </span>
                            )}
                          </div>
                          <p className="font-serif text-sm text-steel font-semibold leading-tight group-hover:text-steel-dark transition-colors">
                            {label}
                          </p>
                          <p className="font-sans text-xs text-slate/55 leading-relaxed line-clamp-2 flex-1">
                            {challenge.description}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-fog-border mt-auto">
                            <span className="font-sans text-xs text-slate/40">Pass at {challenge.min_accuracy_to_pass}%</span>
                            <span className={`font-sans text-xs font-semibold transition-colors ${passed ? 'text-steel' : 'text-steel/70 group-hover:text-steel'}`}>
                              {passed ? 'Replay →' : attempted ? 'Retry →' : 'Start →'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}

        {/* Final crown */}
        <div className="flex justify-center mt-6">
          <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${
            passedByDiff['advanced'] ? 'opacity-100 animate-bounce-in' : 'opacity-20'
          }`}>
            <div className="w-0.5 h-8 bg-steel/40 mx-auto" />
            <span className="text-4xl animate-float">👑</span>
            <p className="font-serif text-sm text-steel">Grand Master</p>
          </div>
        </div>
      </div>
    </div>
  )
}
