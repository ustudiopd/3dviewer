/**
 * 기존 3Dviewer 프로젝트에서 GLB 파일들을 로컬로 다운로드하는 스크립트
 * 
 * 사용 방법:
 * 1. .env.local 파일에 기존 프로젝트 정보 설정
 * 2. node scripts/download-glb-files.js 실행
 * 
 * 환경 변수:
 * - OLD_SUPABASE_URL: 기존 3Dviewer 프로젝트 URL (또는 NEXT_PUBLIC_SUPABASE_URL)
 * - OLD_SUPABASE_SERVICE_ROLE_KEY: 기존 프로젝트의 Service Role Key (또는 SUPABASE_SERVICE_ROLE_KEY)
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
const oldSupabaseUrl = process.env.OLD_SUPABASE_URL || 'https://rzgobwelgdhdsttkpqiw.supabase.co'
const oldServiceKey = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!oldServiceKey) {
  console.error('❌ 기존 프로젝트 정보가 필요합니다.')
  console.error('OLD_SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SERVICE_ROLE_KEY 설정 필요')
  process.exit(1)
}

const oldClient = createClient(oldSupabaseUrl, oldServiceKey)

const BUCKET_NAME = 'glb-models-private'
const DOWNLOAD_DIR = path.join(__dirname, '..', 'downloaded_models')

// 다운로드 디렉토리 생성
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true })
  console.log(`📁 다운로드 디렉토리 생성: ${DOWNLOAD_DIR}\n`)
}

async function downloadGlbFiles() {
  console.log('🚀 GLB 파일 다운로드 시작...\n')
  console.log(`📦 프로젝트: ${oldSupabaseUrl}`)
  console.log(`📁 저장 위치: ${DOWNLOAD_DIR}\n`)

  try {
    // 1. 버킷의 모든 파일 목록 가져오기
    console.log('📋 파일 목록 조회 중...')
    const { data: files, error: listError } = await oldClient.storage
      .from(BUCKET_NAME)
      .list('models', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      throw new Error(`파일 목록 조회 실패: ${listError.message}`)
    }

    if (!files || files.length === 0) {
      console.log('⚠️  다운로드할 파일이 없습니다.')
      return
    }

    console.log(`✅ ${files.length}개의 파일 발견\n`)

    // 2. 각 파일 다운로드
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const filePath = `models/${file.name}`
      const localPath = path.join(DOWNLOAD_DIR, file.name)

      try {
        console.log(`[${i + 1}/${files.length}] 📥 "${file.name}" 다운로드 중...`)

        // 파일 다운로드
        const { data: fileData, error: downloadError } = await oldClient.storage
          .from(BUCKET_NAME)
          .download(filePath)

        if (downloadError) {
          console.error(`   ❌ 다운로드 실패: ${downloadError.message}`)
          failCount++
          continue
        }

        if (!fileData) {
          console.error(`   ❌ 다운로드 실패: 파일 데이터가 없습니다`)
          failCount++
          continue
        }

        // 파일을 ArrayBuffer로 변환
        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 로컬에 저장
        fs.writeFileSync(localPath, buffer)

        const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2)
        console.log(`   ✅ 다운로드 완료 (${fileSizeMB} MB)`)
        successCount++

      } catch (error) {
        console.error(`   ❌ 오류 발생: ${error.message}`)
        failCount++
      }
    }

    // 3. 결과 요약
    console.log('\n' + '='.repeat(50))
    console.log('📊 다운로드 완료')
    console.log(`✅ 성공: ${successCount}개`)
    console.log(`❌ 실패: ${failCount}개`)
    console.log(`📁 저장 위치: ${DOWNLOAD_DIR}`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  }
}

downloadGlbFiles()

