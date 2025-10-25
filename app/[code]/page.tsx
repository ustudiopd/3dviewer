import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { isExpired } from '@/lib/utils'

// DynamicModelViewer를 동적으로 로드 (SSR 비활성화)
const DynamicModelViewer = dynamic(() => import('@/components/DynamicModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">3D 뷰어를 로딩 중...</p>
      </div>
    </div>
  )
})

interface PageProps {
  params: {
    code: string
  }
}

export default async function ModelViewerPage({ params }: PageProps) {
  const { code } = params

  // favicon.ico 요청 필터링 (대소문자 구분 없이)
  if (code.toLowerCase() === 'favicon.ico') {
    return null
  }

  // 8자리 코드가 아닌 경우 필터링
  if (code.length !== 8) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">잘못된 접속 코드</h1>
          <p className="text-gray-600 mb-6">8자리 코드를 입력해주세요.</p>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    )
  }

  // SERVICE_ROLE_KEY 확인
  if (!supabaseServer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">서버 설정 오류</h1>
          <p className="text-gray-600 mb-6">SERVICE_ROLE_KEY가 설정되지 않았습니다.</p>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    )
  }

  try {
    console.log('데모 조회 시작 - 코드:', code.toUpperCase())
    
    // 데모 정보 조회
    const { data: demo, error: demoError } = await supabaseServer
      .from('demos')
      .select(`
        *,
        model:models(*)
      `)
      .eq('access_code', code.toUpperCase())
      .single()

    console.log('데모 조회 결과:', { demo, demoError })

    if (demoError || !demo) {
      console.error('데모 조회 오류:', demoError)
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">접속 코드를 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-2">코드: {code.toUpperCase()}</p>
            <p className="text-gray-600 mb-6">올바른 8자리 코드를 입력해주세요.</p>
            {demoError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
                <p className="text-red-800 text-sm">오류: {demoError.message}</p>
              </div>
            )}
            <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      )
    }

    // 데모 활성화 상태 확인
    if (!demo.is_active) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">비활성화된 데모입니다</h1>
            <p className="text-gray-600 mb-6">이 데모는 현재 비활성화 상태입니다.</p>
            <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      )
    }

    // 만료일 확인
    if (isExpired(demo.expires_at)) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">만료된 데모입니다</h1>
            <p className="text-gray-600 mb-6">이 데모는 만료되었습니다.</p>
            <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      )
    }

    // 모델 정보 확인
    if (!demo.model) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">모델을 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-6">연결된 3D 모델이 존재하지 않습니다.</p>
            <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      )
    }

      // Signed URL 생성 (1시간 유효)
      console.log('Signed URL 생성 시작 - 경로:', demo.model.storage_path)
      const { data: signedUrlData, error: urlError } = await supabaseServer.storage
        .from('glb-models-private')
        .createSignedUrl(demo.model.storage_path, 3600) // 1시간

    console.log('Signed URL 생성 결과:', { signedUrlData, urlError })

    if (urlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL 생성 오류:', urlError)
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">모델 로딩 오류</h1>
            <p className="text-gray-600 mb-2">모델 경로: {demo.model.storage_path}</p>
            <p className="text-gray-600 mb-6">3D 모델을 불러올 수 없습니다.</p>
            {urlError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
                <p className="text-red-800 text-sm">오류: {urlError.message}</p>
              </div>
            )}
            <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      )
    }

    // 접근 통계 업데이트
    await supabaseServer
      .from('demos')
      .update({
        access_count: demo.access_count + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', demo.id)

    // 접속 로그 수집 (클라이언트에서 실행)
    console.log('접속 로그 수집 시작')

    return (
      <DynamicModelViewer
        src={signedUrlData.signedUrl}
        isDraco={demo.model.is_draco_compressed}
        isKtx2={demo.model.is_ktx2}
        modelName={demo.model.name}
        demoId={demo.id}
        accessCode={demo.access_code}
      />
    )
  } catch (error) {
    console.error('뷰어 로딩 오류:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-6">잠시 후 다시 시도해주세요.</p>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    )
  }
}
