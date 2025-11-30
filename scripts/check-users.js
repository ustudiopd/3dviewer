const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// .env.local 파일에서 환경변수 읽기
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envLines = envContent.split('\n')
    
    envLines.forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    })
  }
}

loadEnvFile()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
  try {
    console.log('👥 등록된 사용자 확인 중...\n')
    
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ 사용자 목록 조회 실패:', error.message)
      return
    }
    
    if (!data || data.users.length === 0) {
      console.log('⚠️  등록된 사용자가 없습니다.')
      return
    }
    
    console.log(`✅ 총 ${data.users.length}명의 사용자가 등록되어 있습니다:\n`)
    
    data.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   생성일: ${user.created_at}`)
      console.log(`   이메일 확인: ${user.email_confirmed_at ? '✅ 확인됨' : '❌ 미확인'}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
  }
}

checkUsers()

