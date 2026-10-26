"use client";

import { BookOpen, Download, Eye, FileText, AlertCircle } from "lucide-react";
import { TOC_MODULES, TOC_SUBJECT, TOC_QUESTION_PAPERS } from "@/lib/toc-data";
import { cn } from "@/lib/utils";

// Accent colors per module (cycles through brand palette)
const MODULE_COLORS = [
  "#245BFF", // royal blue  – module 1
  "#7C5CFF", // violet      – module 2
  "#12B76A", // success green – module 3
  "#F79009", // warning amber – module 4
  "#4DEBFF", // cyan        – module 5
];

interface ResourceButtonsProps {
  label: string;
  viewUrl: string;
  downloadUrl: string;
  color: string;
}

function ResourceButtons({ label, viewUrl, downloadUrl, color }: ResourceButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={viewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink transition-all hover:shadow-card hover:-translate-y-0.5"
        style={{ borderColor: `${color}33` }}
      >
        <Eye className="h-3.5 w-3.5" style={{ color }} />
        View {label}
      </a>
      <a
        href={downloadUrl}
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

export function TocSubject() {
  return (
    <div className="space-y-6 animate-fade-up">
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

      {/* Module cards */}
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Study Modules
        </h3>
        {TOC_MODULES.map((mod) => {
          const color = MODULE_COLORS[(mod.number - 1) % MODULE_COLORS.length];
          return (
            <div
              key={mod.number}
              className="rounded-lg border border-border bg-surface p-5 transition-shadow hover:shadow-card"
            >
              {/* Module title row */}
              <div className="mb-3 flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  M{mod.number}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-ink">
                    Module {mod.number}: {mod.title}
                  </p>
                </div>
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
                {mod.textbook && (
                  <ResourceButtons
                    label="Textbook"
                    viewUrl={mod.textbook}
                    downloadUrl={mod.textbook}
                    color={color}
                  />
                )}
                {mod.writtenNotes && (
                  <ResourceButtons
                    label="Written Notes"
                    viewUrl={mod.writtenNotes}
                    downloadUrl={mod.writtenNotes}
                    color={color}
                  />
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Previous Question Papers */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Previous Question Papers (PQP)
        </h3>
        {TOC_QUESTION_PAPERS.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-5 py-5">
            <AlertCircle className="h-5 w-5 shrink-0 text-muted" />
            <div>
              <p className="text-sm font-medium text-ink">No question papers added yet</p>
              <p className="text-xs text-muted">
                Previous question papers will appear here once they are uploaded.
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
                  <FileText className="h-4 w-4 shrink-0 text-muted" />
                  <span className="text-sm font-medium text-ink">{pqp.label}</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={pqp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink hover:shadow-card"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </a>
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
