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
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 없음')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ 설정됨' : '❌ 없음')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestAdmin() {
  try {
    console.log('🔐 테스트 어드민 계정 생성 중...')
    
    // 기존 계정이 있는지 확인
    const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserByEmail('test@uslab.ai')
    
    if (existingUser.user) {
      console.log('⚠️  test@uslab.ai 계정이 이미 존재합니다.')
      console.log('계정 ID:', existingUser.user.id)
      return
    }
    
    // 새 계정 생성
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@uslab.ai',
      password: 'test321',
      email_confirm: true
    })
    
    if (error) {
      console.error('❌ 계정 생성 실패:', error.message)
      return
    }
    
    console.log('✅ 테스트 어드민 계정이 성공적으로 생성되었습니다!')
    console.log('📧 이메일:', data.user.email)
    console.log('🆔 사용자 ID:', data.user.id)
    console.log('🔑 비밀번호: test321')
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
  }
}

createTestAdmin()
