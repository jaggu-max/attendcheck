import "server-only";

const BASE = process.env.GOOGLE_ATTENDANCE_API_URL || "http://localhost:8000/api/attendance";
const TIMEOUT = 25000;

export class ApiUnavailableError extends Error {}
export class ApiNotDeployedError extends Error {
  constructor() {
    super("The attendance API service is currently unavailable.");
  }
}

export const READ_ACTIONS = [
  "health", "sections", "student", "subjects", "authorizesubject",
  "facultysubjects", "students", "attendance", "history",
];

export const WRITE_ACTIONS = ["submitAttendance", "updateAttendance", "undoAttendance", "deleteAttendance"];

function isMock(): boolean {
  return !BASE || BASE === "mock" || BASE === "demo";
}

function getMockResponse(action: string, params: Record<string, string | undefined>): any {
  const section = (params.section || "3A").toUpperCase();
  const courseCode = (params.courseCode || "21CS51").toUpperCase();

  switch (action) {
    case "health":
      return { success: true, app: "GMIT Attendance API (Mock)", status: "online", sections: ["3A", "3B", "5A", "5B", "7A", "7B"] };
    case "sections":
      return {
        success: true,
        sections: { "3A": { available: true }, "3B": { available: true }, "5A": { available: true }, "5B": { available: true }, "7A": { available: true }, "7B": { available: true } },
      };
    case "authorizesubject":
      return {
        success: true,
        section,
        courseCode,
        subject: courseCode === "21CS51" ? "Computer Networks & Security" : `${courseCode} Subject`,
        teacher: "Dr. GMIT Lecturer",
        conducted: 15,
        studentCount: 60,
      };
    case "subjects":
      return {
        success: true,
        section,
        subjects: [
          { courseCode: "21CS51", subject: "Computer Networks & Security", teacher: "Dr. GMIT Lecturer", conducted: 15 },
          { courseCode: "21CS52", subject: "Database Management Systems", teacher: "Prof. Database", conducted: 14 },
          { courseCode: "21CS53", subject: "Web Technology & Applications", teacher: "Prof. Web", conducted: 16 },
        ],
        studentCount: 60,
      };
    case "students":
      return {
        success: true,
        section,
        courseCode,
        subject: "Computer Networks & Security",
        teacher: "Dr. GMIT Lecturer",
        conducted: 15,
        students: Array.from({ length: 10 }, (_, i) => ({
          serial: i + 1,
          usn: `4GM24CS${String(i + 1).padStart(3, "0")}`,
          name: `Student ${i + 1}`,
          attended: 12 + (i % 4),
          conducted: 15,
          percentage: Math.round(((12 + (i % 4)) / 15) * 100),
          minimumRequired: 75,
          status: "ON_TRACK",
          isStarted: true,
        })),
      };
    case "attendance":
      return {
        success: true,
        submitted: false,
        section,
        courseCode,
        subject: "Computer Networks & Security",
        teacher: "Dr. GMIT Lecturer",
        date: params.date || new Date().toISOString().split("T")[0],
        attendance: {},
      };
    case "history":
      return { success: true, history: [] };
    default:
      return { success: true };
  }
}

function postMockResponse(payload: Record<string, unknown>): any {
  return {
    success: true,
    operation: String(payload.action || "submit"),
    section: String(payload.section || "3A").toUpperCase(),
    courseCode: String(payload.courseCode || "21CS51").toUpperCase(),
    date: String(payload.date || new Date().toISOString().split("T")[0]),
    conducted: 16,
    present: 9,
    absent: 1,
    total: 10,
  };
}

function ctrl() {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

export async function apiGet(
  action: string,
  params: Record<string, string | undefined> = {}
): Promise<any> {
  if (isMock()) {
    return getMockResponse(action, params);
  }
  const qs = new URLSearchParams({ action });
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });

  const maxRetries = 3;
  let lastErr: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { signal, done } = ctrl();
    try {
      const res = await fetch(`${BASE}?${qs.toString()}`, { cache: "no-store", redirect: "follow", signal });
      done();
      if (!res.ok && res.status >= 500 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 500));
        continue;
      }
      const text = await res.text();
      if (text.trim().startsWith("<")) throw new ApiNotDeployedError();
      let json: any;
      try { json = JSON.parse(text); } catch { throw new ApiUnavailableError("parse"); }
      if (json && json.success === false && /unknown action/i.test(json.error || "")) {
        throw new ApiNotDeployedError();
      }
      return json;
    } catch (err: any) {
      done();
      if (err instanceof ApiNotDeployedError) throw err;
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
  }

  throw new ApiUnavailableError(lastErr?.message || "network");
}

export async function apiPost(payload: Record<string, unknown>): Promise<any> {
  if (isMock()) {
    return postMockResponse(payload);
  }
  
  const maxRetries = 3;
  let lastErr: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { signal, done } = ctrl();
    try {
      const res = await fetch(BASE!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        redirect: "follow",
        signal,
      });
      done();
      if (!res.ok && res.status >= 500 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 500));
        continue;
      }
      const text = await res.text();
      if (text.trim().startsWith("<")) throw new ApiNotDeployedError();
      let json: any;
      try { json = JSON.parse(text); } catch { throw new ApiNotDeployedError(); }
      if (json && json.success === false && /unknown (post )?action/i.test(json.error || "")) {
        throw new ApiNotDeployedError();
      }
      return json;
    } catch (err: any) {
      done();
      if (err instanceof ApiNotDeployedError) throw err;
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
  }

  throw new ApiUnavailableError(lastErr?.message || "network");
}
