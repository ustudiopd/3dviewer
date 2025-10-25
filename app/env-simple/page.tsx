'use client'

import { useEffect, useState } from 'react'

export default function EnvSimplePage() {
  const [serverEnv, setServerEnv] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/env-check')
      .then(res => res.json())
      .then(data => {
        setServerEnv(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('API 호출 오류:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">환경 변수 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">환경 변수 상태</h1>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">서버 환경 변수</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">SUPABASE_SERVICE_ROLE_KEY:</span>
                <span className={`text-sm font-medium ${serverEnv?.SUPABASE_SERVICE_ROLE_KEY ? 'text-green-600' : 'text-red-600'}`}>
                  {serverEnv?.SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 없음'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_URL:</span>
                <span className={`text-sm font-medium ${serverEnv?.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}`}>
                  {serverEnv?.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <span className={`text-sm font-medium ${serverEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}`}>
                  {serverEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'}
                </span>
              </div>
            </div>
          </div>

          {serverEnv?.SUPABASE_SERVICE_ROLE_KEY ? (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 text-sm">
                ✅ 모든 환경 변수가 정상적으로 설정되었습니다!
              </p>
            </div>
          ) : (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-800 text-sm">
                ❌ SERVICE_ROLE_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center space-x-4">
          <a href="/admin/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            관리자 로그인
          </a>
          <a href="/" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            홈으로
          </a>
        </div>
      </div>
    </div>
  )
}
