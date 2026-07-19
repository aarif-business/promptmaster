import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const [
    { data: profiles },
    { data: challenges },
    { data: allSubmissions },
    { count: totalSubmissions },
    { data: scoreRows },
    { data: imageCounts },
  ] = await Promise.all([
    admin.from('profiles').select('id, full_name, role, created_at').order('role').order('created_at', { ascending: false }),
    admin.from('challenges').select('id, title, difficulty, created_at').order('difficulty').order('created_at'),
    admin.from('submissions').select('user_id, challenge_id, accuracy_score, passed'),
    admin.from('submissions').select('*', { count: 'exact', head: true }),
    admin.from('submissions').select('accuracy_score'),
    admin.from('challenge_images').select('challenge_id'),
  ])

  // Get emails from auth.users via admin API
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers()
  const emailMap: Record<string, string> = {}
  for (const u of authUsers ?? []) emailMap[u.id] = u.email ?? ''

  const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced']

  // Build per-user progress
  const users = (profiles ?? []).map(p => {
    const subs = (allSubmissions ?? []).filter(s => s.user_id === p.id)
    const bestByChallenge: Record<string, { passed: boolean; accuracy_score: number }> = {}
    for (const s of subs) {
      if (!bestByChallenge[s.challenge_id] || s.accuracy_score > bestByChallenge[s.challenge_id].accuracy_score) {
        bestByChallenge[s.challenge_id] = s
      }
    }

    const passedByDiff: Record<string, boolean> = {}
    for (const diff of DIFFICULTY_ORDER) {
      passedByDiff[diff] = (challenges ?? []).filter(c => c.difficulty === diff).some(c => bestByChallenge[c.id]?.passed)
    }

    // Current level = highest unlocked difficulty
    let currentLevel = 'beginner'
    if (passedByDiff['intermediate']) currentLevel = 'advanced'
    else if (passedByDiff['beginner']) currentLevel = 'intermediate'

    // Current challenge = first unpassed challenge in current level
    const levelChallenges = (challenges ?? []).filter(c => c.difficulty === currentLevel)
    const currentChallengeIdx = levelChallenges.findIndex(c => !bestByChallenge[c.id]?.passed)
    const currentChallengeNum = currentChallengeIdx === -1 ? levelChallenges.length : currentChallengeIdx + 1

    // Overall completion %
    const totalChallenges = (challenges ?? []).length
    const passedCount = Object.values(bestByChallenge).filter(b => b.passed).length
    const completionPct = totalChallenges > 0 ? Math.round((passedCount / totalChallenges) * 100) : 0

    return {
      id: p.id,
      name: p.full_name || '—',
      email: emailMap[p.id] || '—',
      role: p.role ?? 'user',
      level: currentLevel,
      currentChallengeNum,
      totalInLevel: levelChallenges.length,
      completionPct,
      joinedAt: p.created_at,
    }
  })

  const avgAccuracy = scoreRows?.length
    ? Math.round(scoreRows.reduce((a, s) => a + s.accuracy_score, 0) / scoreRows.length)
    : 0

  const countMap: Record<string, number> = {}
  for (const row of imageCounts ?? []) countMap[row.challenge_id] = (countMap[row.challenge_id] ?? 0) + 1

  const challengesWithCounts = (challenges ?? []).map(c => ({ ...c, image_count: countMap[c.id] ?? 0 }))

  return (
    <AdminClient
      stats={{ totalUsers: (profiles ?? []).length, totalSubmissions: totalSubmissions ?? 0, avgAccuracy }}
      users={users}
      challenges={challengesWithCounts}
      adminId={user!.id}
    />
  )
}
