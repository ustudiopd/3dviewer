/**
 * Supabase Storage 버킷의 파일 크기 제한을 5GB로 업데이트하는 스크립트
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKET_NAME = 'glb-models-private'
const FILE_SIZE_LIMIT = 5 * 1024 * 1024 * 1024 // 5GB

async function updateBucketSize() {
  try {
    console.log('🔧 Storage 버킷 파일 크기 제한 업데이트 중...\n')
    console.log(`📦 버킷: ${BUCKET_NAME}`)
    console.log(`📏 새 제한: 5GB (${FILE_SIZE_LIMIT} bytes)\n`)

    // 버킷 목록 확인
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw new Error(`버킷 목록 조회 실패: ${listError.message}`)
    }

    const bucket = buckets?.find(b => b.name === BUCKET_NAME)

    if (!bucket) {
      console.log(`📦 "${BUCKET_NAME}" 버킷이 없습니다. 생성 중...`)
      
      // 버킷 생성
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: FILE_SIZE_LIMIT,
        allowedMimeTypes: ['model/gltf-binary', 'application/octet-stream']
      })

      if (createError) {
        throw new Error(`버킷 생성 실패: ${createError.message}`)
      }

      console.log('✅ 버킷이 성공적으로 생성되었습니다!')
      console.log(`   파일 크기 제한: 5GB`)
    } else {
      console.log(`✅ "${BUCKET_NAME}" 버킷 발견`)
      console.log(`   현재 파일 크기 제한: ${bucket.file_size_limit ? `${(bucket.file_size_limit / (1024 * 1024)).toFixed(0)}MB` : '제한 없음'}`)
      
      // 참고: Supabase Storage API는 버킷 설정을 직접 업데이트하는 기능이 제한적입니다
      // 버킷의 file_size_limit은 Dashboard에서 수동으로 변경해야 할 수 있습니다
      console.log('\n⚠️  참고: Supabase Storage API로는 버킷 설정을 직접 업데이트할 수 없을 수 있습니다.')
      console.log('   Supabase Dashboard에서 수동으로 변경하세요:')
      console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/storage/buckets/${BUCKET_NAME}/settings`)
      console.log('\n   또는 다음 SQL을 Supabase Dashboard의 SQL Editor에서 실행하세요:')
      console.log(`   UPDATE storage.buckets SET file_size_limit = ${FILE_SIZE_LIMIT} WHERE name = '${BUCKET_NAME}';`)
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  }
}

updateBucketSize()

