import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const demoId = searchParams.get('demoId')

    if (!demoId) {
      return NextResponse.json({ error: 'demoId is required' }, { status: 400 })
    }

    // 접속 로그 조회
    const { data, error } = await supabaseServer
      .from('access_logs')
      .select('*')
      .eq('demo_id', demoId)
      .order('accessed_at', { ascending: false })

    if (error) {
      console.error('접속 로그 조회 오류:', error)
      return NextResponse.json({ error: 'Failed to fetch access logs' }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
