import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

// Next.js App Router에서는 bodyParser 설정이 필요 없습니다
// FormData는 자동으로 처리됩니다

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string

    if (!file || !name) {
      return NextResponse.json(
        { error: '파일과 이름이 필요합니다.' },
        { status: 400 }
      )
    }

    if (!supabaseServer) {
      return NextResponse.json(
        { error: '서버 설정 오류' },
        { status: 500 }
      )
    }
    
    const supabase = supabaseServer

    // 파일명 생성
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `models/${fileName}`

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Supabase Storage 업로드
    const { data, error } = await supabase.storage
      .from('glb-models-private')
      .upload(filePath, buffer, {
        contentType: 'model/gltf-binary',
        upsert: false,
      })

    if (error) {
      console.error('업로드 오류:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // 모델 정보를 데이터베이스에 저장 (RPC 함수 사용)
    const { data: modelId, error: rpcError } = await supabase.rpc('insert_model', {
      p_name: name,
      p_storage_path: filePath,
      p_file_size_bytes: file.size,
      p_is_draco_compressed: false,
      p_is_ktx2: false,
    })

    if (rpcError) {
      console.error('모델 정보 저장 오류:', rpcError)
      return NextResponse.json(
        { error: '모델 정보 저장 실패: ' + rpcError.message },
        { status: 500 }
      )
    }

    // RPC 함수가 성공하면 모델이 생성된 것이므로 추가 확인 불필요
    // Service Role을 사용하여 모델 정보 조회 (RLS 우회)
    const { data: modelData, error: dbError } = await supabase
      .from('models')
      .select('*')
      .eq('id', modelId)
      .single()

    if (dbError) {
      // Service Role을 사용하므로 오류가 발생하면 문제가 있는 것
      console.error('모델 정보 조회 오류:', dbError)
      return NextResponse.json(
        { error: '모델 정보 조회 실패: ' + dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      model: modelData,
    })
  } catch (error: any) {
    console.error('업로드 예외:', error)
    return NextResponse.json(
      { error: error.message || '업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

