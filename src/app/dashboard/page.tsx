import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DashboardClient from './DashboardClient'
import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Dashboard — Your Progress',
  description: 'Track your prompt engineering progress, medals, XP, and submission history on PromptMaster.',
  robots: { index: false, follow: false },
}

export default async function DashboardPage() {
  noStore()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('full_name, role, created_at').eq('id', user.id).single()
  if (profile?.role === 'admin') redirect('/admin')

  const admin = createAdminClient()

  const [{ data: challenges }, { data: allSubmissions }, { data: recentSubmissions }] = await Promise.all([
    admin.from('challenges').select('id, title, description, difficulty, min_accuracy_to_pass').order('difficulty').order('created_at'),
    admin.from('submissions').select('challenge_id, accuracy_score, passed').eq('user_id', user.id),
    admin.from('submissions').select('id, challenge_id, accuracy_score, passed, submitted_at, user_prompt').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(8),
  ])

  const allSubs = allSubmissions ?? []
  const allChallenges = challenges ?? []

  const passedChallengeIds = new Set(allSubs.filter(s => s.passed).map(s => s.challenge_id))

  const bestByChallenge = allSubs.reduce<Record<string, { accuracy_score: number; passed: boolean }>>((acc, s) => {
    if (!acc[s.challenge_id] || s.accuracy_score > acc[s.challenge_id].accuracy_score) acc[s.challenge_id] = s
    return acc
  }, {})

  const avgScore = allSubs.length
    ? Math.round(allSubs.reduce((a, s) => a + s.accuracy_score, 0) / allSubs.length)
    : 0

  const passedByDiff: Record<string, boolean> = {}
  for (const diff of ['beginner', 'intermediate', 'advanced']) {
    passedByDiff[diff] = allChallenges.filter(c => c.difficulty === diff).some(c => bestByChallenge[c.id]?.passed)
  }

  return (
    <DashboardClient
      profile={profile}
      email={user!.email ?? ''}
      challenges={allChallenges}
      bestByChallenge={bestByChallenge}
      submissions={recentSubmissions ?? []}
      passedCount={passedChallengeIds.size}
      avgScore={avgScore}
      totalAttempts={allSubs.length}
      passedByDiff={passedByDiff}
    />
  )
}
