'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 현재 경로가 로그인 페이지인지 확인
    const isLoginPage = window.location.pathname === '/admin/login'
    
    // 로그인 페이지인 경우 레이아웃 체크를 건너뛰고 바로 렌더링
    if (isLoginPage) {
      setLoading(false)
      return
    }

    // 현재 세션 확인
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        // 로그인되지 않은 경우 로그인 페이지로 리디렉션
        if (!session) {
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('세션 확인 오류:', error)
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/admin/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  // 로그인 페이지인 경우 레이아웃 없이 바로 렌더링
  if (window.location.pathname === '/admin/login') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 사용자가 없으면 로딩 화면 표시 (리디렉션 중)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                3Dviewer 관리자
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 truncate max-w-32 sm:max-w-none">
                {user.email}
              </span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/admin/login')
                }}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
