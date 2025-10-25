'use client'

export default function EnvTestPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">환경 변수 확인</h1>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">NEXT_PUBLIC_SUPABASE_URL</h3>
            <p className="text-sm text-gray-600 break-all">
              {supabaseUrl || '❌ 설정되지 않음'}
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">NEXT_PUBLIC_SUPABASE_ANON_KEY</h3>
            <p className="text-sm text-gray-600 break-all">
              {supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ 설정되지 않음'}
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">SUPABASE_SERVICE_ROLE_KEY</h3>
            <p className="text-sm text-gray-600 break-all">
              {serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}...` : '❌ 설정되지 않음'}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">설정 방법:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. 프로젝트 루트에 <code className="bg-blue-100 px-1 rounded">.env.local</code> 파일 생성</li>
            <li>2. 위의 환경 변수들을 복사하여 붙여넣기</li>
            <li>3. <code className="bg-blue-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>는 Supabase 대시보드에서 가져오기</li>
            <li>4. 개발 서버 재시작</li>
          </ol>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-blue-600 hover:underline">홈으로 돌아가기</a>
        </div>
      </div>
    </div>
  )
}

