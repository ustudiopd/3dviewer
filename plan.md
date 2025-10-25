
## 🚀 1. 프로젝트 소개

### 프로그램명

USLAB 3D 데모 뷰어 (v5.0 - 제로베이스 빌드)

### 프로그램 개요

본 프로그램은 3D 모델(`.glb` 파일)을 기업 및 공공기관 고객 대상으로 안전하고 전문적인 환경에서 시연하기 위한 **고급 폐쇄형 웹 뷰어 시스템**입니다.

### 핵심 목표

기존 구현의 문제점을 폐기하고, \*\*`react-dropzone`\*\*과 같은 검증된 라이브러리를 기반으로 제로베이스에서 재구축합니다. 관리자가 **최대 1GB**의 `.glb` 파일을 안정적으로 업로드하고, **6자리 접속 코드**를 생성하며, **접근 통계**를 확인하고, **일괄 작업**을 통해 데모 접근을 세밀하게 통제하는 확장 가능한 플랫폼을 구축합니다.

-----

## 🛠️ 2. 시스템 아키텍처

| 구성 요소 | 기술 스택 | 역할 |
| :--- | :--- | :--- |
| **프론트엔드** | Next.js (App Router) | • 사용자 UI, 관리자 대시보드 |
| **백엔드 (서버)** | Next.js (Server/API) | • DB 조회, 인증, 접근 제어<br>• 임시 URL(Signed URL) 생성 |
| **호스팅/배포** | Vercel | • Next.js 프로젝트 배포, 환경 변수 관리 |
| **데이터베이스** | Supabase DB | • `models`, `demos` 테이블 (RLS로 전체 비공개) |
| **파일 스토리지** | Supabase Storage | • `.glb` 파일 저장 (Private 버킷) |
| **인증** | Supabase Auth | • 관리자 전용 로그인 |
| **3D 렌더링** | **`<model-viewer>`** | • 웹 컴포넌트 기반 3D 뷰어 |
| **파일 업로드** | **`react-dropzone`** | **(신규)** 클릭/드래그앤드롭을 안정적으로 처리 |
| **모니터링** | Vercel Analytics, Sentry | • 성능 및 에러 트래킹 |
| **테스트** | Playwright, Jest/Vitest | • E2E 및 단위 테스트 |

-----

## 🔐 3. 보안 및 액세스 제어 (RLS)

  * **DB (RLS):** 모든 테이블(`models`, `demos`)은 \*\*기본 차단(Deny All)\*\*입니다. 오직 \*\*관리자(Authenticated)\*\*만 모든 작업(CRUD)을 수행할 수 있도록 허용합니다. (Public Read 금지)
  * **스토리지 (RLS):** `glb-models-private` 버킷은 \*\*비공개(Private)\*\*이며, \*\*관리자(Authenticated)\*\*만 업로드/삭제가 가능하도록 RLS 정책을 설정합니다.
  * **CORS:** 스토리지 버킷의 CORS 설정은 Vercel 배포 도메인(예: `https://[내도메인].vercel.app`)만 명시적으로 허용합니다.
  * **사용자 접근:** 사용자는 DB에 절대 직접 접근하지 않습니다. `/[code]` 페이지(서버 컴포넌트)가 \*\*`SERVICE_ROLE_KEY`\*\*를 사용해 DB를 안전하게 조회하고, \*\*10분(예시)짜리 임시 `Signed URL`\*\*을 생성하여 뷰어에 전달합니다.

-----

## 📊 4. 데이터베이스 스키마

1.  **`models`**
      * `id` (uuid, PK)
      * `name` (text): 관리자 식별용 이름
      * `storage_path` (text): 스토리지 내부 파일 경로
      * `file_size_bytes` (bigint): 파일 크기
      * `is_draco_compressed` (boolean, default: false): Draco 압축 여부
      * `is_ktx2` (boolean, default: false): KTX2 텍스처 압축 여부
2.  **`demos`**
      * `id` (uuid, PK)
      * `model_id` (uuid, FK `models.id`)
      * `access_code` (text, unique): 6자리 접속/공유 코드
      * `is_active` (boolean, default: `true`): 데모 활성화 여부
      * `expires_at` (timestampz, nullable): 데모 만료 일시
      * `created_by` (uuid, FK `auth.users`): 데모 생성 관리자 ID
      * `access_count` (int, default: 0): 접근 횟수 통계
      * `last_accessed_at` (timestampz, nullable): 마지막 접근 일시 통계

-----

## 🖥️ 5. 핵심 기능 명세

