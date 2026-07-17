import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import ChallengeClient from './ChallengeClient'
import { getNextChallengeImage } from '@/app/actions'
import { unstable_noStore as noStore } from 'next/cache'

const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced']

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const admin = createAdminClient()
  const { data: challenge } = await admin.from('challenges').select('description, difficulty').eq('id', id).single()
  const { data: sameDiff } = await admin.from('challenges').select('id').eq('difficulty', challenge?.difficulty ?? '').order('created_at')
  const idx = (sameDiff ?? []).findIndex(c => c.id === id)
  const title = `Challenge ${idx + 1} — ${challenge?.difficulty ?? ''} Realm`
  return {
    title,
    description: challenge?.description ?? 'A prompt engineering challenge on PromptMaster.',
    robots: { index: false, follow: false },
  }
}

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  noStore()
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: challenge } = await admin
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single()

  if (!challenge) notFound()

  // All challenges in this difficulty ordered by created_at
  const { data: sameDiff } = await admin
    .from('challenges')
    .select('id')
    .eq('difficulty', challenge.difficulty)
    .order('created_at')

  const challengeIndex = (sameDiff ?? []).findIndex(c => c.id === id)

  // ── Stage lock: intermediate/advanced require previous stage passed ──
  const diffIdx = DIFFICULTY_ORDER.indexOf(challenge.difficulty)
  if (diffIdx > 0) {
    const prevDiff = DIFFICULTY_ORDER[diffIdx - 1]
    const { data: prevDiffChallenges } = await admin
      .from('challenges').select('id').eq('difficulty', prevDiff)
    const prevIds = (prevDiffChallenges ?? []).map(c => c.id)
    if (prevIds.length > 0) {
      const { data: anyPassed } = await admin
        .from('submissions').select('id')
        .eq('user_id', user.id).eq('passed', true)
        .in('challenge_id', prevIds).limit(1).single()
      if (!anyPassed) redirect('/challenges')
    }
  }

  // ── Sub-level lock: challenge N requires challenge N-1 passed ──
  if (challengeIndex > 0) {
    const prevId = (sameDiff ?? [])[challengeIndex - 1]?.id
    if (prevId) {
      const { data: prevPassed } = await admin
        .from('submissions').select('id')
        .eq('challenge_id', prevId).eq('user_id', user.id)
        .eq('passed', true).limit(1).single()
      if (!prevPassed) redirect('/challenges')
    }
  }

  const challengeWithLabel = { ...challenge, title: `Challenge ${challengeIndex + 1}` }

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || user.email?.split('@')[0] || 'Scholar'

  const { data: bestSubmission } = await admin
    .from('submissions')
    .select('accuracy_score, passed')
    .eq('challenge_id', id)
    .eq('user_id', user.id)
    .order('accuracy_score', { ascending: false })
    .limit(1)
    .single()

  const { id: challengeImageId, imageUrl, referencePrompt } = await getNextChallengeImage(id)

  return (
    <ChallengeClient
      challenge={challengeWithLabel}
      priorBest={bestSubmission ?? null}
      imageUrl={imageUrl}
      referencePrompt={referencePrompt}
      challengeImageId={challengeImageId}
      userName={userName}
    />
  )
}
