import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 환경 변수 확인
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
}
if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined')
}

// 클라이언트용 (브라우저)
// Public 뷰를 통해 3dviewer 스키마의 테이블에 접근
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'public' }
})

// 서버용 클라이언트 생성 함수 (SERVICE_ROLE_KEY가 있을 때만)
// Public 뷰를 통해 3dviewer 스키마의 테이블에 접근
export function createServerClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('createServerClient - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음')
  
  if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not defined')
    return null
  }

  console.log('createServerClient - 서버 클라이언트 생성 성공')
  return createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'public' },  // Public 뷰 사용 (3dviewer 스키마 접근)
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// 서버 액션용 (SERVICE_ROLE_KEY 사용) - 서버에서만 사용
export const supabaseServer = typeof window === 'undefined' ? createServerClient() : null
