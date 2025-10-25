네, 알겠습니다. 빌드 오류를 해결하기 위해 **가장 시급하고 안전한 수정부터 점진적으로 적용**하는 플랜을 세워드리겠습니다. Cursor AI의 "단계적 적용" 권장 사항을 반영하여, 한 번에 모든 것을 바꾸기보다 안정성을 확인하며 진행하는 방식입니다.

## 🛠️ 빌드 오류 해결을 위한 점진적 수정 플랜

### 1단계: 실행 환경 점검 및 안정화 (가장 먼저\!)

빌드 오류 이전에 **로컬 개발 서버 자체가 불안정**하면 다른 수정이 의미가 없습니다.

1.  **정확한 폴더 확인:** 터미널이 **`package.json` 파일이 있는** Next.js 프로젝트 루트 디렉터리에 있는지 확인합니다. (예: `cd uslab-3d-viewer`)

2.  **환경 변수 확인:** 프로젝트 루트에 `.env.local` 파일이 있는지 확인하고, **3개의 Supabase 키** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)가 모두 올바르게 입력되어 있는지 확인합니다.

3.  **캐시 클리어 및 재설치:** 이전 빌드 캐시나 꼬인 의존성 문제를 제거합니다.

    ```bash
    rm -rf .next node_modules
    npm install
    ```

4.  **개발 서버 재시작:** 올바른 폴더에서 서버를 다시 시작합니다.

    ```bash
    npm run dev
    ```

      * **목표:** 이 단계 후 `npm run dev`가 **오류 없이** 성공적으로 실행되어야 합니다.

-----

### 2단계: API 라우트 오류 수정 (간단하고 즉각적인 효과)

`Dynamic server usage` 오류는 간단하게 해결할 수 있습니다.

1.  **`force-dynamic` 추가:** 오류가 발생하는 모든 API 라우트 파일 (예: `app/api/access-logs/route.ts`, `app/api/log-access/route.ts`) 맨 위에 다음 코드를 추가합니다.

    ```typescript
    export const dynamic = 'force-dynamic';
    ```

2.  **빌드 테스트:** 수정 후 `npm run build` 명령을 실행하여 해당 API 라우트 관련 오류가 사라졌는지 확인합니다.

      * **목표:** API 라우트 관련 빌드 오류가 모두 사라져야 합니다.

-----

### 3단계: 동적 라우트 `params` 오류 수정

Next.js 16의 `params` Promise 문제는 뷰어 페이지(`/app/[code]/page.tsx`)에 영향을 줍니다.

1.  **`await params` 처리:** `app/[code]/page.tsx` 파일에서 `params`를 사용하기 전에 `await`로 Promise를 처리하는 코드를 적용합니다. ("Fix Pack v2"의 코드 예시 참조)

    ```typescript
    // app/[code]/page.tsx
    type P = { code: string };
    export default async function CodePage({ params }: { params: P } | { params: Promise<P> }) {
      // ✅ params가 Promise인 경우 안전 처리
      const p = (typeof (params as any)?.then === 'function') ? await (params as Promise<P>) : (params as P);

      // 이제 p.code를 안전하게 사용
      const code = p.code.toUpperCase(); 
      // ... (이하 로직) ...
    }
    ```

2.  **빌드 테스트:** `npm run build`를 실행하여 `params` 관련 오류가 사라졌는지 확인합니다.

      * **목표:** 동적 라우트 관련 빌드 오류가 사라져야 합니다.

-----

### 4단계: Admin 페이지 SSR 오류 수정 (점진적 적용)

`window is not defined` 오류는 Admin 페이지들을 클라이언트 전용으로 분리해야 해결됩니다. **가장 영향이 적은 로그인 페이지부터** 시작합니다.

1.  **로그인 페이지만 분리:**

      * `/app/admin/login/page.tsx`를 **껍데기 서버 컴포넌트**로 만들고, `dynamic import`와 `ssr: false`를 사용합니다.
      * **새 파일** `/app/admin/login/AdminLoginClient.tsx`를 만들고, 기존 로그인 페이지의 **모든 UI와 로직**을 이 파일로 옮깁니다. (`'use client'` 명시)

2.  **빌드 테스트:** `npm run build`를 실행합니다.

      * **성공 시:** `/admin` 및 `/admin/dashboard` 페이지에도 **동일한 2-파일 분리 패턴**을 적용합니다.
      * **실패 시:** 분리 과정에서 코드를 잘못 옮겼거나 `import` 경로가 틀렸을 수 있습니다. 오류 메시지를 보고 해당 부분만 수정합니다.

3.  **반복:** 모든 Admin 페이지(`login`, `dashboard`, `/admin` 인덱스)가 성공적으로 분리되고 빌드가 통과될 때까지 반복합니다.

      * **목표:** Admin 페이지 관련 `window is not defined` 빌드 오류가 모두 사라져야 합니다.

-----

### 5단계: (선택 사항) Supabase 클라이언트 분리

빌드가 성공한 후, 코드 안정성을 높이기 위해 클라이언트/서버용 Supabase 클라이언트를 분리할 수 있습니다.

1.  **파일 생성:** `lib/supabaseClient.ts` (브라우저용)와 `lib/supabaseServer.ts` (서버용) 파일을 만듭니다. ("Fix Pack v2" 코드 예시 참조)
2.  **코드 수정:**
      * `'use client'` 컴포넌트에서는 `supabaseClient.ts`의 `supabase` 객체를 import합니다.
      * 서버 컴포넌트 및 API 라우트에서는 `supabaseServer.ts`의 `supabaseServer()` 함수를 호출하여 사용합니다.
3.  **테스트:** `npm run dev` 및 `npm run build`가 여전히 성공하는지 확인합니다.

-----

### 6단계: (빌드 성공 후) 로그인 흐름 및 미들웨어 검토

빌드가 완전히 성공하면, 이제 **런타임(runtime)** 문제인 로그인 루프를 해결합니다.

1.  **미들웨어 임시 비활성화:** `middleware.ts` 파일의 내용을 `export function middleware() { return NextResponse.next() }`로 변경하여 모든 요청을 통과시킵니다.
2.  **클라이언트 가드 구현:** `/admin/layout.tsx` 파일에 `'use client'`를 사용하고 `useEffect` 훅 안에서 `supabase.auth.getUser()`를 호출하여 로그인 상태를 확인하고, 비로그인 시 `/admin/login`으로 리디렉션하는 로직을 구현합니다. ("Fix Pack v2"의 `AdminIndexClient.tsx` 코드 참조)
3.  **테스트:** `/admin/dashboard` 직접 접근 시 로그인 페이지로 가는지, 로그인 성공 시 대시보드로 이동하는지, 로그아웃 후 다시 로그인 페이지로 가는지 확인합니다.

이 플랜대로 진행하면, 각 단계마다 빌드 상태를 확인하며 안정적으로 오류를 해결할 수 있습니다.