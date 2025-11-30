# 현재 작업 상황 (Active Context)

## 1. 현재 집중하고 있는 작업  
- **작업명**: Supabase 마이그레이션 완료 및 권한 문제 해결
- **목표**: uslab 프로젝트로 완전히 마이그레이션하고 모든 기능이 정상 작동하도록 확인
- **상태**: ✅ 완료 - 데모 생성 및 조회 기능 정상 작동 확인
- **담당자**: AI Assistant

## 2. 다음 예정 작업  
- **우선순위 높음**: 
  - 빌드 테스트 및 GitHub 푸시
  - Vercel 배포 확인
  - 사용자 피드백 수집 및 개선사항 반영
- **기술 부채**: 
  - ESLint 경고 해결 (useEffect 의존성 배열)
  - Next.js viewport 메타데이터 경고 해결 (metadata에서 viewport 분리)

## 3. 주요 이슈 및 블로커  
- **현재 블로커**: 없음
- **알려진 이슈**: 
  - ESLint 경고: `DynamicModelViewer.tsx`의 `useEffect`에 `logAccess` 의존성 누락 (기능에는 영향 없음)
  - Next.js 경고: viewport 메타데이터를 별도 export로 분리 권장 (기능에는 영향 없음)
- **해결된 이슈**: 
  - ✅ 중복 헤더 문제 해결
  - ✅ 3D 뷰어 배경색 문제 해결
  - ✅ 모델 가시성 문제 해결 (광원 효과 개선)
  - ✅ Supabase 프로젝트 마이그레이션 완료
  - ✅ RLS 정책 및 권한 문제 완전 해결
  - ✅ 데모 생성 및 조회 기능 정상 작동 확인

## 4. 최근 변경사항
- **Supabase 마이그레이션**: 
  - uslab 프로젝트로 완전 마이그레이션 완료
  - DB 데이터 초기화 및 재구성
  - Storage 버킷 파일 크기 제한 5GB로 증가
- **데이터베이스 아키텍처 개선**: 
  - 모든 데이터 조작을 RPC 함수로 전환 (권한 문제 해결)
  - Public 뷰 재생성 및 권한 재설정
  - `get_demo_with_model` RPC 함수로 데모와 모델을 한 번에 조회
- **코드 개선**: 
  - `.maybeSingle()` 사용으로 오류 처리 개선
  - RPC 함수를 통한 안전한 데이터 접근
  - 데모 생성 및 조회 기능 완전 수정

## 5. 기술 스택 현황
- **프레임워크**: Next.js 14.2.33 (App Router)
- **언어**: TypeScript 5.0+
- **스타일링**: Tailwind CSS 3.3.0
- **3D 렌더링**: @google/model-viewer 3.2.1
- **백엔드**: Supabase (PostgreSQL + Storage)
- **배포**: Vercel (예정)

## 6. 다음 세션을 위한 참고사항
- 메모리뱅크 문서들이 최신 상태로 업데이트됨
- 프로젝트 구조와 패턴이 문서화됨
- 최근 작업 내역이 progress.md에 기록됨
- 새로운 기능 개발 시 plan.md 생성 권장
