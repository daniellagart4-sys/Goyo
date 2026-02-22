import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { owner_wallet, alias, wallet_address, network } = body

  if (!owner_wallet) return NextResponse.json({ error: 'Missing owner' }, { status: 400 })

  const { data, error } = await supabaseAdmin()
    .from('contacts')
    .update({ alias, wallet_address, network, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_wallet', owner_wallet) // doble verificación de propiedad
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact: data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const owner_wallet = req.nextUrl.searchParams.get('wallet')
  if (!owner_wallet) return NextResponse.json({ error: 'Missing wallet' }, { status: 400 })

  const { error } = await supabaseAdmin()
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('owner_wallet', owner_wallet) // doble verificación de propiedad

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
