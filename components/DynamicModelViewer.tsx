'use client'

import { useEffect, useRef, useState } from 'react'

interface DynamicModelViewerProps {
  src: string
  isDraco: boolean
  isKtx2: boolean
  modelName: string
  demoId?: string
  accessCode?: string
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
  accessCode
}: DynamicModelViewerProps) {
  const modelViewerRef = useRef<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStatus, setLoadingStatus] = useState('초기화 중...')
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
    }}>
        {/* 모델명 표시 - 모바일 최적화 */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#ffffff',
            letterSpacing: '0.5px',
            lineHeight: '1.2'
          }}>
            {modelName}
          </h1>
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '12px', 
            color: '#b0b0b0',
            fontWeight: '400'
          }}>
            3Dviewer
          </p>
        </div>

        {/* 홈 버튼 - 모바일 최적화 */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10
        }}>
          <a 
            href="/" 
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'block',
              fontWeight: '500',
              fontSize: '12px',
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
            ← 홈
          </a>
        </div>

        {/* 조작 방법 툴팁 - 모바일 최적화 */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          right: '10px',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          fontSize: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ 
            fontWeight: '600', 
            marginBottom: '8px', 
            color: '#ffffff',
            fontSize: '14px',
            letterSpacing: '0.5px'
          }}>
            🎮 조작 방법
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px',
            fontSize: '11px'
          }}>
            <div style={{ color: '#e0e0e0', lineHeight: '1.4' }}>
              <strong style={{ color: '#ffffff' }}>🖱️ 드래그:</strong> 회전
            </div>
            <div style={{ color: '#e0e0e0', lineHeight: '1.4' }}>
              <strong style={{ color: '#ffffff' }}>🔄 휠:</strong> 확대/축소
            </div>
            <div style={{ color: '#e0e0e0', lineHeight: '1.4' }}>
              <strong style={{ color: '#ffffff' }}>🖱️ 우클릭:</strong> 이동
            </div>
            <div style={{ color: '#e0e0e0', lineHeight: '1.4' }}>
              <strong style={{ color: '#ffffff' }}>📱 터치:</strong> 핀치 줌
            </div>
          </div>
        </div>

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

      {/* model-viewer 컴포넌트 - HTML 파일과 동일 */}
      <model-viewer
        ref={modelViewerRef}
        src={src}
        alt={modelName}
        camera-controls
        shadow-intensity="1"
        environment-image="neutral"
        exposure="1"
        shadow-softness="0.5"
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
          backgroundColor: '#000000'
        }}
      />
    </div>
  )
}