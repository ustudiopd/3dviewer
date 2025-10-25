'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Model } from '@/types'
import { generateAccessCode } from '@/lib/utils'

interface CreateDemoModalProps {
  models: Model[]
  onClose: () => void
  onSuccess: () => void
}

export default function CreateDemoModal({ models, onClose, onSuccess }: CreateDemoModalProps) {
  const [selectedModelId, setSelectedModelId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!selectedModelId) {
      setError('모델을 선택해주세요.')
      return
    }

    setCreating(true)
    setError('')

    try {
      // 8자리 접속 코드 생성
      let accessCode = generateAccessCode()
      let isUnique = false
      let attempts = 0

      // 고유한 코드 생성 (최대 10번 시도)
      while (!isUnique && attempts < 10) {
        const { data: existing } = await supabase
          .from('demos')
          .select('id')
          .eq('access_code', accessCode)
          .single()

        if (!existing) {
          isUnique = true
        } else {
          accessCode = generateAccessCode()
          attempts++
        }
      }

      if (!isUnique) {
        throw new Error('고유한 접속 코드를 생성할 수 없습니다. 다시 시도해주세요.')
      }

      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      // 데모 생성
      const { error: createError } = await supabase
        .from('demos')
        .insert({
          model_id: selectedModelId,
          access_code: accessCode,
          is_active: true,
          expires_at: expiresAt || null,
          created_by: user.id,
          access_count: 0
        })

      if (createError) {
        throw new Error(createError.message)
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || '데모 생성 중 오류가 발생했습니다.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">데모 생성</h3>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* 모델 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              모델 선택 *
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">모델을 선택하세요</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* 만료일 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              만료일 (선택사항)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              만료일을 설정하지 않으면 영구적으로 유효합니다.
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* 생성된 코드 미리보기 */}
          {selectedModelId && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                생성될 접속 코드: <span className="font-mono font-bold">[8자리 자동 생성]</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                사용자는 이 8자리 코드로 3D 뷰어에 접속할 수 있습니다.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={creating}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedModelId || creating}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? '생성 중...' : '데모 생성'}
          </button>
        </div>
      </div>
    </div>
  )
}