### 5.1. 관리자 (Admin) 기능

  * **인증:**
      * `/admin/login` 경로에서 Supabase Auth로 로그인합니다.
      * \*\*클라이언트 가드 (`/admin/layout.tsx`)\*\*를 사용해 비로그인 사용자는 `/admin/login`으로 리디렉션합니다. (미들웨어 방식 대신 안정적인 클라이언트 방식 채택)
  * **대시보드 (`/admin/dashboard`):**
      * 통계(`총 모델`, `활성 데모`, `총 접근`) 카드를 표시합니다.
      * `models` 목록과 `demos` 목록을 테이블로 표시합니다.
      * `demos` 목록에서 **일괄 활성화/비활성화/삭제** 기능을 제공합니다.
  * **모델 업로드 (FileUploadModal.tsx):**
      * **(핵심)** 수동 `div`/`label` 대신 **`react-dropzone` 라이브러리**를 사용합니다.
      * `react-dropzone`의 `useDropzone` 훅을 사용하여 `getRootProps()`(드래그 영역), `getInputProps()`(숨겨진 input)를 사용합니다.
      * **검증:** `react-dropzone`의 `accept` 옵션으로 `.glb` (MIME: `model/gltf-binary`)만 허용합니다. `maxSize` 옵션으로 **1GB** 제한을 설정합니다.
      * **에러:** `onDropRejected` 콜백을 사용해 "파일 형식이 다릅니다" 또는 "1GB를 초과합니다" 같은 **인라인 에러 메시지**를 표시합니다. (`alert` 금지)
      * **진행률:** Supabase `upload()` SDK의 **`onUploadProgress`** 콜백을 사용해 업로드 진행률(%)을 프로그레스 바로 표시합니다.
      * **분석:** 업로드 전 `.glb` 파일 헤더를 분석하여 `is_draco_compressed` 값을 DB에 저장합니다.
  * **데모 생성 (CreateDemoModal.tsx):**
      * `models` 목록에서 모델을 선택합니다.
      * 6자리 `access_code`를 자동 생성합니다.
      * `expires_at` (만료일)을 캘린더로 선택할 수 있게 합니다.

### 5.2. 사용자 (User) 기능

  * **접속 (방법 1: 접속 코드):**
      * 메인 페이지(`/`)에서 6자리 코드를 입력합니다.
      * '확인' 버튼 클릭 시, 브라우저는 `/[입력한 코드]` 경로로 리디렉션합니다.
  * **접속 (방법 2: 공유 링크):**
      * `https://[도메인]/[6자리 코드]` 링크로 직접 접속합니다.
  * **뷰어 로딩 (`/[code]/page.tsx`):**
      * **서버 컴포넌트**로 실행됩니다.
      * URL `[code]`를 사용해 `demos` DB를 조회하고 정책(활성화/만료)을 **검증**합니다.
      * 검증 성공 시 `models` DB에서 `storage_path`와 압축 플래그를 조회합니다.
      * **10분짜리 임시 `Signed URL`을 생성**합니다.
      * `access_count`를 1 증가시키고 `last_accessed_at`을 갱신합니다.
      * `DynamicModelViewer` 컴포넌트에 `Signed URL`과 압축 정보를 전달하여 렌더링합니다.

-----

## 🧩 6. 핵심 컴포넌트 설계

### 6.1. `DynamicModelViewer` (뷰어)

  * `<model-viewer>` 웹 컴포넌트를 React로 감싸(`"use client"`) 만듭니다.
  * **Props:** `src` (Signed URL), `poster` (썸네일), `isDraco` (압축 여부).
  * **성능:** `reveal="interaction"` (클릭 시 로드) 속성을 사용합니다.
  * **디코더:** `draco-decoder-path`와 `ktx2-decoder-path`가 `/public` 폴더의 디코더 파일을 가리키도록 설정합니다.

### 6.2. `FileUploadModal` (업로드 모달)

  * `"use client"`로 선언하고 \*\*`react-dropzone`\*\*을 사용합니다.
  * `useDropzone` 훅을 사용해 클릭/드래그앤드롭 영역을 구현합니다.
  * `onDropAccepted` (성공 시): 파일을 `useState`에 저장합니다.
  * `onDropRejected` (실패 시): `fileRejection` 객체에서 에러 코드(예: `file-too-large`)를 받아 인라인 에러 메시지를 표시합니다.
  * `onSubmit` (업로드 버튼): `onUploadProgress`를 포함한 Supabase 업로드 로직을 실행합니다.

-----

## 📈 7. 모니터링 및 테스트

  * **모니터링:** Vercel Analytics(성능)와 Sentry(에러 트래킹)를 연동합니다. Sentry `beforeSend` 훅을 사용해 Signed URL의 민감한 토큰이 로그에 남지 않도록 필터링합니다.
  * **E2E 테스트 (Playwright):**
      * **관리자:** 로그인 -\> 업로드 (1GB 파일 포함) -\> 데모 생성.
      * **사용자:** 코드 접속 -\> 모델 확인 (성공) / 만료된 코드 접속 -\> 에러 페이지 확인 (실패).
  * **수동 테스트 (필수):** **iOS Safari**에서 클릭/드래그 업로드 및 뷰어 로딩을 집중적으로 검증합니다.
