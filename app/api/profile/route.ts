import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) return NextResponse.json({ error: 'Missing wallet' }, { status: 400 })

  const { data, error } = await supabaseAdmin()
    .from('profiles')
    .select('*')
    .eq('wallet_address', wallet)
    .single()

  // PGRST116 = no rows found (perfil nuevo, no es error)
  if (error && error.code !== 'PGRST116')
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ profile: data ?? null })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { wallet_address, display_name, email } = body
  if (!wallet_address) return NextResponse.json({ error: 'Missing wallet' }, { status: 400 })

  const { data, error } = await supabaseAdmin()
    .from('profiles')
    .upsert(
      { wallet_address, display_name, email, updated_at: new Date().toISOString() },
      { onConflict: 'wallet_address' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
