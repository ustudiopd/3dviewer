'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UploadTestModelPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.glb')) {
      setError('GLB 파일만 업로드할 수 있습니다.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Storage에 파일 업로드
      const fileName = `test-models/${Date.now()}-${file.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('glb-models-private')
        .upload(fileName, file)

      if (uploadError) {
        throw new Error(`업로드 오류: ${uploadError.message}`)
      }

      setUploadedFile(fileName)
      
      // 데이터베이스에 모델 정보 저장
      const { data: modelData, error: modelError } = await supabase
        .from('models')
        .insert({
          name: file.name,
          storage_path: fileName,
          file_size: file.size,
          is_draco_compressed: false,
          is_ktx2: false
        })
        .select()
        .single()

      if (modelError) {
        throw new Error(`모델 정보 저장 오류: ${modelError.message}`)
      }

      alert(`파일 업로드 완료!\n경로: ${fileName}\n모델 ID: ${modelData.id}`)
    } catch (err) {
      console.error('업로드 오류:', err)
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">테스트 모델 업로드</h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              GLB 파일 선택
            </label>
            <input
              id="file"
              type="file"
              accept=".glb"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {uploading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">업로드 중...</p>
            </div>
          )}

          {uploadedFile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                ✅ 업로드 완료: {uploadedFile}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">❌ {error}</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center space-x-4">
          <a href="/create-test-demo" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            테스트 데모 생성
          </a>
          <a href="/debug-demo" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            디버깅 페이지
          </a>
        </div>
      </div>
    </div>
  )
}
