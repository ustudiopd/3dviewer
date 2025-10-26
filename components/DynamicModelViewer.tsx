'use client'

import { useEffect, useRef, useState } from 'react'

interface DynamicModelViewerProps {
  src: string
  isDraco: boolean
  isKtx2: boolean
  modelName: string
  demoId?: string
  accessCode?: string
  backgroundColor?: 'black'
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any
    }
  }
}

export default function DynamicModelViewer({ 
  src, 
  isDraco, 
  isKtx2, 
  modelName,
  demoId,
  accessCode,
  backgroundColor = 'black'
}: DynamicModelViewerProps) {
  const modelViewerRef = useRef<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStatus, setLoadingStatus] = useState('초기화 중...')
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(false)

  // 접속 로그 수집 함수
  const logAccess = async () => {
    if (!demoId || !accessCode) return

    try {
      // API 엔드포인트로 접속 로그 전송
      const response = await fetch('/api/log-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demoId,
          accessCode,
          userAgent: navigator.userAgent
        })
      })

      if (response.ok) {
        console.log('접속 로그 저장 완료')
      } else {
        console.error('접속 로그 저장 실패:', response.status)
      }
    } catch (error) {
      console.error('접속 로그 저장 오류:', error)
    }
  }

  useEffect(() => {
    // model-viewer 웹 컴포넌트 로드
    if (typeof window !== 'undefined' && !customElements.get('model-viewer')) {
      import('@google/model-viewer').then(() => {
        console.log('Model-viewer loaded successfully')
      }).catch((error) => {
        console.error('Failed to load model-viewer:', error)
      })
    }

    // 접속 로그 수집
    logAccess()
  }, [])

  useEffect(() => {
    if (!modelViewerRef.current) return

    const modelViewer = modelViewerRef.current

    const handleProgress = (event: any) => {
      const progress = event.detail.totalProgress * 100
      setLoadingProgress(Math.round(progress))
      
      if (progress < 20) {
        setLoadingStatus('모델 파일 다운로드 중...')
      } else if (progress < 50) {
        setLoadingStatus('3D 데이터 파싱 중...')
      } else if (progress < 80) {
        setLoadingStatus('텍스처 로딩 중...')
      } else if (progress < 95) {
        setLoadingStatus('렌더링 준비 중...')
      } else {
        setLoadingStatus('로딩 완료!')
      }
    }

    const handleLoad = () => {
      console.log('3D 모델 로드 완료')
      setLoadingProgress(100)
      setLoadingStatus('로딩 완료!')
      setIsLoading(false)
    }

    const handleError = (event: any) => {
      console.error('3D 모델 로드 오류:', event.detail)
      setLoadingStatus('로딩 오류 발생')
      setIsLoading(false)
    }

    // 이벤트 리스너 등록
    modelViewer.addEventListener('progress', handleProgress)
    modelViewer.addEventListener('load', handleLoad)
    modelViewer.addEventListener('error', handleError)

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      modelViewer.removeEventListener('progress', handleProgress)
      modelViewer.removeEventListener('load', handleLoad)
      modelViewer.removeEventListener('error', handleError)
    }
  }, [src])

  // 배경색 설정 - Babylon.js Sandbox 스타일 그라데이션
  const getBackgroundStyle = () => {
    return 'linear-gradient(135deg, #a8abb0 0%, #3a3d40 100%)' // Babylon.js Sandbox 스타일
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative',
      background: getBackgroundStyle()
    }}>
        {/* 작은 헤더 버튼들 - 상단 왼쪽 */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {/* 모델명 버튼 - 클릭 가능 */}
          <div 
            onClick={() => setShowControls(!showControls)}
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              padding: '8px 12px',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              maxWidth: '200px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <h1 style={{ 
              margin: 0, 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#ffffff',
              letterSpacing: '0.3px',
              lineHeight: '1.2',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {modelName}
            </h1>
            <p style={{ 
              margin: '2px 0 0 0', 
              fontSize: '10px', 
              color: '#b0b0b0',
              fontWeight: '400'
            }}>
              3Dviewer
            </p>
          </div>

          {/* 홈 버튼 */}
          <a 
            href="/" 
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '12px',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            ← 홈
          </a>
        </div>

        {/* 조작 방법 툴팁 - 클릭으로 토글 */}
        {showControls && (
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '10px',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(15px)',
            padding: '8px 12px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            fontSize: '11px',
            border: '1px solid rgba(255,255,255,0.2)',
            opacity: 1,
            transform: 'translateY(0)',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto'
          }}>
            <div style={{ 
              fontWeight: '600', 
              marginBottom: '4px', 
              color: '#ffffff',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>🎮 조작 방법</span>
              <button
                onClick={() => setShowControls(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '8px'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              fontSize: '10px'
            }}>
              <span style={{ color: '#e0e0e0' }}>
                <strong style={{ color: '#ffffff' }}>드래그:</strong> 회전
              </span>
              <span style={{ color: '#e0e0e0' }}>
                <strong style={{ color: '#ffffff' }}>휠:</strong> 확대/축소
              </span>
              <span style={{ color: '#e0e0e0' }}>
                <strong style={{ color: '#ffffff' }}>우클릭:</strong> 이동
              </span>
            </div>
          </div>
        )}

      {/* 로딩 진행률 표시 */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(15px)',
          color: 'white',
          padding: '30px 40px',
          borderRadius: '16px',
          fontSize: '18px',
          fontWeight: '600',
          zIndex: 100,
          textAlign: 'center',
          minWidth: '350px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ 
            marginBottom: '20px', 
            fontSize: '20px',
            letterSpacing: '0.5px'
          }}>
            🔄 3D 모델 로딩 중
          </div>
          <div style={{ 
            marginBottom: '15px', 
            fontSize: '16px',
            color: '#e0e0e0',
            fontWeight: '400'
          }}>
            {loadingStatus}
          </div>
          
          {/* 진행률 바 */}
          <div style={{
            width: '100%',
            height: '10px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            marginBottom: '15px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              width: `${loadingProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00d4ff, #0099cc)',
              borderRadius: '8px',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
            }} />
          </div>
          
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#00d4ff'
          }}>
            {loadingProgress}%
          </div>
        </div>
      )}

      {/* model-viewer 컴포넌트 - 바닥 반사 효과 강화 */}
      <model-viewer
        ref={modelViewerRef}
        src={src}
        alt={modelName}
        camera-controls
        // 🔥 강화된 광원 효과 설정
        shadow-intensity="2.0"           // 그림자 강도 2배 증가
        exposure="2.5"                    // 노출값 대폭 증가 (1.5 → 2.5)
        shadow-softness="0.3"             // 그림자 부드러움 조정
        // 🌟 바닥 반사 효과 강화
        skybox-image=""                   // 스카이박스 비활성화
        tone-mapping=""                   // 톤 매핑 비활성화
        // 반사 효과를 위한 추가 속성
        min-camera-orbit="auto auto auto"
        max-camera-orbit="auto auto auto"
        // 바닥 반사를 위한 환경 설정
        environment-intensity="2.0"       // 환경 조명 강도 증가
        // 🌟 강력한 반사 효과를 위한 HDR 환경 맵
        environment-image="https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr"
        // 아이폰 최적화 설정
        touch-action="pan-y"
        interaction-policy="allow-when-focused"
        auto-rotate-delay="0"
        orientation-permission="deny"
        draco-decoder-path="https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
        ktx2-decoder-path="https://cdn.jsdelivr.net/npm/three@0.150.0/examples/jsm/libs/basis/"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent' // 그라데이션 배경이 보이도록 투명하게
        }}
      />
    </div>
  )
}