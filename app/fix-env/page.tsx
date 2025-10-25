'use client'

import { useState } from 'react'

export default function FixEnvPage() {
  const [showSolution, setShowSolution] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">SERVICE_ROLE_KEY 문제 해결</h1>
        
        <div className="space-y-4">
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <h3 className="font-semibold text-red-700 mb-2">현재 상태</h3>
            <p className="text-red-600">SERVICE_ROLE_KEY가 환경 변수에서 읽히지 않음</p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">가능한 원인들</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• .env.local 파일에 공백이나 특수문자가 포함됨</li>
              <li>• 파일 인코딩 문제 (UTF-8이어야 함)</li>
              <li>• 환경 변수 이름 오타</li>
              <li>• Next.js 캐시 문제</li>
            </ul>
          </div>

          <button
            onClick={() => setShowSolution(!showSolution)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            {showSolution ? '해결 방법 숨기기' : '해결 방법 보기'}
          </button>

          {showSolution && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-700 mb-2">해결 방법</h3>
              <div className="text-sm text-green-600 space-y-2">
                <p><strong>1. .env.local 파일 완전 재작성:</strong></p>
                <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                  NEXT_PUBLIC_SUPABASE_URL=https://rzgobwelgdhdsttkpqiw.supabase.co<br/>
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...<br/>
                  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                </div>
                
                <p><strong>2. 파일 저장 후:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• 개발 서버 완전 중지 (Ctrl+C)</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">npm run dev</code> 재실행</li>
                  <li>• 브라우저 캐시 클리어 (Ctrl+Shift+R)</li>
                </ul>

                <p><strong>3. 임시 해결책 (테스트용):</strong></p>
                <p className="text-xs">lib/supabase.ts에서 하드코딩으로 테스트</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center space-x-4">
          <a href="/debug-env" className="text-blue-600 hover:underline">환경 변수 재확인</a>
          <a href="/" className="text-blue-600 hover:underline">홈으로</a>
        </div>
      </div>
    </div>
  )
}

