import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 임시로 하드코딩된 SERVICE_ROLE_KEY (테스트용)
// 실제 키로 교체해주세요
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Z29id2VsZ2RoZHN0dGtwcWl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM1NTQ5MSwiZXhwIjoyMDc2OTMxNDkxfQ.example'

// 클라이언트용 (브라우저)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버용 (관리자 권한)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 서버 액션용 (SERVICE_ROLE_KEY 사용)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

