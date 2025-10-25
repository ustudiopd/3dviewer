좋아요. 최신 **빌드 오류 보고서**를 기준으로 다시 진단하고, **지금 바로 초록불(✅) 빌드**까지 가는 “두 번째 Fix Pack”을 정리해 드립니다. 결론부터 말하면, **Admin 영역의 SSR 차단**, **API 라우트 강제 Dynamic**, **Next 16의 `params` Promise 언랩**, **실행 디렉터리/환경변수 정리** 4가지는 반드시 동시에 반영해야 합니다. 보고서에 적힌 오류 양상과 체크리스트 상태가 그걸 뒷받침합니다.  

---

## 0) 스냅샷 — 무엇이 아직 안 된 건가요?

* **SSR에서 `window is not defined`가 Admin 3페이지(`/admin`, `/admin/login`, `/admin/dashboard`)에 남아있음** → Admin을 “클라이언트 전용”으로 완전히 분리해야 합니다. 보고서에서도 Dynamic Import 미완성으로 판단하고 있습니다. 
* **API 라우트가 정적으로 렌더링되려다 실패(`Dynamic server usage…`)** → 각 `app/api/**/route.ts` 상단에 `export const dynamic = 'force-dynamic'` 선언이 누락되어 있습니다. 
* **Next.js 16 동적 라우트 `params`가 Promise** → `[code]` 등에서 `await params`가 필요합니다. (이슈는 분석 보고서에도 명시되어 있음) 
* **로컬 실행 자체가 잘못된 디렉터리/PowerShell `&&` 문제/`.env.local` 누락** 가능성 존재 → 서버가 제대로 안 뜨면 404처럼 보입니다. 보고서가 그대로 지적합니다. 
* (부수) **Login 루프·쿠키/로컬스토리지 불일치** 로그 존재 → 미들웨어 기반 SSR 가드는 일단 비활성화하고 클라이언트 가드로 운영하는 트랙을 권장합니다. 또한 GoTrue 클라이언트 중복 생성 경고도 정리해야 합니다. 

> 참고: 이전 리포트에서는 일부 항목이 처리된 것으로 체크된 버전도 보이는데(부분 완료), **현재 리포트에서는 대부분 미적용 상태**로 집계되어 있습니다. 일관성 유지를 위해 본 답변은 **“아직 미적용” 기준**으로 단계별 패치를 안내합니다.  

---

## 1) Fix Pack v2 — 복붙해서 적용하는 최소 수정

### 1-1. Admin 영역: **SSR 완전 차단 + 클라이언트 전용 진입**

Admin의 각 페이지 파일을 **얇은 래퍼**로 만들고, 실제 화면은 `ssr:false`인 클라이언트 컴포넌트에서만 동작하게 합니다. 이렇게 하면 서버 단계에서 `window`/`localStorage`/`useRouter` 접근이 없어져 빌드/런타임 에러가 사라집니다. 보고서의 권고와 일치합니다. 

```tsx
// app/admin/page.tsx
import dynamic from 'next/dynamic';
const AdminIndexClient = dynamic(() => import('./AdminIndexClient'), { ssr: false, loading: () => <div/> });
export default function AdminIndexPage() { return <AdminIndexClient />; }
```

```tsx
// app/admin/AdminIndexClient.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminIndexClient() {
  const r = useRouter();
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!alive) return;
      r.replace(user ? '/admin/dashboard' : '/admin/login');
    });
    return () => { alive = false; };
  }, [r]);
  return null;
}
```

```tsx
// app/admin/login/page.tsx
import dynamic from 'next/dynamic';
const AdminLoginClient = dynamic(() => import('./AdminLoginClient'), { ssr: false, loading: () => <div/> });
export default function AdminLoginPage() { return <AdminLoginClient />; }
```

```tsx
// app/admin/login/AdminLoginClient.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminLoginClient() {
  const r = useRouter();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [err, setErr] = useState<string|null>(null); const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) { setErr('로그인 실패: ' + error.message); return; }
    r.replace('/admin/dashboard');
  };

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-4">관리자 로그인</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@company.com"/>
        <input className="w-full border rounded px-3 py-2" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호"/>
        <button disabled={loading} className="w-full bg-slate-800 text-white rounded py-2">{loading ? '로그인 중...' : '로그인'}</button>
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </form>
    </main>
  );
}
```

```tsx
// app/admin/dashboard/page.tsx
import dynamic from 'next/dynamic';
const AdminDashboardClient = dynamic(() => import('./AdminDashboardClient'), { ssr: false, loading: () => <div/> });
export default function AdminDashboardPage() { return <AdminDashboardClient />; }
```

> **미들웨어 인증 가드**는 현재 단계에선 끄거나(통과) 최소화하세요. 로컬스토리지/쿠키 세션 불일치로 **/admin → /admin/login 루프**가 계속됩니다(보고서의 실제 현상). 이후 보안 고도화 단계에서 SSR 가드를 복구하는 게 안전합니다. 

---

### 1-2. Supabase 클라이언트 **분리(브라우저/서버)**

서버 파일에서 브라우저용 클라이언트를 import 하면 번들/SSR 시점에 문제가 납니다. **클라 전용**과 **서버 전용**을 분리하면 안정됩니다. (빌드 안정화에 기여)  

