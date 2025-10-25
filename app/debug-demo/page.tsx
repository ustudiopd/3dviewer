import { supabaseServer } from '@/lib/supabase'

export default async function DebugDemoPage() {
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
    // 모든 데모 조회
    const { data: demos, error: demosError } = await supabaseServer
      .from('demos')
      .select(`
        *,
        model:models(*)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // 모든 모델 조회
    const { data: models, error: modelsError } = await supabaseServer
      .from('models')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">데모 디버깅</h1>
          
          {/* 데모 목록 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">최근 데모 (최대 10개)</h2>
            {demosError ? (
              <div className="text-red-600">
                <p>데모 조회 오류: {demosError.message}</p>
              </div>
            ) : demos && demos.length > 0 ? (
              <div className="space-y-4">
                {demos.map((demo) => (
                  <div key={demo.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">ID: {demo.id}</p>
                        <p className="font-medium">접속 코드: {demo.access_code}</p>
                        <p className="text-sm text-gray-600">활성화: {demo.is_active ? '✅' : '❌'}</p>
                        <p className="text-sm text-gray-600">만료일: {demo.expires_at}</p>
                        <p className="text-sm text-gray-600">접근 횟수: {demo.access_count}</p>
                      </div>
                      <div>
                        {demo.model ? (
                          <div>
                            <p className="font-medium">모델: {demo.model.name}</p>
                            <p className="text-sm text-gray-600">경로: {demo.model.storage_path}</p>
                            <p className="text-sm text-gray-600">크기: {demo.model.file_size} bytes</p>
                          </div>
                        ) : (
                          <p className="text-red-600">연결된 모델 없음</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">데모가 없습니다.</p>
            )}
          </div>

          {/* 모델 목록 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">최근 모델 (최대 10개)</h2>
            {modelsError ? (
              <div className="text-red-600">
                <p>모델 조회 오류: {modelsError.message}</p>
              </div>
            ) : models && models.length > 0 ? (
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">ID: {model.id}</p>
                        <p className="font-medium">이름: {model.name}</p>
                        <p className="text-sm text-gray-600">경로: {model.storage_path}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">크기: {model.file_size} bytes</p>
                        <p className="text-sm text-gray-600">Draco: {model.is_draco_compressed ? '✅' : '❌'}</p>
                        <p className="text-sm text-gray-600">KTX2: {model.is_ktx2 ? '✅' : '❌'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">모델이 없습니다.</p>
            )}
          </div>

          <div className="mt-8 text-center">
            <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('디버깅 페이지 오류:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-6">디버깅 페이지를 로드할 수 없습니다.</p>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    )
  }
}
