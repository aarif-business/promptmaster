import { NextResponse } from 'next/server'
import { seedChallengeImages } from '@/app/actions'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  if (!params?.id) {
    return NextResponse.json({ error: 'Missing challenge id.' }, { status: 400 })
  }

  try {
    const result = await seedChallengeImages(params.id)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to seed images.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
