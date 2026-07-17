'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Images per difficulty level
const IMAGES_PER_LEVEL: Record<string, number> = {
  beginner:     10,
  intermediate: 10,
  advanced:     10,
}

const IMAGE_RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504])

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchImageForGemini(url: string, retries = 3): Promise<{ data: string; mimeType: string; resolvedUrl: string }> {
  let lastError: Error | null = null
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: {
          Accept: 'image/*',
          'User-Agent': 'Mozilla/5.0 (compatible; PromptMaster/1.0)',
        },
      })
      if (!res.ok) {
        if (IMAGE_RETRY_STATUS.has(res.status) && attempt < retries) { await delay(500 * attempt); continue }
        throw new Error(`Image fetch failed: ${res.status}`)
      }
      const contentType = res.headers.get('content-type') ?? 'image/jpeg'
      const mimeType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(contentType.split(';')[0].trim())
        ? contentType.split(';')[0].trim() : 'image/jpeg'
      const buffer = await res.arrayBuffer()
      return { data: Buffer.from(buffer).toString('base64'), mimeType, resolvedUrl: res.url }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < retries) await delay(500 * attempt)
    }
  }
  throw lastError ?? new Error(`Unable to fetch image: ${url}`)
}

async function callGroq(prompt: string, maxTokens = 512): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Groq error: ${res.status} — ${JSON.stringify(err)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// Build a topic-based reference prompt without calling Gemini (saves quota)
function buildReferencePrompt(topic: string): string {
  return `A high-quality photograph featuring ${topic}. The scene shows clear subjects related to ${topic} with natural lighting, balanced composition, and vivid colors that capture the essence and mood of ${topic}.`
}

// ── Build topic-relevant image URLs (Unsplash Source → Picsum fallback) ─────

function topicImageSources(topic: string, index: number): string[] {
  // Unsplash Source uses the topic keywords to return relevant photos.
  // &sig= gives variety across indices without repeating the same photo.
  const kw = encodeURIComponent(topic.trim())
  return [
    `https://source.unsplash.com/featured/800x600/?${kw}&sig=${index}`,
    `https://source.unsplash.com/800x600/?${kw}&sig=${index + 100}`,
    `https://picsum.photos/800/600?random=${index + 200}`,   // last-resort random
  ]
}

// ── Seed images for a single challenge ──────────────────────────────────────

export async function seedChallengeImages(challengeId: string): Promise<{ seeded: number; skipped: number }> {
  const admin = createAdminClient()

  const { data: challenge } = await admin
    .from('challenges')
    .select('image_topic, difficulty')
    .eq('id', challengeId)
    .single()

  if (!challenge) throw new Error('Challenge not found')

  const count = IMAGES_PER_LEVEL[challenge.difficulty] ?? 10

  const { data: existing } = await admin
    .from('challenge_images')
    .select('seed_index')
    .eq('challenge_id', challengeId)

  const existingIndices = new Set((existing ?? []).map(r => r.seed_index))

  let seeded = 0
  let skipped = 0

  for (let i = 0; i < count; i++) {
    if (existingIndices.has(i)) { skipped++; continue }

    try {
      const image = await fetchImageFromTopic(challenge.image_topic, i)
      const referencePrompt = buildReferencePrompt(challenge.image_topic)

      await admin.from('challenge_images').insert({
        challenge_id: challengeId,
        image_url: image.resolvedUrl,
        image_data: image.data,
        image_mime_type: image.mimeType,
        reference_prompt: referencePrompt.trim(),
        seed_index: i,
      })

      seeded++
    } catch (e) {
      console.warn(`Failed to seed image ${i} for challenge ${challengeId}:`, e)
    }
  }

  return { seeded, skipped }
}

// ── Fetch a topic-relevant image, trying sources in order ────────────────────

async function fetchImageFromTopic(
  topic: string,
  index: number
): Promise<{ data: string; mimeType: string; resolvedUrl: string }> {
  const sources = topicImageSources(topic, index)
  let lastError: Error = new Error('No sources available')
  for (const src of sources) {
    try { return await fetchImageForGemini(src) } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw lastError
}

// ── Seed a single image for a challenge (used for auto-seeding) ─────────────

async function seedOneImage(
  challengeId: string,
  topic: string,
  seedIndex: number
): Promise<{ id: string; imageUrl: string; referencePrompt: string }> {
  const admin = createAdminClient()
  const image = await fetchImageFromTopic(topic, seedIndex)
  const referencePrompt = buildReferencePrompt(topic)

  const { data: row, error } = await admin
    .from('challenge_images')
    .insert({
      challenge_id: challengeId,
      image_url: image.resolvedUrl,
      image_data: image.data,
      image_mime_type: image.mimeType,
      reference_prompt: referencePrompt.trim(),
      seed_index: seedIndex,
    })
    .select('id, image_data, image_mime_type, image_url, reference_prompt')
    .single()

  if (error || !row) throw new Error(`Failed to store seeded image: ${error?.message}`)

  return { id: row.id, imageUrl: `data:${row.image_mime_type};base64,${row.image_data}`, referencePrompt: row.reference_prompt }
}

// ── Get next unseen image for a user in a challenge ──────────────────────────

export async function getNextChallengeImage(
  challengeId: string
): Promise<{ id: string; imageUrl: string; referencePrompt: string }> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: challenge } = await admin
    .from('challenges')
    .select('image_topic, difficulty')
    .eq('id', challengeId)
    .single()

  if (!challenge) throw new Error('Challenge not found')

  const { data: allImages } = await admin
    .from('challenge_images')
    .select('id, image_data, image_mime_type, image_url, reference_prompt, seed_index')
    .eq('challenge_id', challengeId)
    .order('seed_index')

  if (!allImages?.length) {
    const seeded = await seedOneImage(challengeId, challenge.image_topic, 0)

    await admin.from('user_image_assignments').upsert({
      user_id: user.id,
      challenge_id: challengeId,
      challenge_image_id: seeded.id,
    }, { onConflict: 'user_id,challenge_image_id' })

    const total = IMAGES_PER_LEVEL[challenge.difficulty] ?? 10
    seedRemainingImages(challengeId, challenge.image_topic, total).catch(() => {})

    return seeded
  }

  const { data: seen } = await admin
    .from('user_image_assignments')
    .select('challenge_image_id')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)

  const seenIds = new Set((seen ?? []).map(r => r.challenge_image_id))
  const unseen = allImages.filter(img => !seenIds.has(img.id))
  const pool = unseen.length > 0 ? unseen : allImages
  const picked = pool[Math.floor(Math.random() * pool.length)]

  await admin.from('user_image_assignments').upsert({
    user_id: user.id,
    challenge_id: challengeId,
    challenge_image_id: picked.id,
  }, { onConflict: 'user_id,challenge_image_id' })

  const imageUrl = picked.image_data
    ? `data:${picked.image_mime_type};base64,${picked.image_data}`
    : picked.image_url

  return { id: picked.id, imageUrl, referencePrompt: picked.reference_prompt }
}

