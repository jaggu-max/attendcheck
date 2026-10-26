"use client";

import { useState } from "react";
import { GraduationCap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TocSubject } from "./toc-subject";

type Semester = "3rd" | "5th" | "7th";

const SEMESTERS: Semester[] = ["3rd", "5th", "7th"];

function ComingSoon({ semester }: { semester: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
      <Clock className="mb-3 h-8 w-8 text-muted" />
      <p className="text-sm font-semibold text-ink">{semester} Semester Materials</p>
      <p className="mt-1 max-w-xs text-xs text-muted">
        Study materials for this semester will be added soon.
      </p>
    </div>
  );
}

export function SemesterMaterials() {
  const [active, setActive] = useState<Semester>("5th");

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Study Materials</h1>
        <p className="mt-1 text-sm text-muted">
          Textbooks, written notes, and question papers by semester.
        </p>
      </header>

      {/* Semester tabs */}
      <div className="flex gap-2 rounded-lg border border-border bg-surface p-1">
        {SEMESTERS.map((sem) => (
          <button
            key={sem}
            onClick={() => setActive(sem)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition-all",
              active === sem
                ? "bg-royal text-white shadow-card"
                : "text-muted hover:text-ink"
            )}
          >
            {sem} Sem
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "5th" ? (
        <div className="space-y-4">
          {/* Subject selector — only TOC for now */}
          <div className="flex items-center gap-2 rounded-lg border border-royal/20 bg-royal/5 px-4 py-3">
            <GraduationCap className="h-4 w-4 shrink-0 text-royal" />
            <span className="text-sm font-semibold text-ink">
              Theory of Computation{" "}
              <span className="ml-1 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                BCS503
              </span>
            </span>
          </div>
          <TocSubject />
        </div>
      ) : (
        <ComingSoon semester={active} />
      )}
    </div>
  );
}
