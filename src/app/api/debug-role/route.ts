import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not logged in', authError })
  }

  const { data: profileAnon, error: anonError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const admin = createAdminClient()
  const { data: profileAdmin, error: adminError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: allProfiles } = await admin
    .from('profiles')
    .select('id, full_name, role')

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    profileAnon,
    anonError,
    profileAdmin,
    adminError,
    allProfiles,
  })
}
