import ExcelUploader from "../components/ExcelUploader.jsx";

export default function EmployeeManage() {
  return (
    <div className="min-h-screen app-bg p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">사원관리</h1>
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-3">엑셀 업로드</h2>
          <p className="text-sm text-gray-600 mb-4">
            헤더 예시: <b>사번, 이름, 부서, 연락처, 이메일</b>
          </p>
          <ExcelUploader />
        </div>
      </div>
    </div>
  );
}
