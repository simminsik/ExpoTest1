const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

/** 기간조회 (FullCalendar용) */
export async function getEvents(startISO, endISO) {
  const url = new URL("/api/events", BASE);
  if (startISO) url.searchParams.set("start", startISO);
  if (endISO) url.searchParams.set("end", endISO);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("이벤트 조회 실패");
  const { events } = await res.json();
  return Array.isArray(events) ? events : [];
}

/** 전체 목록 (간단 리스트용) */
export async function listEvents() {
  const res = await fetch(new URL("/api/events", BASE), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("이벤트 전체 조회 실패");
  const { events } = await res.json();
  return Array.isArray(events) ? events : [];
}

/** 상세 조회: { event: {..., enrolledEmpNos:[], completedEmpNos:[] } } */
export async function getEventDetail(id) {
  const res = await fetch(new URL(`/api/events/${encodeURIComponent(id)}`, BASE), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("이벤트 상세 조회 실패");
  const { event } = await res.json();
  return event;
}

/** 직원 목록: { employees: [{empNo, name, dept, ...}, ...] } */
export async function listEmployees() {
  const res = await fetch(new URL("/api/employees", BASE), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("직원 목록 조회 실패");
  const { employees } = await res.json();
  return Array.isArray(employees) ? employees : [];
}

/** 일정 생성 */
export async function createEvent({ title, date, startTime, endTime, location, description, instructor, capacity }) {
  const hasTime = !!(startTime || endTime);
  const payload = {
    title,
    start: hasTime ? `${date}T${startTime || "00:00"}` : date,
    end: endTime ? `${date}T${endTime}` : undefined,
    allDay: !hasTime,
    location,
    description,
    instructor,
    capacity: capacity ? Number(capacity) : undefined,
  };
  const res = await fetch(new URL("/api/events", BASE), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("이벤트 생성 실패");
  return await res.json();
}

/** 일정 삭제 */
export async function deleteEvent(id) {
  const res = await fetch(new URL(`/api/events/${encodeURIComponent(id)}`, BASE), {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("이벤트 삭제 실패");
  return await res.json();
}
