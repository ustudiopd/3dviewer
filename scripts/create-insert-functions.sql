-- 3dviewer 스키마에 데이터를 삽입하기 위한 RPC 함수 생성
-- Public 뷰는 읽기 전용이므로 RPC 함수를 통해 INSERT 수행
-- 
-- 사용 방법: Supabase Dashboard의 SQL Editor에서 이 파일의 내용을 실행하세요
-- https://supabase.com/dashboard/project/xiygbsaewuqocaxoxeqn/sql/new

-- Models 삽입 함수
CREATE OR REPLACE FUNCTION public.insert_model(
  p_name VARCHAR(255),
  p_storage_path TEXT,
  p_file_size_bytes BIGINT,
  p_is_draco_compressed BOOLEAN DEFAULT FALSE,
  p_is_ktx2 BOOLEAN DEFAULT FALSE,
  p_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO "3dviewer".models (
    name, storage_path, file_size_bytes, 
    is_draco_compressed, is_ktx2, created_at, updated_at
  )
  VALUES (
    p_name, p_storage_path, p_file_size_bytes,
    p_is_draco_compressed, p_is_ktx2, p_created_at, p_updated_at
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Demos 삽입 함수
CREATE OR REPLACE FUNCTION public.insert_demo(
  p_model_id UUID,
  p_access_code VARCHAR(8),
  p_is_active BOOLEAN DEFAULT TRUE,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_created_by VARCHAR(255) DEFAULT NULL,
  p_access_count INTEGER DEFAULT 0,
  p_last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_memo TEXT DEFAULT NULL,
  p_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO "3dviewer".demos (
    model_id, access_code, is_active, expires_at,
    created_by, access_count, last_accessed_at, memo,
    created_at, updated_at
  )
  VALUES (
    p_model_id, p_access_code, p_is_active, p_expires_at,
    p_created_by, p_access_count, p_last_accessed_at, p_memo,
    p_created_at, p_updated_at
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Access Logs 삽입 함수 (배치 삽입용)
CREATE OR REPLACE FUNCTION public.insert_access_logs(
  p_logs JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_record JSONB;
  inserted_count INTEGER := 0;
BEGIN
  FOR log_record IN SELECT * FROM jsonb_array_elements(p_logs)
  LOOP
    INSERT INTO "3dviewer".access_logs (
      demo_id, access_code, user_ip, user_agent,
      accessed_at, created_at
    )
    VALUES (
      (log_record->>'demo_id')::UUID,
      log_record->>'access_code',
      NULLIF(log_record->>'user_ip', '')::INET,
      log_record->>'user_agent',
      (log_record->>'accessed_at')::TIMESTAMP WITH TIME ZONE,
      (log_record->>'created_at')::TIMESTAMP WITH TIME ZONE
    );
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;



