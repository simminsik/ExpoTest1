import React, { useEffect, useMemo, useState } from "react";
import * as RealAPI from "../lib/api"; // 실제 API (모의모드 OFF일 때 사용)

// ✅ true면 파일 내부 MOCK 사용, false면 실제 API 사용
const USE_INLINE_MOCK = true;

/* ---------------- MOCK DATA ---------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mockDB = {
  employees: [
    { empNo: "6465", name: "김준혁", dept: "생산팀" },
    { empNo: "5665", name: "심민식", dept: "R&D" },
    { empNo: "1755", name: "하은현", dept: "안전관리팀" },
    { empNo: "2024-001", name: "박소은", dept: "인사팀" },
    { empNo: "2024-002", name: "이도윤", dept: "품질팀" },
    { empNo: "3001", name: "정우성", dept: "생산지원" },
  ],
  events: [
    { id: "ev-2025-09-10-0900", title: "안전모 착용 교육", start: "2025-09-10T09:00", end: "2025-09-10T10:00", allDay: false, location: "제1실습실", description: "기본 안전모 착용법 및 점검 포인트 실습" },
    { id: "ev-2025-09-18-all",  title: "화재 대피 훈련",   start: "2025-09-18",        allDay: true,  location: "전시실",   description: "대피 동선 점검" },
    { id: "ev-2025-10-02-1400", title: "작업발판 안전 교육", start: "2025-10-02T14:00", end: "2025-10-02T16:00", allDay: false, location: "제2강의실" },
    { id: "ev-2025-10-15-1000", title: "유해화학물질 취급 교육", start: "2025-10-15T10:00", end: "2025-10-15T12:00", allDay: false, location: "실험동 B103" },
  ],
  eventMeta: {
    "ev-2025-09-10-0900": { enrolledEmpNos: ["6465","5665","1755","2024-001"], completedEmpNos: ["6465","1755"] },
    "ev-2025-09-18-all":  { enrolledEmpNos: ["6465","5665","2024-002","2024-001","3001"], completedEmpNos: ["5665"] },
    "ev-2025-10-02-1400": { enrolledEmpNos: ["6465","2024-001","2024-002"], completedEmpNos: [] },
    "ev-2025-10-15-1000": { enrolledEmpNos: ["5665","1755","3001"], completedEmpNos: ["3001"] },
  },
};
const mockAPI = {
  async listEvents(){ await sleep(120); return [...mockDB.events].sort((a,b)=>new Date(b.start)-new Date(a.start)); },
  async getEventDetail(id){ await sleep(100); const ev=mockDB.events.find(x=>x.id===id); if(!ev) throw new Error("이벤트 없음"); return {...ev, ...(mockDB.eventMeta[id]||{enrolledEmpNos:[],completedEmpNos:[]})}; },
  async listEmployees(){ await sleep(80); return [...mockDB.employees]; },
};
const API = USE_INLINE_MOCK ? mockAPI : RealAPI;

/* ---------------- UTIL ---------------- */
function fmtDateTime(ev){
  const s=new Date(ev.start), e=ev.end?new Date(ev.end):null;
  const d=s.toLocaleDateString("ko-KR");
  if(ev.allDay) return {date:d, time:"종일"};
  const t1=s.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});
  const t2=e?e.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}):"";
  return {date:d, time:t2?`${t1}–${t2}`:t1};
}

async function buildGlobalProgress({listEvents,getEventDetail}){
  const events = await listEvents();
  const ds = await Promise.all(events.map(e=>getEventDetail(e.id)));
  const byEmp={}; let totalAssigned=0,totalCompleted=0;
  for(const d of ds){
    const en=d.enrolledEmpNos||[], co=d.completedEmpNos||[];
    totalAssigned+=en.length; totalCompleted+=co.length;
    en.forEach(no => (byEmp[no]??={enrolled:0,completed:0}).enrolled++);
    co.forEach(no => (byEmp[no]??={enrolled:0,completed:0}).completed++);
  }
  const empPerc = Object.values(byEmp).filter(v=>v.enrolled>0).map(v=>v.completed/v.enrolled);
  const avgPercent = empPerc.length ? Math.round((empPerc.reduce((a,b)=>a+b,0)/empPerc.length)*100) : 0;
  const overallPercent = totalAssigned ? Math.round((totalCompleted/totalAssigned)*100) : 0;
  return { byEmp, overall:{totalAssigned,totalCompleted,overallPercent,avgPercent} };
}

