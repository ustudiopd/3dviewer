// Storage 버킷에 실제 파일이 있는지 확인하는 스크립트
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// .env.local 파일에서 환경 변수 로드
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }  // Public 뷰 사용
})
const BUCKET_NAME = 'glb-models-private'

async function checkStorageFiles() {
  console.log('🔍 Storage 버킷 파일 확인 중...\n')
  console.log(`📦 프로젝트: ${supabaseUrl}`)
  console.log(`📁 버킷: ${BUCKET_NAME}\n`)

  try {
    // 1. DB에 저장된 모델 목록 가져오기
    console.log('📋 DB 모델 목록 조회 중...')
    const { data: models, error: dbError } = await supabase
      .from('models')
      .select('id, name, storage_path, file_size_bytes, created_at')
      .order('created_at', { ascending: false })

    if (dbError) {
      throw new Error(`DB 조회 실패: ${dbError.message}`)
    }

    if (!models || models.length === 0) {
      console.log('⚠️  DB에 모델이 없습니다.')
      return
    }

    console.log(`✅ DB에 ${models.length}개의 모델 발견\n`)

    // 2. Storage 버킷의 파일 목록 가져오기
    console.log('📦 Storage 버킷 파일 목록 조회 중...')
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('models', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (storageError) {
      throw new Error(`Storage 조회 실패: ${storageError.message}`)
    }

    const storageFileMap = new Map()
    if (storageFiles && storageFiles.length > 0) {
      storageFiles.forEach(file => {
        const fullPath = `models/${file.name}`
        storageFileMap.set(fullPath, file)
      })
    }

    console.log(`✅ Storage에 ${storageFileMap.size}개의 파일 발견\n`)

    // 3. 비교 분석
    console.log('='.repeat(80))
    console.log('📊 비교 결과\n')

    let foundCount = 0
    let missingCount = 0
    let sizeMismatchCount = 0

    const missingFiles = []
    const sizeMismatches = []

    for (const model of models) {
      const storageFile = storageFileMap.get(model.storage_path)
      
      if (!storageFile) {
        missingCount++
        missingFiles.push({
          name: model.name,
          storage_path: model.storage_path,
          db_size: model.file_size_bytes,
          created_at: model.created_at
        })
        console.log(`❌ 누락: ${model.name}`)
        console.log(`   경로: ${model.storage_path}`)
        console.log(`   DB 크기: ${(model.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`)
        console.log(`   생성일: ${model.created_at}\n`)
      } else {
        foundCount++
        const storageSize = storageFile.metadata?.size || 0
        const sizeDiff = Math.abs(storageSize - model.file_size_bytes)
        
        // 1KB 이상 차이나면 불일치로 간주
        if (sizeDiff > 1024) {
          sizeMismatchCount++
          sizeMismatches.push({
            name: model.name,
            storage_path: model.storage_path,
            db_size: model.file_size_bytes,
            storage_size: storageSize,
            diff: sizeDiff
          })
          console.log(`⚠️  크기 불일치: ${model.name}`)
          console.log(`   경로: ${model.storage_path}`)
          console.log(`   DB 크기: ${(model.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`)
          console.log(`   Storage 크기: ${(storageSize / (1024 * 1024)).toFixed(2)} MB`)
          console.log(`   차이: ${(sizeDiff / (1024 * 1024)).toFixed(2)} MB\n`)
        } else {
          console.log(`✅ 존재: ${model.name} (${(model.file_size_bytes / (1024 * 1024)).toFixed(2)} MB)`)
        }
      }
    }

    // 4. Storage에만 있는 파일 확인
    const dbPaths = new Set(models.map(m => m.storage_path))
    const orphanFiles = []
    
    for (const [path, file] of storageFileMap.entries()) {
      if (!dbPaths.has(path)) {
        orphanFiles.push({ path, file })
      }
    }

    // 5. 결과 요약
    console.log('\n' + '='.repeat(80))
    console.log('📊 최종 결과 요약')
    console.log('='.repeat(80))
    console.log(`✅ Storage에 존재: ${foundCount}개`)
    console.log(`❌ Storage에 누락: ${missingCount}개`)
    console.log(`⚠️  크기 불일치: ${sizeMismatchCount}개`)
    console.log(`📦 DB에 없는 파일: ${orphanFiles.length}개`)
    console.log('='.repeat(80))

    if (missingFiles.length > 0) {
      console.log('\n❌ 누락된 파일 목록:')
      missingFiles.forEach((file, index) => {
        console.log(`\n${index + 1}. ${file.name}`)
        console.log(`   경로: ${file.storage_path}`)
        console.log(`   크기: ${(file.db_size / (1024 * 1024)).toFixed(2)} MB`)
        console.log(`   생성일: ${file.created_at}`)
      })
    }

    if (orphanFiles.length > 0) {
      console.log('\n📦 DB에 없는 Storage 파일:')
      orphanFiles.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.path}`)
        console.log(`   크기: ${((item.file.metadata?.size || 0) / (1024 * 1024)).toFixed(2)} MB`)
      })
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  }
}

checkStorageFiles()

