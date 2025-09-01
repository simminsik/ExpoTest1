import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen app-bg">
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-black/80" />
          <h1 className="text-xl font-semibold">산업 안전교육 관리 플랫폼</h1>
        </div>
        <span className="text-sm text-gray-500">메인 링크</span>
      </header>

      <main className="px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">바로가기</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 교육일정 (캘린더) */}
            <Link to="/schedule" className="group glass-card p-6 transition hover:shadow-xl focus:outline-none">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-blue-50 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M8 2v4M16 2v4M3 10h18M4 6h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/></svg>
                    교육일정
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">월/주/일 캘린더</h3>
                  <p className="mt-1 text-sm text-gray-600">달력에서 확인/추가/삭제</p>
                </div>
                <div className="mt-1 text-blue-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition">→</div>
              </div>
            </Link>

            {/* 사원관리 */}
            <Link to="/employees" className="group glass-card p-6 transition hover:shadow-xl focus:outline-none">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-emerald-50 text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4" strokeWidth="2"/></svg>
                    사원관리
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">사원 정보/엑셀 업로드</h3>
                  <p className="mt-1 text-sm text-gray-600">직원 명단 업로드·미리보기·전송</p>
                </div>
                <div className="mt-1 text-emerald-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition">→</div>
              </div>
            </Link>

            {/* 일정 조회(읽기전용) */}
            <Link to="/schedule-viewer" className="group glass-card p-6 transition hover:shadow-xl focus:outline-none">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-purple-50 text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M12 6v6l4 2"/><circle cx="12" cy="12" r="9" strokeWidth="2"/></svg>
                    일정 조회
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">목록/상세/진행률</h3>
                  <p className="mt-1 text-sm text-gray-600">DB에 등록된 교육일정 보기</p>
                </div>
                <div className="mt-1 text-purple-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition">→</div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
