'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Model, Demo, DashboardStats, AccessLog } from '@/types'
import FileUploadModal from '@/components/FileUploadModal'
import CreateDemoModal from '@/components/CreateDemoModal'
import { formatFileSize, formatDate } from '@/lib/utils'

export default function AdminDashboardClient() {
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
  const [editingModelId, setEditingModelId] = useState<string | null>(null)
  const [editingModelName, setEditingModelName] = useState<string>('')
  const [editingDemo, setEditingDemo] = useState<Demo | null>(null)
  const [editDemoMemo, setEditDemoMemo] = useState<string>('')
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [showAccessLogs, setShowAccessLogs] = useState(false)
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null)

  // 데이터 로드
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 모델 목록 로드
      const { data: modelsData, error: modelsError } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false })

      if (modelsError) throw modelsError
      setModels(modelsData || [])

      // 데모 목록 로드
      const { data: demosData, error: demosError } = await supabase
        .from('demos')
        .select(`
          *,
          model:models(*)
        `)
        .order('created_at', { ascending: false })

      if (demosError) throw demosError
      setDemos(demosData || [])

      // 통계 계산
      const totalModels = modelsData?.length || 0
      const activeDemos = demosData?.filter(demo => demo.is_active).length || 0
      const totalAccess = demosData?.reduce((sum, demo) => sum + (demo.access_count || 0), 0) || 0

      setStats({
        total_models: totalModels,
        active_demos: activeDemos,
        total_access: totalAccess
      })
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 모델 삭제
  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('정말로 이 모델을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', modelId)

      if (error) throw error
      
      // 관련 데모도 삭제
      await supabase
        .from('demos')
        .delete()
        .eq('model_id', modelId)

      loadData()
    } catch (error) {
      console.error('모델 삭제 오류:', error)
      alert('모델 삭제에 실패했습니다.')
    }
  }

  // 모델명 수정
  const handleEditModelName = async (modelId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('models')
        .update({ name: newName })
        .eq('id', modelId)

      if (error) throw error
      
      setEditingModelId(null)
      setEditingModelName('')
      loadData()
    } catch (error) {
      console.error('모델명 수정 오류:', error)
      alert('모델명 수정에 실패했습니다.')
    }
  }

  // 데모 메모 수정
  const handleEditDemoMemo = async (demoId: string, memo: string) => {
    try {
      const { error } = await supabase
        .from('demos')
        .update({ memo })
        .eq('id', demoId)

      if (error) throw error
      
      setEditingDemo(null)
      setEditDemoMemo('')
      loadData()
    } catch (error) {
      console.error('데모 메모 수정 오류:', error)
      alert('메모 수정에 실패했습니다.')
    }
  }

  // 데모 삭제
  const handleDeleteDemo = async (demoId: string) => {
    if (!confirm('정말로 이 데모를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('demos')
        .delete()
        .eq('id', demoId)

      if (error) throw error
      
      loadData()
    } catch (error) {
      console.error('데모 삭제 오류:', error)
      alert('데모 삭제에 실패했습니다.')
    }
  }

  // 접속 로그 조회
  const handleViewAccessLogs = async (demoId: string) => {
    try {
      const response = await fetch(`/api/access-logs?demoId=${demoId}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setAccessLogs(data.data || [])
      setSelectedDemoId(demoId)
      setShowAccessLogs(true)
    } catch (error) {
      console.error('접속 로그 조회 오류:', error)
      alert('접속 로그를 불러올 수 없습니다.')
    }
  }

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">3Dviewer 관리자</h1>
              <p className="text-gray-600">3D 모델 및 데모 관리</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">총 모델 수</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total_models}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">활성 데모</h3>
            <p className="text-3xl font-bold text-green-600">{stats.active_demos}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">총 접속 수</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.total_access}</p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            모델 업로드
          </button>
          <button
            onClick={() => setShowCreateDemoModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            데모 생성
          </button>
        </div>

        {/* 모델 목록 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">모델 목록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">모델명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">파일 크기</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {models.map((model) => (
                  <tr key={model.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingModelId === model.id ? (
                        <input
                          type="text"
                          value={editingModelName}
                          onChange={(e) => setEditingModelName(e.target.value)}
                          className="border rounded px-2 py-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditModelName(model.id, editingModelName)
                            }
                          }}
                          onBlur={() => {
                            setEditingModelId(null)
                            setEditingModelName('')
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{model.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(model.file_size_bytes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(model.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingModelId(model.id)
                          setEditingModelName(model.name)
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 데모 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">데모 목록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">접속 코드</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">모델명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">접속 수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 접속</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {demos.map((demo) => (
                  <tr key={demo.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{demo.access_code}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(demo.access_code)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          복사
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {demo.model?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        demo.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {demo.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {demo.access_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {demo.last_accessed_at ? formatDate(demo.last_accessed_at) : '없음'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingDemo?.id === demo.id ? (
                        <input
                          type="text"
                          value={editDemoMemo}
                          onChange={(e) => setEditDemoMemo(e.target.value)}
                          className="border rounded px-2 py-1 text-sm w-32"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditDemoMemo(demo.id, editDemoMemo)
                            }
                          }}
                          onBlur={() => {
                            setEditingDemo(null)
                            setEditDemoMemo('')
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm text-gray-500">{demo.memo || '메모 없음'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${demo.access_code}`)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          링크 복사
                        </button>
                        <button
                          onClick={() => window.open(`${window.location.origin}/${demo.access_code}`, '_blank')}
                          className="text-green-600 hover:text-green-900 text-xs"
                        >
                          새창 열기
                        </button>
                        <button
                          onClick={() => {
                            setEditingDemo(demo)
                            setEditDemoMemo(demo.memo || '')
                          }}
                          className="text-indigo-600 hover:text-indigo-900 text-xs"
                        >
                          메모 수정
                        </button>
                        <button
                          onClick={() => handleViewAccessLogs(demo.id)}
                          className="text-purple-600 hover:text-purple-900 text-xs"
                        >
                          접속 로그
                        </button>
                        <button
                          onClick={() => handleDeleteDemo(demo.id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      {showUploadModal && (
        <FileUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            loadData()
          }}
        />
      )}

      {showCreateDemoModal && (
        <CreateDemoModal
          models={models}
          onClose={() => setShowCreateDemoModal(false)}
          onSuccess={() => {
            setShowCreateDemoModal(false)
            loadData()
          }}
        />
      )}

      {/* 접속 로그 모달 */}
      {showAccessLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">접속 로그</h3>
              <button
                onClick={() => setShowAccessLogs(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">접속 시간</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP 주소</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User Agent</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accessLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {formatDate(log.accessed_at)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {log.user_ip || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {log.user_agent ? log.user_agent.substring(0, 50) + '...' : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {accessLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  접속 로그가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
