import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import { join } from 'path'

const envContent = fs.readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim()
  }
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('Fetching policies...')
  // Using rpc or direct query might not be exposed, let's try a workaround or we can just fetch the RLS status:
  const { data, error } = await supabase.rpc('query_pg_policies') // This might not exist
  // Instead, let's do a fast raw fetch or test if we can fetch using an ANON key and mock JWT.
  
  // Actually, we can just write a raw SQL query if we use postgres connection string, but we only have SUPABASE_URL.
  // Nevermind, let's check if the table has RLS enabled by trying to insert/select with ONLY ANON key (no auth).
  const anonClient = createClient(supabaseUrl, env['NEXT_PUBLIC_SUPABASE_ANON_KEY'])
  
  const { data: anonData, error: anonErr } = await anonClient.from('judge_assignments').select('*')
  console.log('Anon fetch:', anonData?.length, 'records')
  console.log('Anon error:', anonErr)
}

main()
