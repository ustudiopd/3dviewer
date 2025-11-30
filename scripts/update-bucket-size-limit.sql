-- Supabase Storage 버킷의 파일 크기 제한을 5GB로 업데이트하는 SQL
-- Supabase Dashboard의 SQL Editor에서 실행하세요

-- 버킷 설정 업데이트 (file_size_limit을 5GB로 설정)
-- 참고: Supabase Storage 버킷 설정은 SQL로 직접 변경할 수 없으므로
-- Dashboard에서 수동으로 변경하거나 Storage API를 사용해야 합니다.

-- 대신 버킷 정책을 확인하고 필요시 업데이트
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'glb-models-private';

-- 버킷이 없으면 생성 (5GB 제한)
-- 주의: 이미 버킷이 있으면 이 쿼리는 실행하지 마세요
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'glb-models-private',
  'glb-models-private',
  false,
  5368709120, -- 5GB in bytes
  ARRAY['model/gltf-binary', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE
SET 
  file_size_limit = 5368709120,
  allowed_mime_types = ARRAY['model/gltf-binary', 'application/octet-stream'];

