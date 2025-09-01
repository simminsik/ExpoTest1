import { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";

const headerMap = {
  "사번": "empNo", "사원번호":"empNo", "번호":"empNo",
  "이름":"name", "성명":"name",
  "부서":"dept", "부서명":"dept",
  "연락처":"phone", "전화번호":"phone", "휴대폰":"phone",
  "이메일":"email", "메일":"email"
};
const required = ["empNo","name"];

export default function ExcelUploader() {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(new Uint8Array(evt.target.result), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      const [rawHeaders, ...data] = json;
      const normalized = rawHeaders.map(h => headerMap[String(h).trim()] || String(h).trim());
      const idx = Object.fromEntries(normalized.map((h, i) => [h, i]));

      const missReq = required.filter(r => !(r in idx));
      if (missReq.length) {
        setErrors([`필수 컬럼 누락: ${missReq.join(", ")}`]);
        setRows([]);
        return;
      }

      const formatted = data
        .filter(r => r.some(v => String(v).trim() !== ""))
        .map(r => ({
          empNo: String(r[idx.empNo] ?? "").trim(),
          name:  String(r[idx.name]  ?? "").trim(),
          dept:  String(r[idx.dept]  ?? "").trim(),
          phone: String(r[idx.phone] ?? "").trim(),
          email: String(r[idx.email] ?? "").trim(),
        }));

      const bad = [];
      formatted.forEach((it, i) => {
        if (!it.empNo || !it.name) bad.push(`행 ${i+2}: 사번/이름은 필수`);
        if (it.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(it.email)) bad.push(`행 ${i+2}: 이메일 형식 오류`);
        if (it.phone && !/^[0-9\-+() ]{8,}$/.test(it.phone)) bad.push(`행 ${i+2}: 연락처 형식 확인`);
      });

      setErrors(bad);
      setRows(formatted);
    };
    reader.readAsArrayBuffer(file);
  };

  const sendToServer = async () => {
    try {
      const { data } = await axios.post(
        import.meta.env.VITE_API_BASE
          ? `${import.meta.env.VITE_API_BASE}/api/employees/bulk`
          : "http://localhost:4000/api/employees/bulk",
        { employees: rows }
      );
      alert("전송 완료: " + JSON.stringify(data));
    } catch (e) {
      console.error(e);
      alert("전송 실패: " + (e?.response?.data?.message || e.message));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onFile}
          className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0
                     file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
        />
        <button
          disabled={!rows.length}
          onClick={sendToServer}
          className="shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-40"
          aria-label="DB로 전송"
        >
          DB로 전송
        </button>
      </div>

      {!!errors.length && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors.map((e,i) => <div key={i}>• {e}</div>)}
        </div>
      )}

      <div className="rounded-xl bg-white shadow overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">사번</th>
              <th className="px-3 py-2 text-left">이름</th>
              <th className="px-3 py-2 text-left">부서</th>
              <th className="px-3 py-2 text-left">연락처</th>
              <th className="px-3 py-2 text-left">이메일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 font-mono">{r.empNo}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.dept}</td>
                <td className="px-3 py-2">{r.phone}</td>
                <td className="px-3 py-2">{r.email}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan="5" className="px-3 py-6 text-center text-gray-500">
                  엑셀 파일을 업로드하세요 (.xlsx)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
