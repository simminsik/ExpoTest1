import { useEffect, useRef, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import koLocale from "@fullcalendar/core/locales/ko";

const STORAGE_KEY = "edu_schedule_events_fc_v1";

/* ---------- 유틸 ---------- */
function daysInMonth(y, m /* 1~12 */) {
  return new Date(y, m, 0).getDate();
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/* ---------- 휠 날짜 선택기 ---------- */
function WheelDatePicker({
  initialDate,
  onCancel,
  onConfirm,
  minYear = 2020,
  maxYear = 2035,
}) {
  const ITEM_H = 36;
  const VISIBLE = 5;
  const PAD_H = (VISIBLE >> 1) * ITEM_H;

  const initY = initialDate.getFullYear();
  const initM = initialDate.getMonth() + 1;
  const initD = initialDate.getDate();

  const [year, setYear] = useState(clamp(initY, minYear, maxYear));
  const [month, setMonth] = useState(initM);
  const [day, setDay] = useState(initD);

  const yRef = useRef(null);
  const mRef = useRef(null);
  const dRef = useRef(null);

  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i),
    [minYear, maxYear]
  );
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(() => {
    const dim = daysInMonth(year, month);
    return Array.from({ length: dim }, (_, i) => i + 1);
  }, [year, month]);

  useEffect(() => {
    const sync = () => {
      if (yRef.current) yRef.current.scrollTop = years.indexOf(year) * ITEM_H;
      if (mRef.current) mRef.current.scrollTop = (month - 1) * ITEM_H;
      if (dRef.current) dRef.current.scrollTop = (clamp(day, 1, days.length) - 1) * ITEM_H;
    };
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yRef.current, mRef.current, dRef.current]);

  useEffect(() => {
    const maxD = days.length;
    if (day > maxD) setDay(maxD);
    if (dRef.current) dRef.current.scrollTop = (clamp(day, 1, maxD) - 1) * ITEM_H;
  }, [year, month, days.length]); // eslint-disable-line

  function onSnap(ref, list, setter) {
    if (!ref.current) return;
    const st = ref.current.scrollTop;
    const idx = clamp(Math.round(st / ITEM_H), 0, list.length - 1);
    ref.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    setter(list[idx]);
  }

  const timers = useRef({ y: null, m: null, d: null });
  function handleScroll(ref, key, list, setter) {
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => onSnap(ref, list, setter), 120);
  }

  const columnCls =
    "relative h-48 overflow-y-auto scroll-smooth snap-y snap-mandatory px-2";
  const itemCls = "snap-center h-9 leading-9 text-center select-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 text-lg font-semibold">날짜로 이동</div>

        <div className="relative grid grid-cols-3 gap-2">
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2">
            <div className="mx-1 rounded-lg border border-blue-200 bg-blue-50/40 h-9" />
          </div>

          <div className="rounded-lg border bg-white">
            <div className={columnCls} ref={yRef}
                 onScroll={() => handleScroll(yRef, "y", years, setYear)}>
              <div style={{ height: (VISIBLE >> 1) * ITEM_H }} />
              {years.map((y) => (
                <div key={y} className={`${itemCls} ${y === year ? "text-blue-600 font-semibold" : "text-gray-700"}`}>
                  {y}년
                </div>
              ))}
              <div style={{ height: (VISIBLE >> 1) * ITEM_H }} />
            </div>
          </div>

          <div className="rounded-lg border bg-white">
            <div className={columnCls} ref={mRef}
                 onScroll={() => handleScroll(mRef, "m", months, setMonth)}>
              <div style={{ height: (VISIBLE >> 1) * ITEM_H }} />
              {months.map((m) => (
                <div key={m} className={`${itemCls} ${m === month ? "text-blue-600 font-semibold" : "text-gray-700"}`}>
                  {m}월
                </div>
              ))}
              <div style={{ height: (VISIBLE >> 1) * ITEM_H }} />
            </div>
          </div>

          <div className="rounded-lg border bg-white">
            <div className={columnCls} ref={dRef}
                 onScroll={() => handleScroll(dRef, "d", days, setDay)}>
              <div style={{ height: (VISIBLE >> 1) * ITEM_H }} />
              {days.map((dd) => (
                <div key={dd} className={`${itemCls} ${dd === day ? "text-blue-600 font-semibold" : "text-gray-700"}`}>
                  {dd}일
                </div>
              ))}
              <div style={{ height: (VISIBLE >> 1) * ITEM_H }} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">취소</button>
          <button onClick={() => onConfirm(new Date(year, month - 1, day))}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            이동
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 메인 컴포넌트 ---------- */
export default function EducationSchedule() {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState({ date: "", title: "", start: "", end: "", location: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const handleDateClick = (info) => {
    setDraft({ date: info.dateStr, title: "", start: "", end: "", location: "" });
    setModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const ev = clickInfo.event;
    if (confirm(`"${ev.title}" 일정을 삭제할까요?`)) {
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    }
  };

  const saveEvent = () => {
    if (!draft.title.trim()) return alert("제목을 입력하세요.");
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const hasTime = draft.start || draft.end;
    const start = hasTime ? `${draft.date}T${draft.start || "00:00"}` : draft.date;
    const end = draft.end ? `${draft.date}T${draft.end}` : undefined;

    const newEvent = {
      id,
      title: draft.title + (draft.location ? ` · ${draft.location}` : ""),
      start,
      end,
      allDay: !hasTime,
    };
    setEvents((prev) => [...prev, newEvent]);
    setModalOpen(false);
  };

  const gotoPicker = () => setPickerOpen(true);
  const gotoDate = (date) => {
    const api = calendarRef.current?.getApi();
    if (api) api.gotoDate(date);
    setPickerOpen(false);
  };

  return (
    <div className="min-h-screen app-bg p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">교육일정</h1>
          <button onClick={gotoPicker} className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50">
            날짜로 이동(스크롤)
          </button>
        </div>

        <div className="glass-card p-3">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locales={[koLocale]}
            locale="ko"
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height="auto"
            weekends={true}
            selectable={true}
            dayMaxEvents={3}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
          />
        </div>
      </div>

      {pickerOpen && (
        <WheelDatePicker
          initialDate={calendarRef.current?.getApi?.().getDate?.() ?? new Date()}
          onCancel={() => setPickerOpen(false)}
          onConfirm={gotoDate}
          minYear={2020}
          maxYear={2035}
        />
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 text-lg font-semibold">일정 추가</div>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-gray-600">날짜</span>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((v) => ({ ...v, date: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-gray-600">제목 *</span>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((v) => ({ ...v, title: e.target.value }))}
                  placeholder="예: 안전모 착용 교육"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm text-gray-600">시작</span>
                  <input
                    type="time"
                    value={draft.start}
                    onChange={(e) => setDraft((v) => ({ ...v, start: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm text-gray-600">종료</span>
                  <input
                    type="time"
                    value={draft.end}
                    onChange={(e) => setDraft((v) => ({ ...v, end: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-sm text-gray-600">장소 (선택)</span>
                <input
                  value={draft.location}
                  onChange={(e) => setDraft((v) => ({ ...v, location: e.target.value }))}
                  placeholder="예: 제1실습실"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
                취소
              </button>
              <button onClick={saveEvent} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
