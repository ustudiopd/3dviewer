'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [accessCode, setAccessCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessCode.trim()) return

    setIsLoading(true)
    try {
      // 8자리 코드 검증
      if (accessCode.length !== 8) {
        alert('8자리 코드를 입력해주세요.')
        return
      }

      // 해당 코드로 리디렉션
      router.push(`/${accessCode.toUpperCase()}`)
    } catch (error) {
      console.error('접속 오류:', error)
      alert('접속 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-black/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/10">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-wide">
              3Dviewer
            </h1>
            <p className="text-sm sm:text-base text-gray-300">
              3D 모델을 안전하게 시연하는 뷰어 시스템
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-300 mb-2">
                접속 코드
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="8자리 코드를 입력하세요"
                maxLength={8}
                className="w-full px-3 sm:px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-center text-base sm:text-lg font-mono tracking-widest text-white placeholder-gray-400 backdrop-blur-sm"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || accessCode.length !== 8}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-cyan-700 hover:to-blue-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
            >
              {isLoading ? '접속 중...' : '3D 뷰어 접속'}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-400">
              관리자 접속: 
              <a href="/admin/login" className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors ml-1">
                관리자 로그인
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

