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
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetch() {
  const targetJudgeId = 'a93ae356-9632-45bb-acef-0b5c001fc1e6'
  
  const { data: assignments, error } = await supabase
        .from('judge_assignments')
        .select('*')
        // .eq('judge_id', targetJudgeId)

  console.log('Anon assignments fetch error:', error)
  console.log('Anon assignments count:', assignments?.length)
  if (assignments?.length) {
    console.log('Assignments:', assignments)
  }
}

testFetch()
