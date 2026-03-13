const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function test() {
    try {
        const envPath = path.join(process.cwd(), '.env.local')
        const envContent = fs.readFileSync(envPath, 'utf8')
        const env = {}
        envContent.split('\n').forEach(line => {
            const [k, ...v] = line.split('=')
            if (k) env[k.trim()] = v.join('=').trim()
        })

        const url = env['NEXT_PUBLIC_SUPABASE_URL']
        const key = env['SUPABASE_SERVICE_ROLE_KEY']
        
        console.log('URL:', url)
        console.log('Key length:', key?.length)

        const supabase = createClient(url, key)

        const { count: teamCount, error: te } = await supabase.from('teams').select('*', { count: 'exact', head: true })
        const { count: subCount, error: se } = await supabase.from('submissions').select('*', { count: 'exact', head: true })
        const { data: samples } = await supabase.from('submissions').select('team_id, round_id').limit(3)

        console.log('Teams:', teamCount, te || '')
        console.log('Submissions:', subCount, se || '')
        console.log('Samples:', samples)

    } catch (e) {
        console.error(e)
    }
}

test()
