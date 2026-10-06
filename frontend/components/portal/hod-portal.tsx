"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, BookOpen, History, AlertTriangle, BarChart3, Download, Loader2, Users, CheckCircle2, AlertCircle,
} from "lucide-react";
import { PortalShell, GlassCard, type NavItem } from "./portal-shell";
import { readApi, friendly, prettyDate } from "@/lib/clientApi";
import { cn } from "@/lib/utils";

const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "sections", label: "Sections", icon: Building2 },
  { key: "subjects", label: "Subjects", icon: BookOpen },
  { key: "history", label: "Attendance History", icon: History },
  { key: "below75", label: "Below 75%", icon: AlertTriangle },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "reports", label: "Reports & Export", icon: Download },
];

const SECTIONS_LIST = ["3A", "3B", "5A", "5B", "7A", "7B"];

const statusColor: Record<string, string> = {
  EXCELLENT: "text-emerald-600", ON_TRACK: "text-indigo-600",
  AT_RISK: "text-amber-600", CRITICAL: "text-rose-600", NOT_STARTED: "text-slate-400",
};

export function HodPortal() {
  const router = useRouter();
  const [tab, setTab] = useState("dashboard");
  const [sections, setSections] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selSection, setSelSection] = useState("3A");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selSubject, setSelSubject] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [allSubjectStudents, setAllSubjectStudents] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [hist, setHist] = useState<any[]>([]);
  
  // Below 75% tab state
  const [filterMode, setFilterMode] = useState<"below75" | "above75" | "all">("below75");
  const [subFilter, setSubFilter] = useState<string>("ALL");

  const logout = async () => { await fetch("/gs/hod", { method: "DELETE" }); router.replace("/hod"); };

  // Fetch sections overview
  useEffect(() => {
    readApi("sections")
      .then((j) => setSections(j.sections || {}))
      .catch((e) => setError(friendly(e)))
      .finally(() => setLoading(false));
  }, []);

  // Load section subjects and students across subjects
  const loadSectionData = useCallback(async (s: string) => {
    setSelSection(s);
    setBusy(true);
    setError(null);
    try {
      const j = await readApi("subjects", { section: s });
      const subs = j.subjects || [];
      setSubjects(subs);
      if (subs.length > 0) setSelSubject(subs[0]);

      // Fetch students for all subjects with staggering to prevent Google Apps Script rate limiting
      const studentFetches = await Promise.allSettled(
        subs.map(async (sub: any, idx: number) => {
          if (idx > 0) await new Promise((r) => setTimeout(r, idx * 150));
          const res = await readApi("students", { section: s, courseCode: sub.courseCode });
          return {
            subject: sub,
            students: res.students || [],
            conducted: res.conducted || 0,
          };
        })
      );

      const combined: any[] = [];
      studentFetches.forEach((res) => {
        if (res.status === "fulfilled") {
          const { subject, students: stList } = res.value;
          stList.forEach((st: any) => {
            combined.push({
              ...st,
              courseCode: subject.courseCode,
              subjectName: subject.subject,
              teacher: subject.teacher,
            });
          });
        }
      });
      setAllSubjectStudents(combined);
      if (subs.length > 0 && combined.length > 0) {
        const firstSubStudents = combined.filter((c) => c.courseCode === subs[0].courseCode);
        setStudents(firstSubStudents);
      }
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    loadSectionData(selSection);
  }, [selSection, loadSectionData]);

  const pickSubject = (sub: any) => {
    setSelSubject(sub);
    const filtered = allSubjectStudents.filter((s) => s.courseCode === sub.courseCode);
    setStudents(filtered);
  };

  const loadHist = useCallback(async (s: string) => {
    setSelSection(s); setBusy(true); setError(null);
    try { const j = await readApi("history", { section: s }); setHist(j.history || []); }
    catch (e) { setError(friendly(e)); } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    if (tab === "history") loadHist(selSection);
  }, [tab, selSection, loadHist]);

  const exportCsv = () => {
    const listToExport = allSubjectStudents.length > 0 ? allSubjectStudents : students;
    if (!listToExport.length) return;
    const head = ["USN", "Name", "Course Code", "Subject", "Teacher", "Attended", "Conducted", "Percentage", "Status"];
    const rows = listToExport.map((s) => [s.usn, s.name, s.courseCode, s.subjectName || selSubject?.subject, s.teacher || selSubject?.teacher, s.attended, s.conducted, s.percentage, s.status]);
    const csv = [head, ...rows].map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url;
    a.download = `HOD_${selSection}_attendance_report.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const isStudentStarted = (s: any) => (s.conducted > 0) || typeof s.percentage === "number";
  const getStudentPct = (s: any) => typeof s.percentage === "number" ? s.percentage : (s.conducted > 0 ? Math.round((s.attended / s.conducted) * 100) : 0);

  // Filtered students for Below 75% tab
  const sectionStudents = subFilter === "ALL" 
    ? allSubjectStudents 
    : allSubjectStudents.filter((s) => s.courseCode === subFilter);

  const filteredBelowAbove = sectionStudents.filter((s) => {
    const started = isStudentStarted(s);
    const p = getStudentPct(s);
    if (filterMode === "below75") return started && p < 75;
    if (filterMode === "above75") return started && p >= 75;
    return true;
  });

  // Analytics metrics
  const totalStudentsCount = new Set(allSubjectStudents.map((s) => s.usn)).size;
  const startedRecords = allSubjectStudents.filter((s) => isStudentStarted(s));
  const below75Count = startedRecords.filter((s) => getStudentPct(s) < 75).length;
  const above75Count = startedRecords.filter((s) => getStudentPct(s) >= 75).length;
  const overallPct = startedRecords.length
    ? Math.round(startedRecords.reduce((acc, s) => acc + getStudentPct(s), 0) / startedRecords.length)
    : 0;

  return (
    <PortalShell role="HOD" title="Department Overview" subtitle="Read-only • Live Google Sheets API Integration" nav={NAV} active={tab} onSelect={setTab} onLogout={logout}>
      {error && <GlassCard className="mb-4 text-sm text-rose-600">{error}</GlassCard>}
      {loading ? (
        <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading HOD Portal…</GlassCard>
      ) : tab === "dashboard" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SECTIONS_LIST.map((s) => (
              <button key={s} onClick={() => { setSelSection(s); setTab("sections"); }} className="text-left">
                <GlassCard className="p-4 transition hover:border-emerald-500/50">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-extrabold">{s}</p>
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {sections[s]?.available
                      ? `${Math.max(0, (sections[s].rows || 5) - 4)} students · ${(sections[s].columns || 4) - 3} subjects`
                      : "Click to view section"}
                  </p>
                </GlassCard>
              </button>
            ))}
          </div>
          <GlassCard className="text-sm text-slate-600">
            HOD access is <b>Read-Only</b>. Select any section to view subjects, student lists, attendance history, below 75% alerts, and analytics.
          </GlassCard>
        </div>
      ) : tab === "sections" ? (
        <div className="space-y-4">
          <GlassCard>
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">Section</p>
            <div className="flex flex-wrap gap-2">
              {SECTIONS_LIST.map((s) => (
                <button key={s} data-testid={`hod-section-${s}`} onClick={() => setSelSection(s)}
                  className={cn("rounded-xl border px-4 py-2 text-sm font-bold transition", selSection === s ? "border-emerald-600 bg-emerald-600 text-white" : "border-white/60 bg-white/50 dark:bg-white/5")}>{s}</button>
              ))}
            </div>
            {subjects.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-xs font-bold uppercase text-slate-500">Subject</p>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((sub) => (
                    <button key={sub.courseCode || sub.subject} data-testid={`hod-subject-${sub.courseCode}`} onClick={() => pickSubject(sub)}
                      className={cn("rounded-xl border px-3 py-2 text-sm font-semibold transition", selSubject?.courseCode === sub.courseCode ? "border-indigo-600 bg-indigo-600 text-white" : "border-white/60 bg-white/50 dark:bg-white/5")}>
                      {sub.subject} <span className="opacity-70">· {sub.courseCode || "—"}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </GlassCard>

          {busy && <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading section data…</GlassCard>}

          {selSubject && students.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{selSubject.subject} • {selSubject.teacher} • {selSubject.conducted} conducted</p>
                <button onClick={exportCsv} data-testid="hod-export" className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-emerald-700"><Download className="h-4 w-4" />Export CSV</button>
              </div>
              <GlassCard className="overflow-x-auto p-0">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                    <tr><th className="p-3">USN</th><th className="p-3">Name</th><th className="p-3">Attended</th><th className="p-3">Conducted</th><th className="p-3">%</th><th className="p-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.usn} className="border-b border-white/20">
                        <td className="p-3 font-semibold">{s.usn}</td><td className="p-3">{s.name}</td>
                        <td className="p-3">{s.attended}</td><td className="p-3">{s.conducted}</td>
                        <td className="p-3 tabular-nums">{s.isStarted ? `${s.percentage}%` : "—"}</td>
                        <td className={cn("p-3 text-xs font-bold", statusColor[s.status])}>{s.status.replace("_", " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            </>
          )}
        </div>
      ) : tab === "subjects" ? (
        <div className="space-y-4">
          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">Select Section</p>
                <div className="flex flex-wrap gap-2">
                  {SECTIONS_LIST.map((s) => (
                    <button key={s} onClick={() => setSelSection(s)}
                      className={cn("rounded-xl border px-4 py-2 text-sm font-bold transition", selSection === s ? "border-emerald-600 bg-emerald-600 text-white" : "border-white/60 bg-white/50 dark:bg-white/5")}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">Subject Filter</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setSubFilter("ALL")} className={cn("rounded-lg px-3 py-1.5 text-xs font-bold transition", subFilter === "ALL" ? "bg-indigo-600 text-white" : "bg-white/60 dark:bg-white/5")}>All Subjects</button>
                  {subjects.map((sub, idx) => (
                    <button key={sub.courseCode ? `${sub.courseCode}-${idx}` : `sub-${idx}`} onClick={() => setSubFilter(sub.courseCode)}
                      className={cn("rounded-lg px-3 py-1.5 text-xs font-bold transition", subFilter === sub.courseCode ? "bg-indigo-600 text-white" : "bg-white/60 dark:bg-white/5")}>
                      {sub.courseCode || sub.subject}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {busy ? (
            <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading all subjects view…</GlassCard>
          ) : sectionStudents.length === 0 ? (
            <GlassCard className="text-sm text-slate-600">No subject records found for section {selSection}.</GlassCard>
          ) : (
            <GlassCard className="overflow-x-auto p-0">
              <div className="p-4 border-b border-white/40 flex items-center justify-between">
                <p className="text-sm font-bold">Section {selSection} • All Subjects ({sectionStudents.length} records)</p>
                <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"><Download className="h-3.5 w-3.5" />Export CSV</button>
              </div>
              <table className="w-full min-w-[780px] text-sm">
                <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-3">USN</th><th className="p-3">Student Name</th><th className="p-3">Course Code</th>
                    <th className="p-3">Subject</th><th className="p-3">Teacher</th><th className="p-3">Present</th>
                    <th className="p-3">Conducted</th><th className="p-3">%</th><th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionStudents.map((s, idx) => (
                    <tr key={`${s.usn}-${s.courseCode}-${idx}`} className="border-b border-white/20">
                      <td className="p-3 font-semibold">{s.usn}</td>
                      <td className="p-3">{s.name}</td>
                      <td className="p-3 font-mono text-xs font-bold">{s.courseCode}</td>
                      <td className="p-3">{s.subjectName}</td>
                      <td className="p-3 text-slate-600">{s.teacher}</td>
                      <td className="p-3 text-emerald-600 font-semibold">{s.attended}</td>
                      <td className="p-3">{s.conducted}</td>
                      <td className="p-3 font-bold tabular-nums">{s.isStarted ? `${s.percentage}%` : "—"}</td>
                      <td className={cn("p-3 text-xs font-bold", statusColor[s.status])}>{s.status?.replace("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </div>
      ) : tab === "below75" ? (
        <div className="space-y-4">
          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">Section</p>
                <div className="flex flex-wrap gap-2">
                  {SECTIONS_LIST.map((s) => (
                    <button key={s} onClick={() => setSelSection(s)}
                      className={cn("rounded-xl border px-4 py-2 text-sm font-bold transition", selSection === s ? "border-emerald-600 bg-emerald-600 text-white" : "border-white/60 bg-white/50 dark:bg-white/5")}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">Filter Status</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setFilterMode("below75")} data-testid="filter-below-75"
                    className={cn("rounded-lg px-3 py-1.5 text-xs font-bold transition", filterMode === "below75" ? "bg-rose-600 text-white" : "bg-white/60 dark:bg-white/5")}>Below 75%</button>
                  <button onClick={() => setFilterMode("above75")} data-testid="filter-above-75"
                    className={cn("rounded-lg px-3 py-1.5 text-xs font-bold transition", filterMode === "above75" ? "bg-emerald-600 text-white" : "bg-white/60 dark:bg-white/5")}>75% & Above</button>
                  <button onClick={() => setFilterMode("all")} data-testid="filter-all"
                    className={cn("rounded-lg px-3 py-1.5 text-xs font-bold transition", filterMode === "all" ? "bg-indigo-600 text-white" : "bg-white/60 dark:bg-white/5")}>All</button>
                </div>
              </div>
            </div>
          </GlassCard>

          {busy ? (
            <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading data…</GlassCard>
          ) : filteredBelowAbove.length === 0 ? (
            <GlassCard className="text-sm text-slate-600">No students match the "{filterMode}" criteria in section {selSection}.</GlassCard>
          ) : (
            <GlassCard className="overflow-x-auto p-0">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-3">USN</th><th className="p-3">Name</th><th className="p-3">Course Code</th>
                    <th className="p-3">Subject</th><th className="p-3">Present</th><th className="p-3">Conducted</th>
                    <th className="p-3">%</th><th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBelowAbove.map((s, idx) => (
                    <tr key={`${s.usn}-${s.courseCode}-${idx}`} className="border-b border-white/20">
                      <td className="p-3 font-semibold">{s.usn}</td>
                      <td className="p-3">{s.name}</td>
                      <td className="p-3 font-mono text-xs font-bold">{s.courseCode}</td>
                      <td className="p-3">{s.subjectName}</td>
                      <td className="p-3 font-semibold">{s.attended}</td>
                      <td className="p-3">{s.conducted}</td>
                      <td className={cn("p-3 font-bold tabular-nums", s.isStarted ? (s.percentage < 75 ? "text-rose-600" : "text-emerald-600") : "text-slate-400")}>
                        {s.isStarted ? `${s.percentage}%` : "—"}
                      </td>
                      <td className={cn("p-3 text-xs font-bold", statusColor[s.isStarted ? (s.status || "ON_TRACK") : "NOT_STARTED"])}>
                        {s.isStarted ? (s.status || "ON_TRACK").replace("_", " ") : "NOT STARTED"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </div>
      ) : tab === "history" ? (
        <div className="space-y-4">
          <GlassCard>
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">Section</p>
            <div className="flex flex-wrap gap-2">
              {SECTIONS_LIST.map((s) => (
                <button key={s} onClick={() => setSelSection(s)} className={cn("rounded-xl border px-4 py-2 text-sm font-bold transition", selSection === s ? "border-emerald-600 bg-emerald-600 text-white" : "border-white/60 bg-white/50 dark:bg-white/5")}>{s}</button>
              ))}
            </div>
          </GlassCard>
          {busy ? <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading history…</GlassCard>
            : hist.length === 0 ? <GlassCard className="text-sm text-slate-600">No attendance history records found for section {selSection}.</GlassCard>
            : (
              <GlassCard className="overflow-x-auto p-0">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                    <tr><th className="p-3">Date</th><th className="p-3">Subject</th><th className="p-3">Teacher</th><th className="p-3">Present</th><th className="p-3">Absent</th><th className="p-3">Conducted</th></tr>
                  </thead>
                  <tbody>
                    {hist.map((h, i) => (
                      <tr key={i} className="border-b border-white/20">
                        <td className="p-3 font-semibold">{prettyDate(h.date)}</td><td className="p-3">{h.subject}</td>
                        <td className="p-3">{h.teacher}</td><td className="p-3 text-emerald-600 font-semibold">{h.present}</td>
                        <td className="p-3 text-rose-600 font-semibold">{h.absent}</td><td className="p-3">{h.conducted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}
        </div>
      ) : tab === "analytics" ? (
        <div className="space-y-4">
          <GlassCard>
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">Select Section</p>
            <div className="flex flex-wrap gap-2">
              {SECTIONS_LIST.map((s) => (
                <button key={s} onClick={() => setSelSection(s)} className={cn("rounded-xl border px-4 py-2 text-sm font-bold transition", selSection === s ? "border-emerald-600 bg-emerald-600 text-white" : "border-white/60 bg-white/50 dark:bg-white/5")}>{s}</button>
              ))}
            </div>
          </GlassCard>

          {busy ? (
            <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Calculating analytics…</GlassCard>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <GlassCard className="p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Total Students</p>
                  <p className="mt-1 text-2xl font-extrabold">{totalStudentsCount}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Average %</p>
                  <p className="mt-1 text-2xl font-extrabold text-indigo-600">{overallPct}%</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Below 75%</p>
                  <p className="mt-1 text-2xl font-extrabold text-rose-600">{below75Count}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">75% & Above</p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-600">{above75Count}</p>
                </GlassCard>
              </div>

              <GlassCard className="p-5">
                <h3 className="mb-4 text-base font-bold">Subject-Wise Analytics Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                      <tr><th className="p-3">Course</th><th className="p-3">Subject</th><th className="p-3">Teacher</th><th className="p-3">Conducted</th><th className="p-3">Below 75% Count</th></tr>
                    </thead>
                    <tbody>
                      {subjects.map((sub, i) => {
                        const subSt = allSubjectStudents.filter((s) => s.courseCode === sub.courseCode);
                        const subBelow = subSt.filter((s) => s.isStarted && s.percentage < 75).length;
                        return (
                          <tr key={sub.courseCode ? `${sub.courseCode}-${i}` : `sub-${i}`} className="border-b border-white/20">
                            <td className="p-3 font-mono font-bold text-xs">{sub.courseCode || "—"}</td>
                            <td className="p-3 font-semibold">{sub.subject}</td>
                            <td className="p-3 text-slate-600">{sub.teacher}</td>
                            <td className="p-3">{sub.conducted}</td>
                            <td className="p-3 font-bold text-rose-600">{subBelow}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </>
          )}
        </div>
      ) : (
        /* Reports & Export tab */
        <div className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="mb-2 text-lg font-bold">Export Section Attendance Report</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Download complete student attendance records as CSV for Section {selSection}.</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                {SECTIONS_LIST.map((s) => (
                  <button key={s} onClick={() => setSelSection(s)} className={cn("rounded-xl border px-3 py-1.5 text-sm font-bold transition", selSection === s ? "border-emerald-600 bg-emerald-600 text-white" : "border-white/60 bg-white/50 dark:bg-white/5")}>{s}</button>
                ))}
              </div>
              <button onClick={exportCsv} className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white transition hover:bg-emerald-700">
                <Download className="h-4 w-4" /> Export CSV ({allSubjectStudents.length} records)
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </PortalShell>
  );
}

