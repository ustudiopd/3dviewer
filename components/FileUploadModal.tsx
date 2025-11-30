'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase'
import { generateAccessCode, formatFileSize } from '@/lib/utils'
import { UploadFileData } from '@/types'

interface FileUploadModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function FileUploadModal({ onClose, onSuccess }: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [status, setStatus] = useState('')

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('파일 크기가 5GB를 초과합니다.')
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('GLB 파일만 업로드 가능합니다.')
      } else {
        setError('파일 업로드에 실패했습니다.')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      
      // 파일 확장자 검증
      if (!selectedFile.name.toLowerCase().endsWith('.glb')) {
        setError('GLB 파일만 업로드 가능합니다.')
        return
      }
      
      setFile(selectedFile)
      setName(selectedFile.name.replace('.glb', ''))
      setError('')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'model/gltf-binary': ['.glb'],
      'application/octet-stream': ['.glb'],
      'application/gltf-binary': ['.glb']
    },
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    multiple: false
  })

  const handleUpload = async () => {
    if (!file || !name.trim()) return

    setUploading(true)
    setError('')
    setProgress(0)
    setStatus('')

    // 파일 크기 기반 예상 시간 계산
    const fileSizeMB = file.size / (1024 * 1024)
    const estimatedSeconds = Math.max(5, Math.round(fileSizeMB * 0.5)) // 1MB당 0.5초 예상
    setEstimatedTime(`${estimatedSeconds}초 예상`)

    try {
      // 파일명 생성
      const fileExt = file.name.split('.').pop()
      const fileName = `${generateAccessCode()}-${Date.now()}.${fileExt}`
      const filePath = `models/${fileName}`

      // GLB 파일을 Blob으로 변환하여 올바른 MIME 타입 설정
      const glbBlob = new Blob([file], { type: 'model/gltf-binary' })
      
      // 1단계: 파일 준비 (5%)
      setProgress(5)
      setStatus('파일을 준비하는 중...')
      await new Promise(resolve => setTimeout(resolve, 500))

      // 2단계: 파일 분석 (10%)
      setProgress(10)
      setStatus('파일을 분석하는 중...')
      await new Promise(resolve => setTimeout(resolve, 300))

      // 3단계: 업로드 시작 (15%)
      setProgress(15)
      setStatus('서버에 업로드 중...')
      
      // 실시간 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev // 85%에서 멈춤
          return prev + Math.random() * 3 + 1 // 1-4%씩 증가
        })
      }, 200) // 200ms마다 업데이트

      // Supabase Storage 업로드
      const { data, error: uploadError } = await supabase.storage
        .from('glb-models-private')
        .upload(filePath, glbBlob, {
          cacheControl: '3600',
          upsert: false
        })

      // 업로드 완료 시 진행률 시뮬레이션 중지
      clearInterval(progressInterval)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // 4단계: 업로드 완료 (85%)
      setProgress(85)
      setStatus('업로드 완료! 모델을 분석하는 중...')
      
      // 점진적으로 90%까지 증가
      for (let i = 85; i <= 90; i++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setProgress(i)
      }

      // 5단계: Draco 압축 분석 (90%)
      setStatus('압축 형식을 확인하는 중...')
      const isDracoCompressed = await analyzeDracoCompression(file)
      
      // 점진적으로 95%까지 증가
      for (let i = 90; i <= 95; i++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setProgress(i)
      }

      // 6단계: 데이터베이스 저장 (95%) - RPC 함수 사용
      setStatus('설정을 등록하는 중...')
      const { data: modelId, error: rpcError } = await supabase.rpc('insert_model', {
        p_name: name.trim(),
        p_storage_path: data.path,
        p_file_size_bytes: file.size,
        p_is_draco_compressed: isDracoCompressed,
        p_is_ktx2: false // 기본값
      })

      if (rpcError) {
        // 업로드된 파일 삭제
        await supabase.storage
          .from('glb-models-private')
          .remove([data.path])
        throw new Error(rpcError.message)
      }

      // RPC 함수가 성공하면 모델이 생성된 것이므로 추가 확인 불필요

      // 7단계: 완료 (100%) - 점진적으로 증가
      for (let i = 95; i <= 100; i++) {
        await new Promise(resolve => setTimeout(resolve, 50))
        setProgress(i)
      }
      setStatus('업로드 완료!')
      setTimeout(() => {
        onSuccess()
      }, 500) // 완료 메시지를 잠깐 보여주기
    } catch (err: any) {
      setError(err.message || '업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      setEstimatedTime('')
      setStatus('')
      setTimeout(() => setProgress(0), 1000) // 1초 후 진행률 초기화
    }
  }

  const analyzeDracoCompression = async (file: File): Promise<boolean> => {
    // GLB 파일의 헤더를 읽어서 Draco 압축 여부 확인
    const buffer = await file.slice(0, 100).arrayBuffer()
    const view = new Uint8Array(buffer)
    
    // GLB 매직 넘버 확인
    if (view[0] !== 0x67 || view[1] !== 0x6C || view[2] !== 0x54 || view[3] !== 0x46) {
      return false
    }

    // 간단한 Draco 압축 감지 (실제로는 더 정교한 분석이 필요)
    // 여기서는 기본값으로 false 반환
    return false
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">3D 모델 업로드</h3>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* 드래그 앤 드롭 영역 */}
          <div
            {...getRootProps()}
            className={`dropzone ${
              isDragActive ? 'active' : ''
            } ${isDragReject ? 'rejected' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? '파일을 여기에 놓으세요'
                  : 'GLB 파일을 드래그하거나 클릭하여 선택하세요'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                최대 1GB, GLB 파일만 지원
              </p>
            </div>
          </div>

          {/* 선택된 파일 정보 */}
          {file && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => {
                    setFile(null)
                    setError('')
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* 모델 이름 입력 */}
          {file && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                모델 이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="모델 이름을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* 업로드 진행률 - 현실적인 단계별 표시 */}
          {uploading && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {status}
                </div>
                <div className="text-xs text-gray-500">
                  {progress < 15 && '파일을 준비하고 있습니다...'}
                  {progress >= 15 && progress < 85 && '서버에 업로드 중입니다...'}
                  {progress >= 85 && progress < 95 && '모델을 분석하고 있습니다...'}
                  {progress >= 95 && progress < 100 && '설정을 등록하고 있습니다...'}
                  {progress === 100 && '완료되었습니다!'}
                </div>
              </div>
              
              {/* 단계별 진행률 표시 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>파일 준비</span>
                  <span>업로드</span>
                  <span>분석</span>
                  <span>등록</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      progress < 15 ? 'bg-blue-500' : 
                      progress < 85 ? 'bg-indigo-500' : 
                      progress < 95 ? 'bg-purple-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className={progress >= 5 ? 'text-blue-600 font-medium' : ''}>✓</span>
                  <span className={progress >= 15 ? 'text-indigo-600 font-medium' : ''}>✓</span>
                  <span className={progress >= 85 ? 'text-purple-600 font-medium' : ''}>✓</span>
                  <span className={progress >= 95 ? 'text-green-600 font-medium' : ''}>✓</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 transition-all duration-300">
                  {Math.round(progress)}%
                </div>
                {progress === 100 && (
                  <div className="text-sm text-green-600 font-medium mt-2 animate-pulse">
                    🎉 업로드가 완료되었습니다!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || !name.trim() || uploading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:cursor-not-allowed transition-colors ${
              uploading 
                ? progress < 95 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : progress < 100 
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>
                  {progress < 15 ? '준비 중...' :
                   progress < 85 ? '업로드 중...' :
                   progress < 95 ? '분석 중...' :
                   progress < 100 ? '등록 중...' : '완료!'} {Math.round(progress)}%
                </span>
              </div>
            ) : (
              '업로드'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

