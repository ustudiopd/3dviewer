'use client'

import { useEffect, useState } from 'react'

export default function EnvDebugPage() {
  const [envVars, setEnvVars] = useState<any>({})
  const [serverEnvVars, setServerEnvVars] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 클라이언트 사이드 환경 변수 (NEXT_PUBLIC_ 접두사만)
    setEnvVars({
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
      'NODE_ENV': process.env.NODE_ENV,
    })

    // 서버 사이드 환경 변수 확인을 위한 API 호출
    fetch('/api/env-check')
      .then(res => res.json())
      .then(data => {
        setServerEnvVars(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('API 호출 오류:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">환경 변수 디버깅</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 클라이언트 사이드 */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-4">클라이언트 사이드</h3>
            <div className="space-y-2">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium">{key}:</span>
                  <span className={`ml-2 ${value ? 'text-green-600' : 'text-red-600'}`}>
                    {value ? '✅ 설정됨' : '❌ 없음'}
                  </span>
                  {value && key.includes('KEY') && (
                    <div className="text-xs text-gray-500 mt-1">
                      {String(value).substring(0, 30)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 서버 사이드 */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-4">서버 사이드</h3>
            <div className="space-y-2">
              {loading ? (
                <div className="text-sm text-gray-500">서버 환경 변수 로딩 중...</div>
              ) : Object.keys(serverEnvVars).length > 0 ? (
                Object.entries(serverEnvVars).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key}:</span>
                    <span className={`ml-2 ${value ? 'text-green-600' : 'text-red-600'}`}>
                      {value ? '✅ 설정됨' : '❌ 없음'}
                    </span>
                    {value && key.includes('KEY') && (
                      <div className="text-xs text-gray-500 mt-1">
                        {String(value).substring(0, 30)}...
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-red-500">서버 환경 변수 로드 실패</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">문제 해결 방법:</h4>
          <ol className="text-sm text-yellow-800 space-y-1">
            <li>1. <code className="bg-yellow-100 px-1 rounded">.env.local</code> 파일에서 빈 줄이나 특수문자 제거</li>
            <li>2. 파일을 UTF-8 인코딩으로 저장</li>
            <li>3. 개발 서버 완전 재시작 (Ctrl+C 후 npm run dev)</li>
            <li>4. 브라우저 캐시 클리어 (Ctrl+Shift+R)</li>
            <li>5. <code className="bg-yellow-100 px-1 rounded">.next</code> 폴더 삭제 후 재시작</li>
          </ol>
        </div>

        <div className="mt-4 text-center space-x-4">
          <a href="/" className="text-blue-600 hover:underline">홈으로</a>
          <a href="/admin/login" className="text-blue-600 hover:underline">관리자 로그인</a>
        </div>
      </div>
    </div>
  )
}
