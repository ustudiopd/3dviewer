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

async function createAdminAccount(email, password) {
  try {
    // 기존 계정이 있는지 확인 (listUsers로 확인)
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (!listError && users) {
      const existingUser = users.users.find(u => u.email === email)
      if (existingUser) {
        console.log(`⚠️  ${email} 계정이 이미 존재합니다.`)
        console.log('계정 ID:', existingUser.id)
        return { exists: true, user: existingUser }
      }
    }
    
    // 새 계정 생성
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })
    
    if (error) {
      console.error(`❌ ${email} 계정 생성 실패:`, error.message)
      return { success: false, error }
    }
    
    console.log(`✅ ${email} 계정이 성공적으로 생성되었습니다!`)
    console.log('📧 이메일:', data.user.email)
    console.log('🆔 사용자 ID:', data.user.id)
    console.log(`🔑 비밀번호: ${password}`)
    return { success: true, user: data.user }
    
  } catch (error) {
    console.error(`❌ ${email} 계정 생성 중 오류 발생:`, error.message)
    return { success: false, error }
  }
}

async function createTestAdmin() {
  console.log('🔐 관리자 계정 생성 중...\n')
  
  // test@uslab.ai 계정 생성
  console.log('1️⃣ test@uslab.ai 계정 생성 중...')
  await createAdminAccount('test@uslab.ai', 'test321')
  
  console.log('\n2️⃣ admin@admin.com 계정 생성 중...')
  await createAdminAccount('admin@admin.com', 'admin123')
  
  console.log('\n✅ 모든 관리자 계정 생성 완료!')
}

createTestAdmin()
