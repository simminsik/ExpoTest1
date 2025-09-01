import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import EducationSchedule from "./pages/EducationSchedule.jsx";
import EmployeeManage from "./pages/EmployeeManage.jsx";   // ← 사원관리
import ScheduleViewer from "./pages/ScheduleViewer.jsx";   // ← 일정 조회(읽기 전용)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<EducationSchedule />} />
        <Route path="/employees" element={<EmployeeManage />} />   {/* ← 반드시 EmployeeManage */}
        <Route path="/schedule-viewer" element={<ScheduleViewer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
