'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Model, Demo, DashboardStats, AccessLog } from '@/types'
import FileUploadModal from '@/components/FileUploadModal'
import CreateDemoModal from '@/components/CreateDemoModal'
import { formatFileSize, formatDate } from '@/lib/utils'

export default function AdminDashboard() {
  const [models, setModels] = useState<Model[]>([])
  const [demos, setDemos] = useState<Demo[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total_models: 0,
    active_demos: 0,
    total_access: 0
  })
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCreateDemoModal, setShowCreateDemoModal] = useState(false)
  const [editingModel, setEditingModel] = useState<string | null>(null)
  const [editModelName, setEditModelName] = useState('')
  const [editingDemo, setEditingDemo] = useState<string | null>(null)
  const [editDemoMemo, setEditDemoMemo] = useState('')
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [showAccessLogs, setShowAccessLogs] = useState(false)
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // 모델 목록 조회
      const { data: modelsData } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false })

      // 데모 목록 조회
      const { data: demosData } = await supabase
        .from('demos')
        .select(`
          *,
          model:models(*)
        `)
        .order('created_at', { ascending: false })

      // 통계 계산
      const totalAccess = demosData?.reduce((sum, demo) => sum + demo.access_count, 0) || 0
      const activeDemos = demosData?.filter(demo => demo.is_active).length || 0

      setModels(modelsData || [])
      setDemos(demosData || [])
      setStats({
        total_models: modelsData?.length || 0,
        active_demos: activeDemos,
        total_access: totalAccess
      })
    } catch (error) {
      console.error('데이터 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDemo = async (demoId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('demos')
        .update({ is_active: !isActive })
        .eq('id', demoId)

      if (!error) {
        fetchData() // 데이터 새로고침
      }
    } catch (error) {
      console.error('데모 상태 변경 오류:', error)
    }
  }

  const handleDeleteDemo = async (demoId: string) => {
    if (!confirm('이 데모를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('demos')
        .delete()
        .eq('id', demoId)

      if (!error) {
        fetchData() // 데이터 새로고침
      }
    } catch (error) {
      console.error('데모 삭제 오류:', error)
    }
  }

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('이 모델을 삭제하시겠습니까? 연결된 데모도 함께 삭제됩니다.')) return

    try {
      // 먼저 연결된 데모들 삭제
      await supabase
        .from('demos')
        .delete()
        .eq('model_id', modelId)

      // 모델 삭제
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', modelId)

      if (!error) {
        fetchData() // 데이터 새로고침
        alert('모델이 삭제되었습니다.')
      }
    } catch (error) {
      console.error('모델 삭제 오류:', error)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(`${type}이 클립보드에 복사되었습니다!`)
    } catch (error) {
      console.error('복사 오류:', error)
      // 폴백: 텍스트 선택
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert(`${type}이 클립보드에 복사되었습니다!`)
    }
  }

  const getDemoUrl = (accessCode: string) => {
    return `${window.location.origin}/${accessCode}`
  }

  const handleEditModel = (modelId: string, currentName: string) => {
    setEditingModel(modelId)
    setEditModelName(currentName)
  }

  const handleSaveModelName = async (modelId: string) => {
    if (!editModelName.trim()) {
      alert('모델명을 입력해주세요.')
      return
    }

    try {
      const { error } = await supabase
        .from('models')
        .update({ name: editModelName.trim() })
        .eq('id', modelId)

      if (error) {
        throw new Error(error.message)
      }

      setEditingModel(null)
      setEditModelName('')
      fetchData() // 데이터 새로고침
      alert('모델명이 수정되었습니다.')
    } catch (error) {
      console.error('모델명 수정 오류:', error)
      alert('모델명 수정에 실패했습니다.')
    }
  }

  const handleCancelEdit = () => {
    setEditingModel(null)
    setEditModelName('')
  }

  const handleEditDemo = (demoId: string, currentMemo: string) => {
    setEditingDemo(demoId)
    setEditDemoMemo(currentMemo || '')
  }

  const handleSaveDemoMemo = async (demoId: string) => {
    try {
      const { error } = await supabase
        .from('demos')
        .update({ memo: editDemoMemo.trim() || null })
        .eq('id', demoId)

      if (!error) {
        fetchData() // 데이터 새로고침
        setEditingDemo(null)
        setEditDemoMemo('')
      } else {
        alert('메모 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('메모 저장 오류:', error)
      alert('메모 저장 중 오류가 발생했습니다.')
    }
  }

  const handleCancelDemoEdit = () => {
    setEditingDemo(null)
    setEditDemoMemo('')
  }

  const fetchAccessLogs = async (demoId: string) => {
    try {
      const response = await fetch(`/api/access-logs?demoId=${demoId}`)
      
      if (!response.ok) {
        console.error('접속 로그 조회 실패:', response.status)
        return
      }

      const { data } = await response.json()
      setAccessLogs(data || [])
      setSelectedDemoId(demoId)
      setShowAccessLogs(true)
    } catch (error) {
      console.error('접속 로그 조회 오류:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 통계 카드 - 모바일 최적화 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 모델</dt>
                  <dd className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_models}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">활성 데모</dt>
                  <dd className="text-xl sm:text-2xl font-bold text-gray-900">{stats.active_demos}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 sm:col-span-2 lg:col-span-1">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 접근</dt>
                  <dd className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_access}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 - 모바일 최적화 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>모델 업로드</span>
          </div>
        </button>
        <button
          onClick={() => setShowCreateDemoModal(true)}
          className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>데모 생성</span>
          </div>
        </button>
      </div>

      {/* 모델 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">모델 목록</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {models.map((model) => (
            <li key={model.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 text-sm">3D</span>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    {editingModel === model.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editModelName}
                          onChange={(e) => setEditModelName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveModelName(model.id)
                            } else if (e.key === 'Escape') {
                              handleCancelEdit()
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="모델명을 입력하세요"
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveModelName(model.id)}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                          >
                            저장
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                          <span>{model.name}</span>
                          <button
                            onClick={() => handleEditModel(model.id, model.name)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="모델명 수정"
                          >
                            ✏️
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatFileSize(model.file_size_bytes)} • 
                          {model.is_draco_compressed ? ' Draco 압축' : ' 일반'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          경로: {model.storage_path}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    {new Date(model.created_at).toLocaleDateString('ko-KR')}
                  </div>
                  {editingModel !== model.id && (
                    <button
                      onClick={() => handleDeleteModel(model.id)}
                      className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 데모 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">데모 목록</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {demos.map((demo) => (
            <li key={demo.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${demo.is_active ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      <span className="font-mono text-lg font-bold text-blue-600">{demo.access_code}</span> - {demo.model?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      접근 {demo.access_count}회 • 
                      {demo.last_accessed_at ? `마지막 접속: ${formatDate(demo.last_accessed_at)}` : '접속 기록 없음'} • 
                      {demo.expires_at ? `만료: ${formatDate(demo.expires_at)}` : '만료일 없음'}
                    </div>
                    {/* 메모 표시/편집 */}
                    {editingDemo === demo.id ? (
                      <div className="mt-2 flex items-center space-x-2">
                        <input
                          type="text"
                          value={editDemoMemo}
                          onChange={(e) => setEditDemoMemo(e.target.value)}
                          placeholder="메모를 입력하세요"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveDemoMemo(demo.id)
                            } else if (e.key === 'Escape') {
                              handleCancelDemoEdit()
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveDemoMemo(demo.id)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelDemoEdit}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {demo.memo ? `📝 ${demo.memo}` : '📝 메모 없음'}
                        </span>
                        <button
                          onClick={() => handleEditDemo(demo.id, demo.memo || '')}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                        >
                          {demo.memo ? '수정' : '추가'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(demo.access_code, '접속 코드')}
                    className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                    title="접속 코드 복사"
                  >
                    코드 복사
                  </button>
                  <button
                    onClick={() => copyToClipboard(getDemoUrl(demo.access_code), '데모 링크')}
                    className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 hover:bg-green-200"
                    title="데모 링크 복사"
                  >
                    링크 복사
                  </button>
                  <button
                    onClick={() => fetchAccessLogs(demo.id)}
                    className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200"
                    title="접속 로그 보기"
                  >
                    로그 보기
                  </button>
                  <button
                    onClick={() => handleToggleDemo(demo.id, demo.is_active)}
                    className={`px-3 py-1 text-xs rounded-full ${
                      demo.is_active 
                        ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {demo.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button
                    onClick={() => handleDeleteDemo(demo.id)}
                    className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-800 hover:bg-red-200"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 모달들 */}
      {showUploadModal && (
        <FileUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            fetchData()
          }}
        />
      )}

      {showCreateDemoModal && (
        <CreateDemoModal
          models={models}
          onClose={() => setShowCreateDemoModal(false)}
          onSuccess={() => {
            setShowCreateDemoModal(false)
            fetchData()
          }}
        />
      )}

      {/* 접속 로그 모달 */}
      {showAccessLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">접속 로그</h3>
              <button
                onClick={() => setShowAccessLogs(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {accessLogs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  접속 로그가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {accessLogs.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(log.accessed_at)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.accessed_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>IP:</strong> {log.user_ip || '알 수 없음'}</div>
                            <div><strong>User Agent:</strong> {log.user_agent || '알 수 없음'}</div>
                            <div><strong>접속 코드:</strong> <span className="font-mono">{log.access_code}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

