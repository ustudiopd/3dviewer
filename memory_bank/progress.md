# 완료된 작업 내역 (Progress)

## [2024-11-30]
- **Supabase 프로젝트 마이그레이션**: 
  - 기존 3Dviewer 프로젝트에서 uslab 프로젝트로 마이그레이션 완료
  - 프로젝트 ID: `xiygbsaewuqocaxoxeqn`
  - DB 데이터 초기화 완료
- **RLS 정책 및 RPC 함수 구현**: 
  - 모든 INSERT/UPDATE/DELETE 작업을 RPC 함수로 전환
  - `insert_model`, `update_model`, `delete_model` 함수 생성
  - `insert_demo`, `update_demo`, `delete_demo` 함수 생성
  - `insert_access_log` 함수 생성
  - `get_demo_by_code`, `get_demo_with_model` 함수 생성
  - 모든 RPC 함수에 `SECURITY DEFINER` 설정으로 권한 문제 해결
- **Public 뷰 재생성**: 
  - `public.models`, `public.demos`, `public.access_logs` 뷰 재생성
  - `security_invoker = true` 설정으로 RLS 정책 올바르게 적용
  - 모든 역할(anon, authenticated, service_role)에 SELECT 권한 부여
- **Storage 버킷 설정**: 
  - 파일 크기 제한 5GB로 증가
  - 버킷 이름: `glb-models-private`
- **데모 생성 및 조회 기능 개선**: 
  - 데모 생성 시 고유 코드 확인 로직 개선 (`.maybeSingle()` 사용)
  - 데모 조회 시 RPC 함수 사용으로 권한 문제 해결
  - 모델 조회도 RPC 함수로 통합하여 한 번의 호출로 처리
- **코드 품질 개선**: 
  - `.single()` 대신 `.maybeSingle()` 사용으로 오류 처리 개선
  - RPC 함수를 통한 데이터 접근으로 권한 문제 완전 해결

## [2024-12-19]  
- **3D 뷰어 UI 리팩토링**: 
  - 헤더를 작은 버튼 형태로 변경 (상단 왼쪽 배치)
  - 모델명 버튼과 홈 버튼을 컴팩트하게 통합
  - 조작 방법을 하단에서 상단 툴팁으로 이동
  - 툴팁은 모델명 클릭 시 토글되도록 구현
  - 툴팁에 닫기 버튼 추가
- **관리자 대시보드 UI 개선**: 
  - 중복된 헤더 제거 (AdminLayout의 헤더만 유지)
  - 일관된 네비게이션 구조 확립
- **3D 렌더링 품질 향상**: 
  - Babylon.js Sandbox 스타일 그라데이션 배경 적용
  - HDR 환경 맵을 통한 고품질 조명 효과
  - 바닥 반사 효과 강화 (environment-image, exposure, shadow-intensity)
  - 모델 가시성 개선을 위한 광원 설정 최적화
- **빌드 및 배포**: 
  - 프로덕션 빌드 성공 확인
  - GitHub에 변경사항 푸시 완료

## [이전 작업들]
- **프로젝트 초기 설정**: 
  - Next.js 14 App Router 프로젝트 생성
  - TypeScript 설정
  - Tailwind CSS 설정
  - Supabase 연동
- **3D 뷰어 구현**: 
  - `@google/model-viewer` 통합
  - 동적 라우팅 (`/[code]`) 구현
  - 모델 로딩 진행률 표시
  - 접속 로그 수집 기능
- **관리자 시스템 구현**: 
  - 관리자 로그인 페이지
  - 관리자 대시보드 (모델/데모 관리)
  - 파일 업로드 기능 (GLB/GLTF, Draco, KTX2 지원)
  - 데모 생성 및 관리 기능
  - 접속 로그 조회 기능
- **데이터베이스 스키마**: 
  - models, demos, access_logs 테이블 생성
  - Supabase Storage 버킷 설정
  - Row Level Security (RLS) 정책 설정
