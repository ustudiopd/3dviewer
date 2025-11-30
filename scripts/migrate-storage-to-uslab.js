/**
 * 3Dviewer 프로젝트 Storage 파일을 uslab 프로젝트로 마이그레이션하는 스크립트
 * 
 * 사용 방법:
 * 1. .env.local 파일에 기존 프로젝트와 uslab 프로젝트 정보를 모두 설정
 * 2. node scripts/migrate-storage-to-uslab.js 실행
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
const oldClient = createClient(oldSupabaseUrl, oldServiceKey)
const newClient = createClient(newSupabaseUrl, newServiceKey)

const BUCKET_NAME = 'glb-models-private'

async function migrateStorage() {
  console.log('🚀 Storage 파일 마이그레이션 시작...\n')

  try {
    // 1. 기존 프로젝트의 파일 목록 조회 (재귀적으로 모든 파일 조회)
    console.log(`📦 "${BUCKET_NAME}" 버킷의 파일 목록 조회 중...`)
    
    // 재귀적으로 모든 파일 조회
    async function listAllFiles(path = '', allFiles = []) {
      const { data: items, error: listError } = await oldClient.storage
        .from(BUCKET_NAME)
        .list(path, {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'created_at', order: 'asc' }
        })

      if (listError) {
        throw new Error(`파일 목록 조회 실패: ${listError.message}`)
      }

      if (!items) return allFiles

      for (const item of items) {
        if (item.id) {
          // 파일인 경우 (id가 있으면 파일)
          allFiles.push({
            ...item,
            fullPath: path ? `${path}/${item.name}` : item.name
          })
        } else if (!item.name.includes('.')) {
          // 폴더인 경우 (확장자가 없으면 폴더로 간주, 재귀적으로 조회)
          await listAllFiles(path ? `${path}/${item.name}` : item.name, allFiles)
        }
      }

      return allFiles
    }

    const files = await listAllFiles()

    if (!files || files.length === 0) {
      console.log('   마이그레이션할 파일이 없습니다.\n')
      return
    }

    console.log(`   ${files.length}개의 파일 발견\n`)

    // 2. uslab 프로젝트에 버킷이 있는지 확인 (없으면 생성)
    const { data: buckets } = await newClient.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

    if (!bucketExists) {
      console.log(`📦 "${BUCKET_NAME}" 버킷 생성 중...`)
      const { error: createError } = await newClient.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 5368709120, // 5GB
        allowedMimeTypes: ['model/gltf-binary', 'application/octet-stream']
      })

      if (createError) {
        throw new Error(`버킷 생성 실패: ${createError.message}`)
      }
      console.log('   ✅ 버킷 생성 완료\n')
    }

    // 3. 파일 다운로드 및 업로드
    let successCount = 0
    let failCount = 0

    for (const file of files) {
      try {
        const filePath = file.fullPath || file.name
        console.log(`   📥 "${filePath}" 다운로드 중...`)

        // 기존 프로젝트에서 파일 다운로드
        const { data: fileData, error: downloadError } = await oldClient.storage
          .from(BUCKET_NAME)
          .download(filePath)

        if (downloadError) {
          console.error(`   ❌ 다운로드 실패:`, downloadError)
          failCount++
          continue
        }

        if (!fileData) {
          console.error(`   ❌ 다운로드 실패: 파일 데이터가 없습니다`)
          failCount++
          continue
        }

        // uslab 프로젝트에 파일 업로드
        console.log(`   📤 "${filePath}" 업로드 중...`)
        const { error: uploadError } = await newClient.storage
          .from(BUCKET_NAME)
          .upload(filePath, fileData, {
            contentType: file.metadata?.mimetype || 'application/octet-stream',
            upsert: true
          })

        if (uploadError) {
          console.error(`   ❌ 업로드 실패: ${uploadError.message}`)
          failCount++
          continue
        }

        successCount++
        console.log(`   ✅ "${filePath}" 마이그레이션 완료`)
      } catch (error) {
        const filePath = file.fullPath || file.name
        console.error(`   ❌ "${filePath}" 마이그레이션 중 오류:`, error.message || error)
        failCount++
      }
    }

    console.log(`\n🎉 Storage 마이그레이션 완료!`)
    console.log(`   ✅ 성공: ${successCount}개`)
    console.log(`   ❌ 실패: ${failCount}개`)
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error)
    process.exit(1)
  }
}

// 실행
migrateStorage()

