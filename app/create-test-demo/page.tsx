import { supabaseServer } from '@/lib/supabase'
import { generateAccessCode } from '@/lib/utils'

export default async function CreateTestDemoPage() {
  if (!supabaseServer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">서버 설정 오류</h1>
          <p className="text-gray-600 mb-6">SERVICE_ROLE_KEY가 설정되지 않았습니다.</p>
        </div>
      </div>
    )
  }

  try {
    // 1. 기존 모델 확인
    const { data: models, error: modelsError } = await supabaseServer
      .from('models')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    // 2. 테스트용 모델이 없으면 생성
    let testModel = null
    if (!models || models.length === 0) {
      // 테스트용 모델 생성
      const { data: newModel, error: modelError } = await supabaseServer
        .from('models')
        .insert({
          name: 'Test Model',
          storage_path: 'test-models/test.glb',
          file_size: 1024,
          is_draco_compressed: false,
          is_ktx2: false
        })
        .select()
        .single()

      if (modelError) {
        throw new Error(`모델 생성 오류: ${modelError.message}`)
      }
      testModel = newModel
    } else {
      testModel = models[0]
    }

    // 3. 테스트용 데모 생성
    const accessCode = 'LEIH0APK' // 고정 코드 사용
    const { data: demo, error: demoError } = await supabaseServer
      .from('demos')
      .insert({
        access_code: accessCode,
        model_id: testModel.id,
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30일 후
      })
      .select()
      .single()

    if (demoError) {
      // 이미 존재하는 경우 업데이트
      const { data: existingDemo, error: updateError } = await supabaseServer
        .from('demos')
        .update({
          model_id: testModel.id,
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('access_code', accessCode)
        .select()
        .single()

      if (updateError) {
        throw new Error(`데모 업데이트 오류: ${updateError.message}`)
      }
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">테스트 데모 생성 완료</h1>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-green-800 text-sm">
              ✅ 접속 코드: <span className="font-mono font-bold">{accessCode}</span>
            </p>
            <p className="text-green-800 text-sm">
              ✅ 모델: {testModel.name}
            </p>
            <p className="text-green-800 text-sm">
              ✅ 경로: {testModel.storage_path}
            </p>
          </div>
          <div className="space-x-4">
            <a href={`/${accessCode}`} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              데모 보기
            </a>
            <a href="/debug-demo" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700">
              디버깅 페이지
            </a>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('테스트 데모 생성 오류:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-red-800 text-sm">오류: {error instanceof Error ? error.message : '알 수 없는 오류'}</p>
          </div>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    )
  }
}
