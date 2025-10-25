import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  // 서버에서 리디렉션
  redirect('/admin/login')
}

