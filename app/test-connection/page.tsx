'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnectionPage() {
  const [status, setStatus] = useState('테스트 중...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // 간단한 연결 테스트
        const { data, error } = await supabase
          .from('models')
          .select('id')
          .limit(1)

        if (error) {
          setError(`연결 오류: ${error.message}`)
          setStatus('❌ 연결 실패')
        } else {
          setStatus('✅ 연결 성공')
        }
      } catch (err: any) {
        setError(`오류: ${err.message}`)
        setStatus('❌ 연결 실패')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Supabase 연결 테스트</h1>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">연결 상태</h3>
            <p className="text-lg">{status}</p>
          </div>
          
          {error && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-700 mb-2">오류 메시지</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">다음 단계</h3>
            <div className="text-sm space-y-2">
              <p>1. 연결이 성공하면 → <a href="/admin/login" className="text-blue-600 hover:underline">관리자 로그인</a></p>
              <p>2. 연결이 실패하면 → <a href="/fix-env" className="text-blue-600 hover:underline">환경 변수 수정</a></p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:underline">홈으로 돌아가기</a>
        </div>
      </div>
    </div>
  )
}

