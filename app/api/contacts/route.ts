import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) return NextResponse.json({ error: 'Missing wallet' }, { status: 400 })

  const { data, error } = await supabaseAdmin()
    .from('contacts')
    .select('*')
    .eq('owner_wallet', wallet)
    .order('alias')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contacts: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { owner_wallet, alias, wallet_address, network } = body

  if (!owner_wallet || !alias || !wallet_address)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Garantizar que exista el perfil antes de insertar el contacto
  await supabaseAdmin()
    .from('profiles')
    .upsert({ wallet_address: owner_wallet }, { onConflict: 'wallet_address', ignoreDuplicates: true })

  const { data, error } = await supabaseAdmin()
    .from('contacts')
    .insert({ owner_wallet, alias, wallet_address, network: network ?? 'monad' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact: data })
}