/* ---------------- PAGE ---------------- */
export default function ScheduleViewer(){
  const [list,setList]=useState([]); const [loading,setLoading]=useState(true); const [q,setQ]=useState("");
  const [detailId,setDetailId]=useState(null); const [detail,setDetail]=useState(null); const [employees,setEmployees]=useState([]);
  const [globalProg,setGlobalProg]=useState({byEmp:{}, overall:{totalAssigned:0,totalCompleted:0,overallPercent:0,avgPercent:0}});
  const [globalLoading,setGlobalLoading]=useState(true);

  // 열 너비(픽셀) — colgroup에서 사용
  const COL = { id: 96, name: 120, dept: 120, prog: 176 };

  useEffect(()=>{ (async()=>{
    setLoading(true);
    try{ setList(await API.listEvents()); } finally{ setLoading(false); }
    try{ setGlobalLoading(true); setGlobalProg(await buildGlobalProgress(API)); } finally{ setGlobalLoading(false); }
  })(); },[]);

  async function openDetail(id){
    setDetailId(id); setDetail(null);
    try{ const [ev,emps]=await Promise.all([API.getEventDetail(id), API.listEmployees()]); setEmployees(emps); setDetail(ev); }
    catch(e){ alert("상세 조회 실패: "+e.message); }
  }

  const filtered = useMemo(()=> {
    const k=q.trim(); if(!k) return list;
    return list.filter(ev => (ev.title||"").includes(k) || (ev.location||"").includes(k));
  },[list,q]);

  const detailView = useMemo(()=> {
    if(!detail) return null;
    const empMap = Object.fromEntries(employees.map(e=>[e.empNo,e]));
    const enrolledNos = detail.enrolledEmpNos||[], completedNos = detail.completedEmpNos||[];
    const enrolled = enrolledNos.map(no=>empMap[no]||{empNo:no,name:"-",dept:""});
    const completed = completedNos.map(no=>empMap[no]||{empNo:no,name:"-",dept:""});
    const inProgress = enrolled.filter(e=>!completedNos.includes(e.empNo));
    const progress = enrolled.length ? Math.round((completed.length/enrolled.length)*100) : 0;
    return { enrolled, completed, inProgress, progress };
  },[detail,employees]);

  function personProgress(empNo){
    const r=globalProg.byEmp[empNo]||{enrolled:0,completed:0};
    const pct=r.enrolled?Math.round((r.completed/r.enrolled)*100):0;
    return {...r,pct};
  }

  return (
    <div className="min-h-screen app-bg p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">교육일정 조회</h1>
          <div className="flex items-center gap-3">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="제목/장소 검색"
                   className="w-56 rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"/>
            {USE_INLINE_MOCK && <span className="text-xs rounded-full bg-purple-100 text-purple-700 px-2 py-1">MOCK</span>}
          </div>
        </div>

        {/* 전체 요약 */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="font-semibold">전체 진행도(모든 강의 기준)</div>
            {globalLoading ? <span className="text-gray-500">계산 중…</span> : (
              <>
                <div className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1">
                  {globalProg.overall.totalCompleted}/{globalProg.overall.totalAssigned} 완료
                </div>
                <div className="rounded-full bg-blue-50 text-blue-700 px-3 py-1">
                  전체 수료율 {globalProg.overall.overallPercent}%
                </div>
                <div className="rounded-full bg-slate-100 text-slate-700 px-3 py-1">
                  1인 평균 {globalProg.overall.avgPercent}%
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* 목록 */}
          <div className="glass-card p-4 self-start">
            <div className="mb-3 text-lg font-semibold">등록된 일정</div>
            {loading ? (
              <div className="py-8 text-center text-gray-500">불러오는 중…</div>
            ) : filtered.length===0 ? (
              <div className="py-8 text-center text-gray-500">일정이 없습니다.</div>
            ) : (
              <div className="overflow-auto max-h-[520px]">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left">날짜</th>
                      <th className="px-3 py-2 text-left">시간</th>
                      <th className="px-3 py-2 text-left">제목</th>
                      <th className="px-3 py-2 text-right">상세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(ev=>{
                      const {date,time}=fmtDateTime(ev);
                      return (
                        <tr key={ev.id} className="border-t">
                          <td className="px-3 py-2 whitespace-nowrap">{date}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{time}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{ev.title}</div>
                            {ev.location && <div className="text-xs text-gray-500">장소: {ev.location}</div>}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={()=>openDetail(ev.id)} className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50">상세</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 상세 */}
          <div className="glass-card p-4 self-start">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">상세</div>
              {detailId && <button onClick={()=>{setDetailId(null);setDetail(null);}} className="text-sm text-gray-500 hover:text-gray-700">닫기</button>}
            </div>

            {!detailId ? (
              <div className="py-8 text-center text-gray-500">왼쪽에서 <b>상세</b>를 눌러주세요.</div>
            ) : !detail ? (
              <div className="py-8 text-center text-gray-500">불러오는 중…</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-xl font-bold">{detail.title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(detail.start).toLocaleString("ko-KR")}
                    {detail.end ? ` ~ ${new Date(detail.end).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}` : ""}
                    {detail.location ? ` · ${detail.location}` : ""}
                  </div>
                </div>

                {/* 이벤트 내 수료 진행률 */}
                <div>
                  <div className="mb-1 text-sm text-gray-600">이 교육 수료 진행률</div>
                  <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-3 bg-emerald-500" style={{width:`${detailView?.progress??0}%`}} />
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {(detailView?.completed.length||0)} / {(detailView?.enrolled.length||0)} 명 수료 ({detailView?.progress??0}%)
                  </div>
                </div>

                {/* 진행중 / 수료 — 세로 스택, 고정 열폭 + colgroup */}
                <div className="grid grid-cols-1 gap-4 text-sm">
                  {/* 진행중 */}
                  <div>
                    <div className="mb-2 font-semibold">진행중</div>
                    <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                      <table className="min-w-full table-fixed text-sm">
                        <colgroup>
                          <col style={{ width: `${COL.id}px` }} />
                          <col style={{ width: `${COL.name}px` }} />
                          <col style={{ width: `${COL.dept}px` }} />
                          <col style={{ width: `${COL.prog}px` }} />
                        </colgroup>
                        <thead className="bg-gray-50">
                          <tr className="align-middle">
                            <th className="px-3 py-2 text-left whitespace-nowrap">사번</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">이름</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">부서</th>
                            <th className="px-3 py-2 text-center whitespace-nowrap">
                              {/* 진행도 헤더: 열 전체 가운데 */}
                              <div className="w-full flex justify-center items-center">
                                <span className="whitespace-nowrap">개인 진행도</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailView?.inProgress.map(e=>{
                            const p=personProgress(e.empNo);
                            return (
                              <tr key={e.empNo} className="border-t align-middle">
                                <td className="px-3 py-2 font-mono whitespace-nowrap">{e.empNo}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{e.name}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{e.dept}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="w-full flex justify-end items-center gap-3">
                                    <span className="inline-flex w-16 justify-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 font-mono tabular-nums">
                                      {p.completed}/{p.enrolled}
                                    </span>
                                    <span className="w-12 text-right text-xs text-gray-600 font-mono tabular-nums">
                                      {p.pct}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {!detailView?.inProgress?.length && (
                            <tr><td colSpan="4" className="px-3 py-4 text-center text-gray-500">없음</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 수료 */}
                  <div>
                    <div className="mb-2 font-semibold">수료</div>
                    <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                      <table className="min-w-full table-fixed text-sm">
                        <colgroup>
                          <col style={{ width: `${COL.id}px` }} />
                          <col style={{ width: `${COL.name}px` }} />
                          <col style={{ width: `${COL.dept}px` }} />
                          <col style={{ width: `${COL.prog}px` }} />
                        </colgroup>
                        <thead className="bg-gray-50">
                          <tr className="align-middle">
                            <th className="px-3 py-2 text-left whitespace-nowrap">사번</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">이름</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">부서</th>
                            <th className="px-3 py-2 text-center whitespace-nowrap">
                              <div className="w-full flex justify-center items-center">
                                <span className="whitespace-nowrap">개인 진행도</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailView?.completed.map(e=>{
                            const p=personProgress(e.empNo);
                            return (
                              <tr key={e.empNo} className="border-t align-middle">
                                <td className="px-3 py-2 font-mono whitespace-nowrap">{e.empNo}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{e.name}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{e.dept}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="w-full flex justify-end items-center gap-3">
                                    <span className="inline-flex w-16 justify-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 font-mono tabular-nums">
                                      {p.completed}/{p.enrolled}
                                    </span>
                                    <span className="w-12 text-right text-xs text-gray-600 font-mono tabular-nums">
                                      {p.pct}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {!detailView?.completed?.length && (
                            <tr><td colSpan="4" className="px-3 py-4 text-center text-gray-500">없음</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
