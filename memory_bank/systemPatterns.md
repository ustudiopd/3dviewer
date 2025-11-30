# 시스템 아키텍처 및 패턴 (System Patterns)

## 1. 전체 아키텍처  
- **아키텍처 스타일**: Monolithic (Next.js Full-Stack)
- **구조**: 
  - **프론트엔드**: Next.js App Router 기반 React 애플리케이션
  - **백엔드**: Next.js API Routes (Serverless Functions)
  - **데이터베이스**: Supabase (PostgreSQL + Storage)
  - **인증**: Supabase Auth (서버 사이드 세션 관리)
- **렌더링 전략**: 
  - Server Components: 기본적으로 서버 컴포넌트 사용
  - Client Components: 인터랙티브 기능이 필요한 경우에만 `'use client'` 사용
  - 동적 라우팅: `[code]` 동적 세그먼트를 통한 데모 접근

## 2. 주요 디자인 패턴  
- **컴포넌트 패턴**: 
  - 함수형 컴포넌트 (React Hooks)
  - 컴포넌트 분리: UI 컴포넌트와 비즈니스 로직 분리
  - 재사용 가능한 컴포넌트 (FileUploadModal, CreateDemoModal 등)
- **데이터 페칭**: 
  - Server Components에서 직접 Supabase 쿼리
  - Client Components에서 `useEffect`를 통한 데이터 로드
  - API Routes를 통한 서버 사이드 로직 처리
- **상태 관리**: 
  - 로컬 상태: `useState` 훅 사용
  - 서버 상태: Supabase 실시간 구독 (필요시)
  - 폼 상태: 제어 컴포넌트 패턴
- **에러 처리**: 
  - Try-catch 블록을 통한 에러 핸들링
  - 사용자 친화적 에러 메시지 표시
  - 콘솔 로깅을 통한 디버깅

## 3. 코딩 컨벤션  
- **네이밍 규칙**: 
  - 컴포넌트: PascalCase (예: `DynamicModelViewer`)
  - 함수/변수: camelCase (예: `loadData`, `handleSubmit`)
  - 상수: UPPER_SNAKE_CASE (예: `SUPABASE_URL`)
  - 파일명: 컴포넌트는 PascalCase, 유틸리티는 camelCase
- **타입스크립트**: 
  - 명시적 타입 정의 (any 사용 최소화)
  - 인터페이스 정의 (`types/` 디렉토리)
  - Props 타입 명시
- **스타일링**: 
  - Tailwind CSS 유틸리티 클래스 우선 사용
  - 인라인 스타일은 동적 스타일링이 필요한 경우에만 사용
  - 반응형 디자인: 모바일 우선 접근
- **코드 구조**: 
  - 파일 상단: 모듈 설명 주석
  - 의존성 임포트 (표준 라이브러리 → 서드파티 → 내부 모듈)
  - 상수 정의
  - 컴포넌트/함수 정의
  - 메인 실행 블록 (필요시)

## 4. 보안 패턴
- **인증**: 
  - Supabase Auth를 통한 관리자 로그인
  - 서버 사이드 세션 검증
  - API Routes에서 인증 확인
- **데이터 접근**: 
  - Row Level Security (RLS) 정책 활용
  - 모든 INSERT/UPDATE/DELETE 작업은 RPC 함수를 통해 수행
  - RPC 함수는 `SECURITY DEFINER`로 실행되어 권한 문제 해결
  - Public 뷰를 통한 SELECT 작업 (security_invoker = true)
  - Service Role Key는 서버 사이드에서만 사용
  - 클라이언트는 Anon Key만 사용
- **파일 업로드**: 
  - 파일 타입 검증 (GLB/GLTF만 허용)
  - 파일 크기 제한 (5GB)
  - Supabase Storage 버킷 정책 설정

## 5. 성능 최적화
- **3D 모델 로딩**: 
  - Draco 압축 지원 (파일 크기 감소)
  - KTX2 텍스처 지원 (텍스처 최적화)
  - 로딩 진행률 표시로 사용자 경험 개선
- **렌더링 최적화**: 
  - `model-viewer`의 자동 최적화 기능 활용
  - HDR 환경 맵 캐싱
  - 불필요한 리렌더링 방지 (React.memo, useMemo 활용 가능)
- **빌드 최적화**: 
  - Next.js 자동 코드 스플리팅
  - 정적 페이지 생성 (가능한 경우)
  - 이미지 최적화 (Next.js Image 컴포넌트)
