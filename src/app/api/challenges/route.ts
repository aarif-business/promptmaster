import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { title, description, difficulty, image_topic, min_accuracy_to_pass, created_by } = body

  if (!title || !description || !difficulty || !image_topic || !min_accuracy_to_pass || !created_by) {
    return NextResponse.json({ error: 'Missing challenge data.' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('challenges')
      .insert({ title, description, difficulty, image_topic, min_accuracy_to_pass, created_by })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ challenge: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error creating challenge.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
