export interface Model {
  id: string;
  name: string;
  storage_path: string;
  file_size_bytes: number;
  is_draco_compressed: boolean;
  is_ktx2: boolean;
  created_at: string;
  updated_at: string;
}

export interface Demo {
  id: string;
  model_id: string;
  access_code: string;
  is_active: boolean;
  expires_at: string | null;
  created_by: string;
  access_count: number;
  last_accessed_at: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  model?: Model;
}

export interface DashboardStats {
  total_models: number;
  active_demos: number;
  total_access: number;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface CreateDemoData {
  model_id: string;
  expires_at: string | null;
}

export interface UploadFileData {
  file: File;
  name: string;
}

export interface AccessLog {
  id: string;
  demo_id: string;
  access_code: string;
  user_ip: string | null;
  user_agent: string | null;
  accessed_at: string;
  created_at: string;
}