```ts
// lib/supabaseClient.ts (브라우저 전용)
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);
```

```ts
// lib/supabaseServer.ts (서버 전용, RSC/Route용)
import { createClient } from '@supabase/supabase-js';
export const supabaseServer = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
```

> **규칙**:
>
> * `'use client'` 컴포넌트에서는 `supabaseClient`만.
> * **서버 컴포넌트/Route**에서는 `supabaseServer`만.
>   또한 “**Multiple GoTrueClient instances**” 경고가 있었으니 브라우저에서 **단일 인스턴스**만 생성되도록 위처럼 파일을 한 곳에서만 import 하세요. 

---

### 1-3. API 라우트: **정적 생성 금지(강제 Dynamic)**

정적으로 만들려다 실패하는 문제를 라우트 상단 한 줄로 막습니다. 보고서의 해결책과 동일합니다. 

```ts
// app/api/access-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const demoId = url.searchParams.get('demoId');
  // ... 기존 로직
  return NextResponse.json({ ok: true, demoId });
}
```

동일하게 **모든 `app/api/**/route.ts`**에 `export const dynamic = 'force-dynamic'`를 추가하세요. 

---

### 1-4. Next 16 동적 라우트: **`params` Promise 언랩**

`[code]`(또는 다른 동적 세그먼트)에서 **`params`가 Promise일 수 있음** → 먼저 언랩하고 쓰세요. 이 문제는 현재 404 분석에도 명시되어 있습니다. 

```tsx
// app/[code]/page.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';

type P = { code: string };
export default async function CodePage({ params }: { params: P } | { params: Promise<P> }) {
  const p = (typeof (params as any)?.then === 'function') ? await (params as Promise<P>) : (params as P);

  const supabase = supabaseServer();
  const { data: demo } = await supabase
    .from('demos')
    .select('share_id')
    .eq('access_code', p.code.toUpperCase())
    .maybeSingle();

  if (!demo?.share_id) redirect('/?error=invalid_code');
  redirect(`/demo/${demo.share_id}`);
}
```

---

### 1-5. Next 설정 스무딩(선택)

RSC 번들 경고를 줄이기 위한 보조 옵션입니다. 보고서의 팁과 동일합니다. 

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
};
module.exports = nextConfig;
```

---

## 2) “빌드 전에” 꼭 확인 (실행 환경)

보고서에 적힌 대로 **잘못된 디렉터리에서 서버를 올리거나**, PowerShell `&&` 연산자 문제, **`.env.local` 누락**은 404·ENV 오류로 바로 이어집니다. **아래 순서로 재검증**하세요. 

```bash
# 올바른 프로젝트 루트로 이동 (package.json이 존재하는 경로)
cd <your-project-root>

# 캐시 정리 후 재설치
rm -rf .next node_modules
npm i

# 환경변수 확인 (.env.local)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 개발 서버 실행
npm run dev
```

> PowerShell을 쓰신다면, 여러 명령은 한 줄에서 `&&` 대신 **한 줄씩 순차 실행**하세요. 잘못된 CWD 때문에 `package.json`을 못 찾는 케이스가 실제로 보고되었습니다. 

---

## 3) (부수) 로그인 루프/미들웨어 충돌 방지

* **현재**: 인증은 localStorage에 토큰이 있고, 미들웨어는 **쿠키**를 봅니다 → 서로 불일치로 무한 리다이렉트. 보고서의 “로그인 성공했지만 /admin 접근 시 다시 /admin/login” 증상과 일치합니다. **MVP에서는 미들웨어 가드를 잠시 꺼두고**, 위 1-1의 **클라이언트 가드**만으로 보호하세요. 
* **GoTrue 인스턴스 중복** 경고가 뜨는 경우 브라우저에서 **단일 supabaseClient**만 import 하도록 구조를 정리하세요(1-2에서 해결). 

---

## 4) 최종 점검 체크리스트

1. `npm run build`가 **성공**한다. (Admin 3페이지에서 **SSR 관련 에러 없음**) 
2. `/api/access-logs` 등 모든 API 라우트에서 **Dynamic server usage 경고 없음**. 
3. `/[코드]` 접근 시 **404 없이** `/demo/[share_id]`로 리다이렉트된다. (`params` 언랩 적용) 
4. 로컬 서버는 **프로젝트 루트**에서 실행되고, `.env.local` 값이 정확하다. 
5. Admin 로그인 후 **/admin/dashboard 진입 성공**, 새 탭에서도 세션 유지(클라이언트 가드 동작). 

---

## 5) 한 줄 결론

* **남은 병목은 4가지**: Admin SSR 차단, API 강제 Dynamic, `params` Promise 언랩, 실행/ENV 정리. 보고서들이 모두 같은 포인트를 지목합니다.  
* 위 Fix Pack v2를 그대로 반영하면 **빌드는 통과**하고, 로컬/배포 환경에서도 안정적으로 동작할 겁니다. 이후 필요하면 미들웨어 기반 SSR 가드·서명 URL 등 **보안 고도화**를 덧씌우면 됩니다. 

필요하시면 위 변경을 **git diff**로도 정리해 드리겠습니다.
