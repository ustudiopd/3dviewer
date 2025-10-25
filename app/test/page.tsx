export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">테스트 페이지</h1>
        <p className="text-gray-600">서버가 정상적으로 작동하고 있습니다!</p>
        <div className="mt-4 space-x-4">
          <a href="/" className="text-blue-600 hover:underline">홈으로</a>
          <a href="/admin/login" className="text-blue-600 hover:underline">관리자 로그인</a>
        </div>
      </div>
    </div>
  )
}

