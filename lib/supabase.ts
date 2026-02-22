import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente público (browser) — sin acceso directo a datos protegidos
export const supabase = createClient(url, anon)

// Cliente admin con service role — solo usar en API routes (servidor)
export const supabaseAdmin = () =>
  createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
