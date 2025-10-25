'use client'

import { useState } from 'react'

export default function CreateSimpleGlbPage() {
  const [creating, setCreating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const createSimpleGlb = async () => {
    setCreating(true)
    
    try {
      // 간단한 GLB 파일 생성 (실제로는 더 복잡한 로직이 필요)
      // 여기서는 예시용으로 간단한 텍스트 파일을 생성
      const glbContent = `# Simple GLB Test File
# This is a placeholder GLB file for testing
# In a real implementation, you would generate actual GLB binary data
# For now, this serves as a test file to verify the upload and storage system

Model: Test Cube
Vertices: 8
Faces: 12
Materials: 1
Textures: 0

This is a test GLB file created at ${new Date().toISOString()}`

      const blob = new Blob([glbContent], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      
      setDownloadUrl(url)
      
      // 자동으로 다운로드 시작
      const a = document.createElement('a')
      a.href = url
      a.download = 'test-model.glb'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('GLB 생성 오류:', error)
      alert('GLB 파일 생성 중 오류가 발생했습니다.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">간단한 GLB 파일 생성</h1>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ 이는 테스트용 파일입니다. 실제 3D 모델이 아닙니다.
            </p>
          </div>

          <button
            onClick={createSimpleGlb}
            disabled={creating}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? '생성 중...' : '테스트 GLB 파일 생성'}
          </button>

          {downloadUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                ✅ GLB 파일이 생성되었습니다!
              </p>
              <p className="text-green-800 text-sm mt-2">
                이제 이 파일을 업로드하여 테스트할 수 있습니다.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center space-x-4">
          <a href="/upload-test-model" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            파일 업로드
          </a>
          <a href="/debug-demo" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            디버깅 페이지
          </a>
        </div>
      </div>
    </div>
  )
}
