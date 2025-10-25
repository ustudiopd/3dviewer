# 3Dviewer

3D 모델을 안전하게 시연하는 뷰어 시스템

## 🚀 기능

- **3D 모델 뷰어**: GLB 파일을 웹에서 직접 시연
- **관리자 대시보드**: 모델 업로드, 데모 생성, 접속 로그 관리
- **접속 코드 시스템**: 8자리 코드로 안전한 접속
- **실시간 로그**: 접속 시간, IP, User Agent 수집
- **모바일 최적화**: 반응형 디자인으로 모든 기기 지원

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **3D 렌더링**: @google/model-viewer
- **Backend**: Supabase (Database, Storage, Auth)
- **File Upload**: react-dropzone
- **Icons**: Lucide React

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/ustudiopd/3dviewer.git
cd 3dviewer
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 브라우저에서 확인
- 메인 페이지: http://localhost:3000
- 관리자 페이지: http://localhost:3000/admin

## 🗄️ 데이터베이스 스키마

### Models 테이블
```sql
CREATE TABLE models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  is_draco_compressed BOOLEAN DEFAULT FALSE,
  is_ktx2 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Demos 테이블
```sql
CREATE TABLE demos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  access_code VARCHAR(8) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255),
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Access Logs 테이블
```sql
CREATE TABLE access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demo_id UUID REFERENCES demos(id) ON DELETE CASCADE,
  access_code VARCHAR(8) NOT NULL,
  user_ip INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 주요 기능

### 사용자 기능
- **접속 코드 입력**: 8자리 코드로 3D 모델 시연
- **3D 모델 조작**: 마우스/터치로 회전, 확대/축소, 이동
- **모바일 지원**: 터치 제스처로 직관적인 조작

### 관리자 기능
- **모델 업로드**: GLB 파일 업로드 및 관리
- **데모 생성**: 접속 코드와 만료일 설정
- **접속 로그**: 사용자 접속 기록 및 통계
- **모델 관리**: 모델명 수정, 삭제
- **데모 관리**: 활성화/비활성화, 메모 추가

## 🔒 보안

- **Row Level Security (RLS)**: Supabase RLS로 데이터 보안
- **접속 코드**: 8자리 랜덤 코드로 안전한 접속
- **만료일 설정**: 데모별 만료일 관리
- **관리자 인증**: Supabase Auth 기반 관리자 로그인

## 📱 모바일 최적화

- **반응형 디자인**: 모든 화면 크기 지원
- **터치 제스처**: 핀치 줌, 드래그 회전
- **모바일 UI**: 터치 친화적 버튼과 인터페이스

## 🚀 배포

### Vercel 배포
1. Vercel 계정에 GitHub 리포지토리 연결
2. 환경 변수 설정
3. 자동 배포 완료

### 환경 변수 설정
배포 시 다음 환경 변수들을 설정하세요:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📄 라이선스

MIT License

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**3Dviewer** - 3D 모델을 안전하게 시연하는 뷰어 시스템 🎯