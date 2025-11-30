/**
 * 3Dviewer 프로젝트 데이터를 uslab 프로젝트로 마이그레이션하는 스크립트
 * 
 * 사용 방법:
 * 1. .env.local 파일에 기존 프로젝트와 uslab 프로젝트 정보를 모두 설정
 * 2. node scripts/migrate-data-to-uslab.js 실행
 * 
 * 환경 변수:
 * - OLD_SUPABASE_URL: 기존 3Dviewer 프로젝트 URL
 * - OLD_SUPABASE_SERVICE_ROLE_KEY: 기존 프로젝트의 Service Role Key
 * - NEW_SUPABASE_URL: uslab 프로젝트 URL (https://xiygbsaewuqocaxoxeqn.supabase.co)
 * - NEW_SUPABASE_SERVICE_ROLE_KEY: uslab 프로젝트의 Service Role Key
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// .env.local 파일에서 환경변수 읽기
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envLines = envContent.split('\n')
    
    envLines.forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
          process.env[key.trim()] = value
        }
      }
    })
  }
}

loadEnvFile()

// 환경 변수 확인
const oldSupabaseUrl = process.env.OLD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const oldServiceKey = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const newSupabaseUrl = process.env.NEW_SUPABASE_URL || 'https://xiygbsaewuqocaxoxeqn.supabase.co'
const newServiceKey = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY

if (!oldSupabaseUrl || !oldServiceKey) {
  console.error('❌ 기존 프로젝트 정보가 필요합니다.')
  console.error('OLD_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_URL 설정 필요')
  console.error('OLD_SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SERVICE_ROLE_KEY 설정 필요')
  process.exit(1)
}

if (!newServiceKey) {
  console.error('❌ uslab 프로젝트 정보가 필요합니다.')
  console.error('NEW_SUPABASE_SERVICE_ROLE_KEY 설정 필요')
  process.exit(1)
}

// Supabase 클라이언트 생성
// 기존 프로젝트: public 스키마 사용
const oldClient = createClient(oldSupabaseUrl, oldServiceKey, {
  db: { schema: 'public' }
})

// uslab 프로젝트: Service Role Key를 사용하므로 RLS를 우회하고 직접 3dviewer 스키마에 접근
// 하지만 PostgREST 제약으로 인해 public 뷰를 통해야 하므로, 
// 실제로는 public 뷰가 INSERT를 지원하지 않으므로 RPC 함수를 사용하거나
// 직접 SQL을 실행해야 합니다.
// 여기서는 Service Role Key가 RLS를 우회하므로 public 뷰를 통해 시도하고,
// 실패 시 직접 SQL 실행 방법을 안내합니다.
const newClient = createClient(newSupabaseUrl, newServiceKey, {
  db: { schema: 'public' },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateData() {
  console.log('🚀 데이터 마이그레이션 시작...\n')

  try {
    // 1. Models 마이그레이션
    console.log('📦 Models 테이블 마이그레이션 중...')
    const { data: models, error: modelsError } = await oldClient
      .from('models')
      .select('*')
      .order('created_at', { ascending: true })

    if (modelsError) {
      throw new Error(`Models 조회 실패: ${modelsError.message}`)
    }

    if (models && models.length > 0) {
      console.log(`   ${models.length}개의 모델 발견`)
      
      // 기존 ID 매핑을 위한 맵
      const modelIdMap = new Map()

      for (const model of models) {
        const oldId = model.id
        // RPC 함수를 사용하여 3dviewer 스키마에 직접 삽입
        const { data: newId, error: insertError } = await newClient
          .rpc('insert_model', {
            p_name: model.name,
            p_storage_path: model.storage_path,
            p_file_size_bytes: model.file_size_bytes,
            p_is_draco_compressed: model.is_draco_compressed,
            p_is_ktx2: model.is_ktx2,
            p_created_at: model.created_at,
            p_updated_at: model.updated_at
          })

        if (insertError) {
          console.error(`   ❌ 모델 "${model.name}" 마이그레이션 실패:`, insertError.message)
          continue
        }

        modelIdMap.set(oldId, newId)
        console.log(`   ✅ 모델 "${model.name}" 마이그레이션 완료 (${oldId} → ${newId})`)
      }

      console.log(`\n✅ Models 마이그레이션 완료: ${modelIdMap.size}/${models.length}개 성공\n`)

      // 2. Demos 마이그레이션
      console.log('📦 Demos 테이블 마이그레이션 중...')
      const { data: demos, error: demosError } = await oldClient
        .from('demos')
        .select('*')
        .order('created_at', { ascending: true })

      if (demosError) {
        throw new Error(`Demos 조회 실패: ${demosError.message}`)
      }

      if (demos && demos.length > 0) {
        console.log(`   ${demos.length}개의 데모 발견`)
        
        const demoIdMap = new Map()
        let successCount = 0

        for (const demo of demos) {
          const oldModelId = demo.model_id
          const newModelId = modelIdMap.get(oldModelId)

          if (!newModelId) {
            console.warn(`   ⚠️  데모 "${demo.access_code}"의 모델 ID를 찾을 수 없음 (${oldModelId})`)
            continue
          }

          const oldDemoId = demo.id
          // RPC 함수를 사용하여 3dviewer 스키마에 직접 삽입
          const { data: newDemoId, error: insertError } = await newClient
            .rpc('insert_demo', {
              p_model_id: newModelId,
              p_access_code: demo.access_code,
              p_is_active: demo.is_active,
              p_expires_at: demo.expires_at,
              p_created_by: demo.created_by,
              p_access_count: demo.access_count,
              p_last_accessed_at: demo.last_accessed_at,
              p_memo: demo.memo,
              p_created_at: demo.created_at,
              p_updated_at: demo.updated_at
            })

          if (insertError) {
            console.error(`   ❌ 데모 "${demo.access_code}" 마이그레이션 실패:`, insertError.message)
            continue
          }

          demoIdMap.set(oldDemoId, newDemoId)
          successCount++
          console.log(`   ✅ 데모 "${demo.access_code}" 마이그레이션 완료 (${oldDemoId} → ${newDemoId})`)
        }

        console.log(`\n✅ Demos 마이그레이션 완료: ${successCount}/${demos.length}개 성공\n`)

        // 3. Access Logs 마이그레이션
        console.log('📦 Access Logs 테이블 마이그레이션 중...')
        const { data: accessLogs, error: logsError } = await oldClient
          .from('access_logs')
          .select('*')
          .order('accessed_at', { ascending: true })

        if (logsError) {
          throw new Error(`Access Logs 조회 실패: ${logsError.message}`)
        }

        if (accessLogs && accessLogs.length > 0) {
          console.log(`   ${accessLogs.length}개의 접속 로그 발견`)
          
          let successCount = 0
          const batchSize = 100 // 배치로 삽입

          for (let i = 0; i < accessLogs.length; i += batchSize) {
            const batch = accessLogs.slice(i, i + batchSize)
            const logsToInsert = []

            for (const log of batch) {
              const oldDemoId = log.demo_id
              const newDemoId = demoIdMap.get(oldDemoId)

              if (!newDemoId) {
                continue // 해당 데모가 마이그레이션되지 않았으면 스킵
              }

              logsToInsert.push({
                demo_id: newDemoId,
                access_code: log.access_code,
                user_ip: log.user_ip,
                user_agent: log.user_agent,
                accessed_at: log.accessed_at,
                created_at: log.created_at
              })
            }

            if (logsToInsert.length > 0) {
              // RPC 함수를 사용하여 배치 삽입
              const { data: insertedCount, error: insertError } = await newClient
                .rpc('insert_access_logs', {
                  p_logs: logsToInsert
                })

              if (insertError) {
                console.error(`   ❌ 배치 ${i / batchSize + 1} 마이그레이션 실패:`, insertError.message)
              } else {
                successCount += insertedCount || logsToInsert.length
                console.log(`   ✅ 배치 ${i / batchSize + 1} 완료 (${insertedCount || logsToInsert.length}개 로그)`)
              }
            }
          }

          console.log(`\n✅ Access Logs 마이그레이션 완료: ${successCount}/${accessLogs.length}개 성공\n`)
        } else {
          console.log('   접속 로그가 없습니다.\n')
        }
      } else {
        console.log('   데모가 없습니다.\n')
      }
    } else {
      console.log('   모델이 없습니다.\n')
    }

    console.log('🎉 데이터 마이그레이션 완료!')
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error)
    process.exit(1)
  }
}

// 실행
migrateData()