// Seeds indices 1..total-1 in the background after the first image is served
async function seedRemainingImages(challengeId: string, topic: string, total: number) {
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('challenge_images')
    .select('seed_index')
    .eq('challenge_id', challengeId)
  const existingIndices = new Set((existing ?? []).map(r => r.seed_index))

  for (let i = 1; i < total; i++) {
    if (existingIndices.has(i)) continue
    try { await seedOneImage(challengeId, topic, i) }
    catch (e) { console.warn(`Background seed failed for index ${i}:`, e) }
  }
}

// ── Evaluate a user's prompt ─────────────────────────────────────────────────

interface EvaluateResult {
  score: number
  feedback: string
  passed: boolean
  breakdown?: { subjects: number; scene: number; lighting: number; colors: number; composition: number }
  error?: string
}

export async function evaluatePrompt(
  challengeId: string,
  challengeImageId: string,
  userPrompt: string,
  minAccuracy: number
): Promise<EvaluateResult> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { score: 0, feedback: 'Not authenticated', passed: false, error: 'auth' }

  // Fetch only the reference prompt — no image bytes needed at eval time
  const { data: imgRow } = await admin
    .from('challenge_images')
    .select('reference_prompt')
    .eq('id', challengeImageId)
    .single()

  let score = 0
  let feedback = 'Evaluation unavailable.'
  let aiResponseText = ''
  let breakdown: { subjects: number; scene: number; lighting: number; colors: number; composition: number } | undefined

  try {
    const referencePrompt = imgRow?.reference_prompt ?? ''
    if (!referencePrompt) throw new Error('No reference prompt stored for this image yet.')

    // Text-only call — compare user prompt against the AI-generated reference prompt.
    // This uses ~100x fewer tokens than sending image bytes.
    const raw = await callGroq(`You are an expert image prompt evaluator.

AI REFERENCE PROMPT (ground truth description of the actual image):
"${referencePrompt}"

USER PROMPT (what the user wrote after seeing the image):
"${userPrompt}"

Score how well the user's prompt matches the reference. Focus on visual concepts and meaning, not exact wording.

Dimensions:
1. Core subjects & objects (0-30): same main subjects and key elements?
2. Scene & environment (0-20): same setting, location, background?
3. Lighting & atmosphere (0-15): same lighting, time of day, mood?
4. Color palette & tone (0-15): same dominant colors and emotional tone?
5. Composition & detail (0-20): same framing, perspective, level of detail?

Rules:
- Award full points when the concept matches even with different wording
- Award partial points for partial matches
- A detailed accurate description scores 65-90
- A vague but directionally correct description scores 30-60
- Only score below 15 if the description contradicts or is unrelated to the reference
- NEVER return 0 for a non-empty prompt

Return ONLY raw JSON, no markdown, no code fences:
{"score":<0-100>,"feedback":"2-3 sentences on what matched and what was missing","breakdown":{"subjects":<0-30>,"scene":<0-20>,"lighting":<0-15>,"colors":<0-15>,"composition":<0-20>}}`, 300)

    aiResponseText = raw

    const cleaned = raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error(`No JSON in response: ${cleaned.slice(0, 150)}`)

    const parsed = JSON.parse(jsonMatch[0])

    if (parsed.breakdown && typeof parsed.breakdown === 'object') {
      breakdown = {
        subjects:    Math.min(30, Math.max(0, Number(parsed.breakdown.subjects)    || 0)),
        scene:       Math.min(20, Math.max(0, Number(parsed.breakdown.scene)       || 0)),
        lighting:    Math.min(15, Math.max(0, Number(parsed.breakdown.lighting)    || 0)),
        colors:      Math.min(15, Math.max(0, Number(parsed.breakdown.colors)      || 0)),
        composition: Math.min(20, Math.max(0, Number(parsed.breakdown.composition) || 0)),
      }
      score = breakdown.subjects + breakdown.scene + breakdown.lighting + breakdown.colors + breakdown.composition
    }

    if (!score) score = Math.min(100, Math.max(10, Math.round(Number(parsed.score) || 10)))

    feedback = typeof parsed.feedback === 'string' && parsed.feedback.trim()
      ? parsed.feedback.trim() : 'Evaluation complete.'

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[evaluatePrompt] error:', msg)
    feedback = `Evaluation error: ${msg.slice(0, 150)}`
    aiResponseText = msg
  }

  const passed = score >= minAccuracy

  const { error: insertError } = await admin.from('submissions').insert({
    user_id: user.id,
    challenge_id: challengeId,
    user_prompt: userPrompt,
    ai_response_text: aiResponseText.slice(0, 2000),
    accuracy_score: score,
    passed,
  })

  if (insertError) {
    console.error('[evaluatePrompt] insert error:', insertError.code, insertError.message)
    return { score, feedback, passed, breakdown, error: insertError.message }
  }

  console.log('[evaluatePrompt] insert OK — user:', user.id, 'score:', score, 'passed:', passed)

  return { score, feedback, passed, breakdown }
}
