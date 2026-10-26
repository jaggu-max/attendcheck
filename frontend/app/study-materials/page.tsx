"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Eye,
  Download,
  FileQuestion,
  AlertCircle,
  GraduationCap,
  Layers,
  X,
} from "lucide-react";
import { TOC_MODULES, TOC_SUBJECT, TOC_QUESTION_PAPERS } from "@/lib/toc-data";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type View = "semesters" | "subjects" | "subject-detail" | "pdf-viewer";

interface Semester {
  id: string;
  label: string;
  shortLabel: string;
  subjects: SubjectConfig[];
}

interface SubjectConfig {
  id: string;
  name: string;
  code: string;
  faculty?: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const MODULE_COLORS = ["#245BFF", "#7C5CFF", "#12B76A", "#F79009", "#4DEBFF"];

const SEMESTERS: Semester[] = [
  {
    id: "3rd",
    label: "3rd Semester",
    shortLabel: "3rd Sem",
    subjects: [],
  },
  {
    id: "5th",
    label: "5th Semester",
    shortLabel: "5th Sem",
    subjects: [
      {
        id: "toc",
        name: TOC_SUBJECT.name,
        code: TOC_SUBJECT.code,
        faculty: TOC_SUBJECT.faculty,
      },
    ],
  },
  {
    id: "7th",
    label: "7th Semester",
    shortLabel: "7th Sem",
    subjects: [],
  },
];

const SEM_COLORS: Record<string, string> = {
  "3rd": "#245BFF",
  "5th": "#7C5CFF",
  "7th": "#12B76A",
};

// ─── Subcomponents ───────────────────────────────────────────────────────────

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

function ResourceRow({
  label,
  url,
  color,
  onView,
}: {
  label: string;
  url: string;
  color: string;
  onView: (url: string, title: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onView(url, label)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink transition-all hover:shadow-card hover:-translate-y-0.5"
        style={{ borderColor: `${color}33` }}
      >
        <Eye className="h-3.5 w-3.5" style={{ color }} />
        View {label}
      </button>
      <a
        href={url}
        download
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink transition-all hover:shadow-card hover:-translate-y-0.5"
        style={{ borderColor: `${color}33` }}
      >
        <Download className="h-3.5 w-3.5" style={{ color }} />
        Download {label}
      </a>
    </div>
  );
}

// ─── Views ────────────────────────────────────────────────────────────────────

function SemestersView({ onSelect }: { onSelect: (sem: Semester) => void }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-3">
          Select Semester
        </h2>
        <div className="space-y-3">
          {SEMESTERS.map((sem) => {
            const color = SEM_COLORS[sem.id];
            return (
              <button
                key={sem.id}
                onClick={() => onSelect(sem)}
                className="group flex w-full items-center gap-4 rounded-lg border border-border bg-surface px-5 py-4 text-left transition-all hover:shadow-card hover:-translate-y-0.5"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-white text-xs font-bold"
                  style={{ backgroundColor: color }}
                >
                  {sem.id}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink">{sem.label}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {sem.subjects.length === 0
                      ? "No subjects added yet"
                      : `${sem.subjects.length} subject${sem.subjects.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SubjectsView({
  semester,
  onBack,
  onSelect,
}: {
  semester: Semester;
  onBack: () => void;
  onSelect: (sub: SubjectConfig) => void;
}) {
  return (
    <div className="space-y-5 animate-fade-up">
      <BackButton label="All Semesters" onClick={onBack} />

      <div>
        <div className="flex items-center gap-3 mb-4">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white text-xs font-bold"
            style={{ backgroundColor: SEM_COLORS[semester.id] }}
          >
            {semester.id}
          </span>
          <div>
            <h2 className="font-bold text-lg text-ink">{semester.label}</h2>
            <p className="text-xs text-muted">Study Materials</p>
          </div>
        </div>

        {semester.subjects.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-5 py-8 text-center">
            <div className="w-full">
              <Layers className="mx-auto mb-2 h-7 w-7 text-muted" />
              <p className="text-sm font-medium text-ink">No subjects added yet</p>
              <p className="text-xs text-muted mt-1">
                Subjects for this semester will appear here once they are configured.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {semester.subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onSelect(sub)}
                className="group flex w-full items-center gap-4 rounded-lg border border-border bg-surface px-5 py-4 text-left transition-all hover:shadow-card hover:-translate-y-0.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-royal/10">
                  <BookOpen className="h-5 w-5 text-royal" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink truncate">{sub.name}</p>
                    {sub.code && (
                      <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        {sub.code}
                      </span>
                    )}
                  </div>
                  {sub.faculty && (
                    <p className="text-xs text-muted truncate mt-0.5">{sub.faculty}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TocDetailView({
  onBack,
  onViewPdf,
}: {
  onBack: () => void;
  onViewPdf: (url: string, title: string) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-up">
      <BackButton label="5th Semester" onClick={onBack} />

      {/* Subject header */}
      <div className="rounded-lg border border-border bg-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-royal/10">
            <BookOpen className="h-5 w-5 text-royal" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">{TOC_SUBJECT.name}</h2>
            <p className="text-xs text-muted">
              {TOC_SUBJECT.code} · {TOC_SUBJECT.faculty}
            </p>
          </div>
        </div>
      </div>

      {/* Modules */}
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Study Modules
        </h3>

        {TOC_MODULES.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface px-5 py-6 text-center">
            <p className="text-sm font-medium text-ink">Modules have not been added yet.</p>
          </div>
        ) : (
          TOC_MODULES.map((mod) => {
            const color = MODULE_COLORS[(mod.number - 1) % MODULE_COLORS.length];
            return (
              <div
                key={mod.number}
                className="rounded-lg border border-border bg-surface p-5 transition-shadow hover:shadow-card"
              >
                <div className="mb-3 flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    M{mod.number}
                  </span>
                  <p className="text-[15px] font-semibold text-ink">
                    Module {mod.number}: {mod.title}
                  </p>
                </div>

                {/* Topics */}
                <ul className="mb-4 ml-1 space-y-1">
                  {mod.topics.map((topic) => (
                    <li key={topic} className="flex items-start gap-2 text-xs text-muted">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {topic}
                    </li>
                  ))}
                </ul>

                {/* Resource buttons */}
                <div className="space-y-2.5">
                  {mod.textbook ? (
                    <ResourceRow
                      label="Textbook"
                      url={mod.textbook}
                      color={color}
                      onView={onViewPdf}
                    />
                  ) : (
                    <p className="text-xs text-muted italic">Textbook has not been uploaded yet.</p>
                  )}
                  {mod.writtenNotes ? (
                    <ResourceRow
                      label="Written Notes"
                      url={mod.writtenNotes}
                      color={color}
                      onView={onViewPdf}
                    />
                  ) : (
                    <p className="text-xs text-muted italic">Written notes have not been uploaded yet.</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* PQP */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Previous Question Papers (PQP)
        </h3>

        {TOC_QUESTION_PAPERS.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-5 py-5">
            <AlertCircle className="h-5 w-5 shrink-0 text-muted" />
            <div>
              <p className="text-sm font-medium text-ink">No previous question papers added yet.</p>
              <p className="text-xs text-muted">
                Question papers will appear here once they are uploaded.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {TOC_QUESTION_PAPERS.map((pqp) => (
              <div
                key={pqp.url}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <FileQuestion className="h-4 w-4 shrink-0 text-muted" />
                  <span className="text-sm font-medium text-ink">{pqp.label}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewPdf(pqp.url, pqp.label)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink hover:shadow-card"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </button>
                  <a
                    href={pqp.url}
                    download
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink hover:shadow-card"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PdfViewer({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg animate-fade-up">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="max-w-xs truncate text-sm font-semibold text-ink">{title}</span>
        <a
          href={url}
          download
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink hover:shadow-card"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </div>
      {/* PDF iframe */}
      <iframe
        src={url}
        title={title}
        className="flex-1 w-full border-0"
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudyMaterialsPage() {
  const [view, setView] = useState<View>("semesters");
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectConfig | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");

  const openPdf = (url: string, title: string) => {
    setPdfUrl(url);
    setPdfTitle(title);
    setView("pdf-viewer");
  };

  const closePdf = () => {
    setPdfUrl(null);
    setView("subject-detail");
  };

  return (
    <>
      {/* PDF fullscreen overlay */}
      {view === "pdf-viewer" && pdfUrl && (
        <PdfViewer url={pdfUrl} title={pdfTitle} onClose={closePdf} />
      )}

      <main className="relative flex min-h-screen flex-col overflow-hidden">
        <div className="ambient-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]" />

        <div className="relative mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-8">
          {/* Page header */}
          <div className="mb-8 animate-fade-up">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-royal/10">
                <GraduationCap className="h-6 w-6 text-royal" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">
                  GMIT Study Materials
                </h1>
                <p className="text-sm text-muted">
                  Access semester-wise textbooks, module notes, and previous
                  question papers.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {view === "semesters" || view === "pdf-viewer" ? (
            <SemestersView
              onSelect={(sem) => {
                setSelectedSemester(sem);
                setView("subjects");
              }}
            />
          ) : view === "subjects" && selectedSemester ? (
            <SubjectsView
              semester={selectedSemester}
              onBack={() => setView("semesters")}
              onSelect={(sub) => {
                setSelectedSubject(sub);
                setView("subject-detail");
              }}
            />
          ) : view === "subject-detail" && selectedSubject?.id === "toc" ? (
            <TocDetailView
              onBack={() => setView("subjects")}
              onViewPdf={openPdf}
            />
          ) : null}
        </div>
      </main>
    </>
  );
}
