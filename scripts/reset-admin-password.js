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

async function resetPassword(email, newPassword) {
  try {
    console.log(`🔐 ${email} 계정의 비밀번호 재설정 중...\n`)
    
    // 사용자 찾기
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ 사용자 목록 조회 실패:', listError.message)
      return
    }
    
    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      console.error(`❌ ${email} 계정을 찾을 수 없습니다.`)
      return
    }
    
    console.log(`✅ 사용자 찾음: ${user.email} (ID: ${user.id})`)
    
    // 비밀번호 업데이트
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )
    
    if (error) {
      console.error('❌ 비밀번호 재설정 실패:', error.message)
      return
    }
    
    console.log('✅ 비밀번호가 성공적으로 재설정되었습니다!')
    console.log(`📧 이메일: ${data.user.email}`)
    console.log(`🔑 새 비밀번호: ${newPassword}`)
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
  }
}

// 명령줄 인자로 이메일과 비밀번호 받기
const email = process.argv[2] || 'admin@admin.com'
const password = process.argv[3] || 'admin123'

resetPassword(email, password)

