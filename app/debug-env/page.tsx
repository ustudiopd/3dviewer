'use client'

export default function DebugEnvPage() {
  // 모든 환경 변수 확인
  const allEnvVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'NODE_ENV': process.env.NODE_ENV,
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">환경 변수 디버깅</h1>
        
        <div className="space-y-4">
          {Object.entries(allEnvVars).map(([key, value]) => (
            <div key={key} className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">{key}</h3>
              <div className="text-sm">
                <p className="text-gray-600 mb-1">
                  상태: {value ? '✅ 설정됨' : '❌ 없음'}
                </p>
                {value && (
                  <p className="text-gray-500 break-all">
                    값: {key.includes('KEY') ? `${value.substring(0, 20)}...` : value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">해결 방법:</h4>
          <ol className="text-sm text-yellow-800 space-y-1">
            <li>1. <code className="bg-yellow-100 px-1 rounded">.env.local</code> 파일에서 <code className="bg-yellow-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> 앞뒤에 공백이 없는지 확인</li>
            <li>2. 따옴표 없이 직접 값을 입력했는지 확인</li>
            <li>3. 파일 인코딩이 UTF-8인지 확인</li>
            <li>4. 개발 서버를 완전히 중지하고 재시작</li>
            <li>5. 브라우저 캐시 클리어 (Ctrl+Shift+R)</li>
          </ol>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-blue-600 hover:underline">홈으로 돌아가기</a>
        </div>
      </div>
    </div>
  )
}

