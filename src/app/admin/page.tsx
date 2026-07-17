import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const [
    { count: totalUsers },
    { count: totalSubmissions },
    { data: submissions },
    { data: challenges },
    { data: imageCounts },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('accuracy_score'),
    supabase.from('challenges').select('id, title, difficulty, created_at').order('difficulty').order('created_at'),
    supabase.from('challenge_images').select('challenge_id'),
  ])

  const avgAccuracy = submissions?.length
    ? Math.round(submissions.reduce((a, s) => a + s.accuracy_score, 0) / submissions.length)
    : 0

  // Count images per challenge
  const countMap: Record<string, number> = {}
  for (const row of imageCounts ?? []) {
    countMap[row.challenge_id] = (countMap[row.challenge_id] ?? 0) + 1
  }

  const challengesWithCounts = (challenges ?? []).map(c => ({
    ...c,
    image_count: countMap[c.id] ?? 0,
  }))

  return (
    <AdminClient
      stats={{ totalUsers: totalUsers ?? 0, totalSubmissions: totalSubmissions ?? 0, avgAccuracy }}
      challenges={challengesWithCounts}
      adminId={user!.id}
    />
  )
}
