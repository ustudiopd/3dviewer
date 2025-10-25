'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 현재 세션 확인
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // 로그인된 경우 대시보드로 이동
          router.replace('/admin/dashboard')
        } else {
          // 로그인되지 않은 경우 로그인 페이지로 이동
          router.replace('/admin/login')
        }
      } catch (error) {
        console.error('인증 확인 오류:', error)
        // 오류 발생 시 로그인 페이지로 이동
        router.replace('/admin/login')
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  return null
}

