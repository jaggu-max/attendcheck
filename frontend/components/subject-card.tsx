import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Subject } from "@/lib/types";
import { STATUS_THEME } from "@/lib/status";
import { StatusBadge } from "./status-badge";
import { cn, formatPct } from "@/lib/utils";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const day = d.getDate();
  const mon = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  const time = d
    .toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s+/g, " ");
  return `${day} ${mon} ${year}, ${time}`;
}

export function SubjectCard({ subject }: { subject: Subject }) {
  const theme = STATUS_THEME[subject.displayStatus];
  const notStarted = subject.displayStatus === "NOT_STARTED";
  return (
    <Link
      href={`/subjects/${encodeURIComponent(subject.subject)}`}
      data-testid={`subject-card-${subject.subject}`}
      className={cn(
        "group flex items-center gap-4 rounded-lg border bg-surface px-4 py-3.5 transition-all duration-200 hover:shadow-card hover:-translate-y-0.5",
        notStarted ? "border-dashed border-border" : "border-border"
      )}
    >
      {/* accent rail */}
      <span
        className="h-11 w-1 rounded-full"
        style={{ backgroundColor: notStarted ? "hsl(var(--border))" : theme.hex }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-semibold text-ink">
            {subject.subject}
          </p>
          {subject.courseCode && (
            <span className="tnum shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
              {subject.courseCode}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted">
          {subject.teacher || "Faculty to be assigned"}
        </p>
        {subject.lastUpdated && (
          <p className="mt-0.5 text-[11px] text-muted/70">
            Last updated: {formatTimestamp(subject.lastUpdated)}
          </p>
        )}
        <div className="mt-1.5">
          <StatusBadge status={subject.displayStatus} size="sm" />
        </div>
      </div>
      <div className="text-right">
        <p
          className={cn("tnum text-xl font-bold", notStarted ? "text-muted" : "text-ink")}
        >
          {notStarted ? "—" : formatPct(subject.percentage)}
        </p>
        <p className="tnum text-xs text-muted">
          {subject.attended} / {subject.conducted}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
