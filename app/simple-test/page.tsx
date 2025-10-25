'use client'

import { useEffect, useState } from 'react'

export default function SimpleTestPage() {
  const [status, setStatus] = useState('테스트 중...')

  useEffect(() => {
    // API를 통해 서버 사이드 환경 변수 확인
    fetch('/api/env-check')
      .then(res => res.json())
      .then(data => {
        const hasServiceKey = !!data.SUPABASE_SERVICE_ROLE_KEY
        setStatus(hasServiceKey ? '✅ SERVICE_ROLE_KEY 정상 로드됨' : '❌ SERVICE_ROLE_KEY 로드 실패')
      })
      .catch(err => {
        setStatus(`❌ API 호출 실패: ${err.message}`)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">간단 테스트</h1>
        
        <div className="mb-6">
          <p className="text-lg">{status}</p>
        </div>

        <div className="space-y-4">
          <a 
            href="/admin/login" 
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            관리자 로그인 테스트
          </a>
          
          <a 
            href="/" 
            className="block w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  )
}

