# 기술 스택 정보 (Tech Context)

## 1. 프레임워크 및 라이브러리  
- **언어 및 버전**: 
  - TypeScript 5.0+
  - Node.js v20.x
- **핵심 프레임워크**: 
  - Next.js 14.2.33 (App Router)
  - React 18.0+
- **데이터베이스**: 
  - Supabase (PostgreSQL 기반)
  - Supabase Storage (3D 모델 파일 저장)
- **상태 관리**: 
  - React Hooks (useState, useEffect)
  - 서버 컴포넌트와 클라이언트 컴포넌트 분리
- **UI 라이브러리**: 
  - Tailwind CSS 3.3.0
  - Lucide React (아이콘)
  - clsx, tailwind-merge (스타일 유틸리티)
- **3D 렌더링**: 
  - @google/model-viewer 3.2.1 (웹 기반 3D 모델 뷰어)
- **주요 라이브러리**: 
  - @supabase/supabase-js 2.38.0 (Supabase 클라이언트)
  - react-dropzone 14.2.3 (파일 업로드)

## 2. 개발 환경  
- **패키지 매니저**: npm
- **Linter / Formatter**: 
  - ESLint 8.0+ (Next.js 기본 설정)
  - TypeScript 컴파일러
- **테스트**: 
  - Playwright 1.40.0 (E2E 테스트)
  - Vitest 1.0.0 (유닛 테스트)

## 3. 배포 환경  
- **호스팅**: Vercel (Next.js 최적화)
- **CI/CD**: GitHub Actions (예정)
- **환경 변수**: 
  - `.env.local` 파일 사용
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 필수
  - `ADMIN_PASSWORD` (관리자 비밀번호)

## 4. 파일 구조
- **App Router 구조**: 
  - `app/`: Next.js App Router 페이지 및 라우트
  - `app/[code]/page.tsx`: 동적 라우트 (데모 접근 코드)
  - `app/admin/`: 관리자 페이지
  - `app/api/`: API 라우트
- **컴포넌트**: 
  - `components/`: 재사용 가능한 React 컴포넌트
  - `components/DynamicModelViewer.tsx`: 메인 3D 뷰어 컴포넌트
- **유틸리티**: 
  - `lib/`: 유틸리티 함수 및 설정
  - `lib/supabase.ts`: Supabase 클라이언트 설정
- **타입 정의**: 
  - `types/`: TypeScript 타입 정의
