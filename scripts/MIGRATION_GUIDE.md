# 데이터 및 파일 마이그레이션 가이드

3Dviewer 프로젝트의 데이터와 파일을 uslab 프로젝트로 마이그레이션하는 방법입니다.

## 📋 사전 준비

### 1. 환경 변수 설정

`.env.local` 파일에 **기존 프로젝트와 uslab 프로젝트 정보를 모두** 설정해야 합니다:

```env
# 기존 3Dviewer 프로젝트 정보
OLD_SUPABASE_URL=https://rzgobwelgdhdsttkpqiw.supabase.co
OLD_SUPABASE_SERVICE_ROLE_KEY=기존_프로젝트의_service_role_key

# 또는 기존 프로젝트가 현재 NEXT_PUBLIC_SUPABASE_URL에 설정되어 있다면
# OLD_ 접두사 없이 사용 가능:
# NEXT_PUBLIC_SUPABASE_URL=https://rzgobwelgdhdsttkpqiw.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=기존_프로젝트의_service_role_key

# uslab 프로젝트 정보
NEW_SUPABASE_URL=https://xiygbsaewuqocaxoxeqn.supabase.co
NEW_SUPABASE_SERVICE_ROLE_KEY=uslab_프로젝트의_service_role_key
```

**⚠️ 중요**: 
- 기존 프로젝트의 데이터를 읽기 위해 `OLD_*` 환경 변수 또는 현재 `NEXT_PUBLIC_SUPABASE_URL`이 필요합니다
- uslab 프로젝트로 데이터를 쓰기 위해 `NEW_SUPABASE_SERVICE_ROLE_KEY`가 필요합니다
- **.env.local을 uslab 프로젝트 값으로 바꾸기 전에** 이 스크립트를 실행해야 합니다

### 2. Service Role Key 확인

각 프로젝트의 Service Role Key는 Supabase Dashboard에서 확인할 수 있습니다:
- 기존 프로젝트: https://supabase.com/dashboard/project/rzgobwelgdhdsttkpqiw/settings/api
- uslab 프로젝트: https://supabase.com/dashboard/project/xiygbsaewuqocaxoxeqn/settings/api

---

## 🚀 마이그레이션 실행

### 방법 1: 데이터만 마이그레이션 (권장)

데이터베이스 데이터만 마이그레이션하는 경우:

```bash
node scripts/migrate-data-to-uslab.js
```

**마이그레이션 순서:**
1. `models` 테이블 → 새 ID 생성 (기존 ID와 매핑)
2. `demos` 테이블 → 새 모델 ID로 연결
3. `access_logs` 테이블 → 새 데모 ID로 연결

### 방법 2: Storage 파일만 마이그레이션

Storage 버킷의 파일만 마이그레이션하는 경우:

```bash
node scripts/migrate-storage-to-uslab.js
```

**주의사항:**
- 파일이 많거나 크기가 큰 경우 시간이 오래 걸릴 수 있습니다
- 네트워크 연결이 안정적인지 확인하세요

### 방법 3: 전체 마이그레이션

데이터와 파일을 모두 마이그레이션하는 경우:

```bash
# 1. 데이터 마이그레이션
node scripts/migrate-data-to-uslab.js

# 2. Storage 파일 마이그레이션
node scripts/migrate-storage-to-uslab.js
```

---

## ⚠️ 주의사항

### 1. 환경 변수 설정 순서

**❌ 잘못된 방법:**
```bash
# .env.local을 uslab 프로젝트 값으로 먼저 바꾸면
# 기존 프로젝트의 데이터를 읽을 수 없습니다!
```

**✅ 올바른 방법:**
1. `.env.local`에 기존 프로젝트와 uslab 프로젝트 정보를 **모두** 설정
2. 마이그레이션 스크립트 실행
3. 마이그레이션 완료 후 `.env.local`을 uslab 프로젝트 값으로 변경

### 2. ID 매핑

- Models, Demos의 ID는 새로 생성됩니다 (UUID)
- 외래 키 관계는 자동으로 새 ID로 연결됩니다
- 기존 ID와 새 ID의 매핑은 콘솔에 출력됩니다

### 3. 중복 실행

- 스크립트를 여러 번 실행하면 중복 데이터가 생성될 수 있습니다
- 마이그레이션 전에 uslab 프로젝트의 테이블이 비어있는지 확인하세요

### 4. Storage 버킷

- `glb-models-private` 버킷이 uslab 프로젝트에 없으면 자동으로 생성됩니다
- 파일이 이미 존재하면 `upsert: true` 옵션으로 덮어씁니다

---

## 🔍 마이그레이션 검증

마이그레이션 후 다음을 확인하세요:

### 1. 데이터 확인

```sql
-- uslab 프로젝트에서 실행
SELECT COUNT(*) FROM "3dviewer".models;
SELECT COUNT(*) FROM "3dviewer".demos;
SELECT COUNT(*) FROM "3dviewer".access_logs;
```

### 2. Storage 확인

Supabase Dashboard에서 Storage 버킷 확인:
- https://supabase.com/dashboard/project/xiygbsaewuqocaxoxeqn/storage/buckets

### 3. 기능 테스트

- 관리자 대시보드에서 모델 목록 확인
- 데모 생성 및 접근 테스트
- 3D 뷰어에서 모델 로드 테스트

---

## 🆘 문제 해결

### 문제: "기존 프로젝트 정보가 필요합니다"

**해결:**
- `.env.local`에 `OLD_SUPABASE_URL`과 `OLD_SUPABASE_SERVICE_ROLE_KEY` 설정
- 또는 `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 기존 프로젝트를 가리키는지 확인

### 문제: "uslab 프로젝트 정보가 필요합니다"

**해결:**
- `.env.local`에 `NEW_SUPABASE_SERVICE_ROLE_KEY` 설정

### 문제: "데모의 모델 ID를 찾을 수 없음"

**원인:**
- 해당 모델이 마이그레이션되지 않았거나 실패한 경우

**해결:**
- 모델 마이그레이션 로그 확인
- 필요시 해당 모델을 수동으로 마이그레이션

### 문제: Storage 파일 업로드 실패

**원인:**
- 파일 크기 제한 초과
- 네트워크 연결 문제
- 버킷 정책 문제

**해결:**
- 파일 크기 확인 (기본 50MB 제한)
- 네트워크 연결 확인
- Supabase Dashboard에서 버킷 정책 확인

---

## 📝 마이그레이션 후 작업

마이그레이션이 완료되면:

1. **환경 변수 업데이트**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xiygbsaewuqocaxoxeqn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=uslab_프로젝트의_anon_key
   SUPABASE_SERVICE_ROLE_KEY=uslab_프로젝트의_service_role_key
   ```

2. **애플리케이션 테스트**
   - 모든 기능이 정상 작동하는지 확인

3. **기존 프로젝트 백업** (선택사항)
   - 마이그레이션이 성공적으로 완료된 후 기존 프로젝트를 백업하거나 삭제할 수 있습니다

---

**마이그레이션 완료 후 Plan 모드로 복귀합니다.**

