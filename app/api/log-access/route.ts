import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { demoId, accessCode, userAgent } = await request.json()

    if (!demoId || !accessCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Supabase service role key not configured' }, { status: 500 })
    }

    // 클라이언트 IP 주소 추출
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown'

    // 접속 로그 저장
    const { error } = await supabaseServer
      .from('access_logs')
      .insert({
        demo_id: demoId,
        access_code: accessCode,
        user_ip: clientIp,
        user_agent: userAgent,
        accessed_at: new Date().toISOString()
      })

    if (error) {
      console.error('접속 로그 저장 오류:', error)
      return NextResponse.json({ error: 'Failed to save access log' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
