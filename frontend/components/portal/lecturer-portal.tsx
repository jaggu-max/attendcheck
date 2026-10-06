"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck, History, AlertTriangle, BarChart3, Search,
  Check, X, RotateCcw, Pencil, Eye, Loader2, Users, Download, Trash2,
} from "lucide-react";
import { PortalShell, GlassCard, type NavItem } from "./portal-shell";
import { readApi, writeApi, friendly, todayISO, prettyDate } from "@/lib/clientApi";
import { cn } from "@/lib/utils";
import type { FacultySession } from "@/lib/roles-auth";

const NAV: NavItem[] = [
  { key: "students", label: "Subject Students", icon: Users },
  { key: "history", label: "Attendance History", icon: History },
  { key: "below75", label: "Below 75%", icon: AlertTriangle },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "export", label: "Export Data", icon: Download },
];

const statusColor: Record<string, string> = {
  EXCELLENT: "text-emerald-600", ON_TRACK: "text-indigo-600",
  AT_RISK: "text-amber-600", CRITICAL: "text-rose-600", NOT_STARTED: "text-slate-400",
};

export function LecturerPortal({ faculty }: { faculty: FacultySession }) {
  const router = useRouter();
  const [tab, setTab] = useState("students");
  const [students, setStudents] = useState<any[]>([]);
  const [conducted, setConducted] = useState(0);
  const [search, setSearch] = useState("");
  const [hist, setHist] = useState<any[]>([]);
  const [viewData, setViewData] = useState<{ date: string; attendance: Record<string, string> } | null>(null);
  const [filterMode, setFilterMode] = useState<"below75" | "above75" | "all">("below75");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000); };

  const loadStudents = useCallback(async () => {
    try {
      const res = await readApi("students", { section: faculty.section, courseCode: faculty.courseCode });
      if (res.students) {
        setStudents(res.students);
        setConducted(res.conducted || 0);
      }
    } catch (e) {
      setError(friendly(e));
    }
  }, [faculty.section, faculty.courseCode]);

  const loadHistory = useCallback(async () => {
    const cacheKey = `gmit_hist_${faculty.section}_${faculty.courseCode}`;
    try {
      const res = await readApi("history", { section: faculty.section, courseCode: faculty.courseCode });
      if (res.history) {
        setHist(res.history);
        try { localStorage.setItem(cacheKey, JSON.stringify(res.history)); } catch {}
      }
    } catch {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) setHist(JSON.parse(cached));
      } catch {}
    }
  }, [faculty.section, faculty.courseCode]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStudents(), loadHistory()]).finally(() => setLoading(false));
  }, [loadStudents, loadHistory]);

  const logout = async () => { await fetch("/gs/faculty/session", { method: "DELETE" }); router.replace("/lecturer"); };

  const total = students.length;

  const view = async (h: any) => {
    setBusy(true);
    try {
      const j = await readApi("attendance", {
        section: faculty.section,
        courseCode: faculty.courseCode,
        date: h.date,
        logId: String(h.logId || ""),
      });
      setViewData({ date: h.date, attendance: j.attendance || {} });
    } catch (e) { flash(friendly(e)); } finally { setBusy(false); }
  };

  const exportCsv = () => {
    if (!students.length) return;
    const head = ["USN", "Name", "Attended", "Conducted", "Percentage", "Status"];
    const rows = students.map((s) => [s.usn, s.name, s.attended, s.conducted, s.percentage ?? "—", s.status]);
    const csv = [head, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url;
    a.download = `${faculty.section}_${faculty.courseCode}_attendance.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const isStarted = (s: any) => Boolean(s.isStarted && (s.conducted > 0 || typeof s.percentage === "number"));
  const getPct = (s: any) => typeof s.percentage === "number" ? s.percentage : (s.conducted > 0 ? Math.round((s.attended / s.conducted) * 100) : 0);

  const filtered = students.filter((s) =>
    !search || s.usn.includes(search.toUpperCase()) || s.name.toUpperCase().includes(search.toUpperCase()));

  const filteredBelowAbove = students.filter((s) => {
    const started = isStarted(s);
    const p = getPct(s);
    if (filterMode === "below75") return started && p < 75;
    if (filterMode === "above75") return started && p >= 75;
    return true;
  });

  const below = students.filter((s) => isStarted(s) && getPct(s) < 75);
  const startedStudents = students.filter((s) => isStarted(s));
  const avg = startedStudents.length
    ? Math.round(startedStudents.reduce((a, s) => a + getPct(s), 0) / startedStudents.length)
    : 0;

  const meta = `${faculty.subject} • ${faculty.courseCode} • Section ${faculty.section} • ${faculty.teacher || "Faculty"} • ${conducted} conducted`;

  return (
    <PortalShell role="Lecturer" title={faculty.subject} subtitle={meta} nav={NAV} active={tab} onSelect={setTab} onLogout={logout}>
      {toast && <div data-testid="lec-toast" className="mb-4 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</div>}
      {error && <GlassCard className="mb-4 text-sm text-rose-600" >{error}</GlassCard>}

      {loading ? (
        <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading students…</GlassCard>
      ) : tab === "students" ? (
        <div className="space-y-4">
          <GlassCard>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students by USN or name..." data-testid="lec-search"
                className="w-full rounded-xl border border-white/60 bg-white/60 py-2 pl-9 pr-4 text-sm font-medium outline-none dark:bg-white/5" />
            </div>
          </GlassCard>

          <GlassCard className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                <tr><th className="p-3">USN</th><th className="p-3">Name</th><th className="p-3">Attended</th><th className="p-3">Conducted</th><th className="p-3">%</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const p = getPct(s);
                  const st = isStarted(s);
                  return (
                    <tr key={s.usn} className="border-b border-white/20" data-testid={`lec-row-${s.usn}`}>
                      <td className="p-3 font-semibold">{s.usn}</td>
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 font-semibold text-emerald-600">{st ? s.attended : 0}</td>
                      <td className="p-3">{st ? s.conducted : 0}</td>
                      <td className="p-3 font-bold tabular-nums">{st ? `${p}%` : "—"}</td>
                      <td className={cn("p-3 text-xs font-bold", statusColor[st ? (s.status || "ON_TRACK") : "NOT_STARTED"])}>
                        {st ? (s.status || "ON_TRACK").replace("_", " ") : "NOT STARTED"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </GlassCard>
        </div>
      ) : tab === "history" ? (
        <div className="space-y-4">
          {viewData && (
            <GlassCard>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-bold">Viewing {prettyDate(viewData.date)}</p>
                <button onClick={() => setViewData(null)}><X className="h-4 w-4" /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {students.map((s) => (
                  <span key={s.usn} className={cn("rounded-lg px-2 py-1 text-xs font-semibold", viewData.attendance[s.usn] === "P" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600")}>{s.usn}:{viewData.attendance[s.usn] || "A"}</span>
                ))}
              </div>
            </GlassCard>
          )}
          {loading ? (
            <GlassCard className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading history…</GlassCard>
          ) : hist.length === 0 ? (
            <GlassCard className="text-sm text-slate-600">No attendance history yet for this subject.</GlassCard>
          ) : (
            <GlassCard className="overflow-x-auto p-0">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Teacher</th>
                    <th className="p-3">Present</th>
                    <th className="p-3">Absent</th>
                    <th className="p-3">Conducted</th>
                    <th className="p-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody>
                  {hist.map((h, i) => (
                    <tr key={i} className="border-b border-white/20" data-testid={`hist-row-${h.date}`}>
                      <td className="p-3 font-semibold">{prettyDate(h.date)}</td>
                      <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">Class {h.sessionNumber || 1}</td>
                      <td className="p-3">{h.section || faculty.section}</td>
                      <td className="p-3">{h.subject || faculty.subject}</td>
                      <td className="p-3 text-xs">{h.teacher || faculty.teacher}</td>
                      <td className="p-3 font-semibold text-emerald-600">{h.present}</td>
                      <td className="p-3 font-semibold text-rose-600">{h.absent}</td>
                      <td className="p-3 tabular-nums">{h.conducted}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => view(h)} data-testid={`view-${h.date}`} className="rounded-lg bg-white/60 p-2 text-slate-600 hover:bg-white dark:bg-white/5" title="View"><Eye className="h-4 w-4" /></button>
                      </td>
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
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase text-slate-500">Attendance Filter</p>
              <div className="flex gap-1.5">
                <button onClick={() => setFilterMode("below75")}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-bold transition", filterMode === "below75" ? "bg-rose-600 text-white" : "bg-white/60 dark:bg-white/5")}>Below 75%</button>
                <button onClick={() => setFilterMode("above75")}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-bold transition", filterMode === "above75" ? "bg-emerald-600 text-white" : "bg-white/60 dark:bg-white/5")}>75% & Above</button>
                <button onClick={() => setFilterMode("all")}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-bold transition", filterMode === "all" ? "bg-indigo-600 text-white" : "bg-white/60 dark:bg-white/5")}>All</button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="overflow-x-auto p-0">
            {filteredBelowAbove.length === 0 ? (
              <p className="p-5 text-sm text-slate-600">No students match the "{filterMode}" criteria.</p>
            ) : (
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-white/40 text-left text-xs uppercase text-slate-500">
                  <tr><th className="p-3">USN</th><th className="p-3">Name</th><th className="p-3">Attended</th><th className="p-3">Conducted</th><th className="p-3">%</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody>
                  {filteredBelowAbove.map((s) => {
                    const p = getPct(s);
                    const st = isStarted(s);
                    return (
                      <tr key={s.usn} className="border-b border-white/20">
                        <td className="p-3 font-semibold">{s.usn}</td>
                        <td className="p-3">{s.name}</td>
                        <td className="p-3">{st ? s.attended : 0}</td>
                        <td className="p-3">{st ? s.conducted : 0}</td>
                        <td className={cn("p-3 font-bold tabular-nums", st ? (p < 75 ? "text-rose-600" : "text-emerald-600") : "text-slate-400")}>{st ? `${p}%` : "—"}</td>
                        <td className={cn("p-3 text-xs font-bold", statusColor[st ? (s.status || "NOT_STARTED") : "NOT_STARTED"])}>{st ? (s.status || "NOT_STARTED").replace("_", " ") : "NOT STARTED"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </GlassCard>
        </div>
      ) : tab === "analytics" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total Students" value={total} icon />
            <Stat label="Avg Attendance" value={`${Math.round(avg * 100) / 100 || 0}%`} tone="indigo" />
            <Stat label="Below 75%" value={below.length} tone="rose" />
            <Stat label="Classes Conducted" value={conducted} tone="emerald" />
          </div>

          <GlassCard className="p-5">
            <h3 className="mb-3 text-base font-bold">Class Attendance Distribution</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>75% & Above ({total - below.length} students)</span>
                  <span className="text-emerald-600">{total ? Math.round(((total - below.length) / total) * 100) : 0}%</span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${total ? ((total - below.length) / total) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Below 75% ({below.length} students)</span>
                  <span className="text-rose-600">{total ? Math.round((below.length / total) * 100) : 0}%</span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${total ? (below.length / total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : (
        /* Export tab */
        <GlassCard className="p-6">
          <h3 className="mb-2 text-lg font-bold">Export Attendance Data</h3>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Download section {faculty.section} • {faculty.courseCode} attendance data as CSV.</p>
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white transition hover:bg-indigo-700">
            <Download className="h-4 w-4" /> Download CSV ({students.length} students)
          </button>
        </GlassCard>
      )}
    </PortalShell>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: string | number; tone?: string; icon?: boolean }) {
  const c = tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-600" : tone === "indigo" ? "text-indigo-600" : "text-slate-900 dark:text-slate-100";
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">{icon && <Users className="h-3.5 w-3.5" />}{label}</div>
      <p className={cn("mt-1 text-2xl font-extrabold tabular-nums", c)}>{value}</p>
    </GlassCard>
  );
}

