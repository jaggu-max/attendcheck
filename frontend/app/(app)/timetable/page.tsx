"use client";

import { useAttendance } from "@/components/attendance-provider";
import { EmptyState } from "@/components/empty-state";
import { DashboardSkeleton } from "@/components/skeletons";
import { BookOpen, ZoomIn, ZoomOut, RotateCcw, Calendar, Clock, MapPin, Info, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { TIMETABLE_5A, TIME_SLOTS, type ClassSlot } from "@/lib/timetable-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

function TopSnippet() {
  const [current, setCurrent] = useState<string>("Loading schedule...");
  const [subText, setSubText] = useState<string>("");

  useEffect(() => {
    function updateSnippet() {
      const now = new Date();
      const day = now.getDay();
      const hh = now.getHours();
      const mm = now.getMinutes();
      const currentMinutes = hh * 60 + mm;

      // Ensure active for debugging or actual deployment?
      // const currentMinutes = 11 * 60 + 15; // Un-comment to test HR4
      // const day = 1; // Mon

      const todayData = TIMETABLE_5A.find(d => d.dayIndex === day);
      if (!todayData) {
        setCurrent("No classes today.");
        setSubText("Enjoy your day off!");
        return;
      }

      let activeClass: ClassSlot | null = null;
      let nextClass: ClassSlot | null = null;
      let activeTs: typeof TIME_SLOTS[0] | null = null;
      let nextTs: typeof TIME_SLOTS[0] | null = null;
      
      let dataSlotIndex = 0;
      let skipNextCol = false;
      let currentPeriodFound = false;

      // We march through TIME_SLOTS sequentially. 
      // B1 and B2 don't consume `dataSlotIndex`.
      for (let idx = 0; idx < TIME_SLOTS.length; idx++) {
        const slot = TIME_SLOTS[idx];
        const [sH, sM] = slot.start.split(":").map(Number);
        const [eH, eM] = slot.end.split(":").map(Number);
        const sMins = sH * 60 + sM;
        const eMins = eH * 60 + eM;

        let slotData: ClassSlot | null = null;
        if (!slot.isBreak) {
          if (skipNextCol) {
            skipNextCol = false;
            // The slotData is technically the SAME as the previous one, conceptually it occupies this time too.
            slotData = todayData.slots[dataSlotIndex - 1] as unknown as ClassSlot; 
          } else {
            slotData = todayData.slots[dataSlotIndex++] as unknown as ClassSlot;
            if (slotData && slotData.colSpan && slotData.colSpan > 1) {
              skipNextCol = true;
            }
          }
        }

        // Are we in this slot?
        if (currentMinutes >= sMins && currentMinutes < eMins) {
          currentPeriodFound = true;
          if (slot.isBreak) {
             setCurrent(`${slot.name} | ${slot.label}`);
             setSubText("");
          } else if (slotData && slotData.type !== "Empty") {
             activeClass = slotData;
             activeTs = slot;
             setCurrent(`CURRENT: ${activeClass.name}`);
             
             const remaining = eMins - currentMinutes;
             setSubText(`Room ${activeClass.room || '-'} • Ends in ${remaining} min`);
          } else {
             setCurrent("No active class right now.");
             setSubText("");
          }
        } 
        
        // Find next upcoming class if we haven't found a current active teaching class:
        if (!currentPeriodFound && currentMinutes < sMins) {
          // This slot starts in the future.
          if (!slot.isBreak && slotData && slotData.type !== "Empty") {
             if (!nextClass) { // Only set the first one we find
               nextClass = slotData;
               nextTs = slot;
             }
          }
        }
      }

      if (!currentPeriodFound) {
         if (nextClass && nextTs) {
           const [sH, sM] = nextTs.start.split(":").map(Number);
           const startsIn = (sH * 60 + sM) - currentMinutes;
           setCurrent(`NEXT: ${nextClass.name}`);
           setSubText(`${nextTs.label} in ${startsIn} min • Room ${nextClass.room || '-'}`);
         } else {
           // We've passed all classes
           setCurrent("Classes are over for today.");
           setSubText("See you tomorrow!");
         }
      }
    }
    updateSnippet();
    const interval = setInterval(updateSnippet, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-6 flex flex-col justify-center rounded-lg border border-border bg-gradient-to-r from-royal/10 to-royal/5 p-4 shadow-sm">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 text-royal/80"><Clock size={12} /> Today's Schedule</h3>
      <div className="text-base font-bold text-royal line-clamp-1">{current}</div>
      {subText && <div className="mt-1 text-xs font-semibold text-royal/80">{subText}</div>}
    </div>
  );
}

export default function TimetablePage() {
  const { data, loading } = useAttendance();
  const [zoom, setZoom] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<(ClassSlot & { slotInfo: typeof TIME_SLOTS[0] }) | null>(null);
  const [todayDayIndex, setTodayDayIndex] = useState(-1);

  useEffect(() => {
    setTodayDayIndex(new Date().getDay());
  }, []);

  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return null;

  if (data.student.section?.toUpperCase() !== "5A") {
    return (
      <div className="mt-12">
        <EmptyState
          icon={Calendar}
          title="Timetable restricted"
          description="The timetable feature is currently only available for Section 5A students."
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Timetable</h1>
        <p className="mt-1 text-sm text-muted">
          Semester 5 &middot; Section A &middot; 2026-27 &middot; Room: C-132
        </p>
      </header>

      <TopSnippet />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Weekly View
        </h2>
        
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 shadow-sm">
          <button 
            className="p-1 text-muted hover:text-ink disabled:opacity-50"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            disabled={zoom <= 0.5}
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="w-12 text-center text-xs font-medium tnum text-ink">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            className="p-1 text-muted hover:text-ink disabled:opacity-50"
            onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
            disabled={zoom >= 2.0}
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <div className="mx-1 h-3 w-px bg-border"></div>
          <button 
            className="p-1 text-muted hover:text-ink"
            onClick={() => setZoom(1)}
            title="Reset Zoom"
            aria-label="Reset zoom"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto rounded-lg border border-border bg-surface custom-scrollbar pb-4 relative min-h-[400px]">
        <div 
          className="origin-top-left transition-transform duration-200" 
          style={{ transform: `scale(${zoom})`, width: 'max-content' }}
        >
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-surface-2">
                <th className="border-b border-r border-border p-3 font-semibold text-ink sticky left-0 z-20 bg-surface-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] w-16">Day</th>
                {TIME_SLOTS.map((ts, i) => (
                  <th key={ts.id} className="border-b border-r border-border p-3 font-medium text-muted">
                    <div className="flex flex-col items-center min-w-[90px]">
                      <span className="font-semibold text-ink text-xs">{ts.id === "B1" || ts.id === "B2" ? ts.name : ts.id}</span>
                      <span className="text-[10px] mt-1">{ts.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIMETABLE_5A.map((dayData) => {
                const isToday = dayData.dayIndex === todayDayIndex;
                let dataSlotIndex = 0; 
                let skipNextCol = false; 

                if (dayData.day === "Sat") {
                  return (
                    <tr key={dayData.day} className={cn("transition-colors relative", isToday ? "bg-royal/[0.04]" : "")}>
                      <td className={cn(
                        "border-b border-r border-border p-3 font-bold sticky left-0 z-10 w-16 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.02)]",
                        isToday ? "bg-surface text-royal" : "bg-surface text-ink"
                      )}>
                        <div className="flex flex-col items-center">
                          <span>{dayData.day}</span>
                          {isToday && <span className="text-[9px] uppercase font-bold text-royal mt-1 tracking-widest bg-royal/10 px-1.5 py-0.5 rounded">Today</span>}
                        </div>
                      </td>
                      <td colSpan={TIME_SLOTS.length} className="border-b border-r border-border bg-surface p-3 text-center text-sm font-semibold text-muted/50 tracking-widest py-8">
                        NO SCHEDULED CLASSES
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={dayData.day} className={cn("transition-colors relative", isToday ? "bg-royal/[0.04]" : "")}>
                    <td className={cn(
                      "border-b border-r border-border p-3 font-bold sticky left-0 z-10 w-16 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.02)]",
                      isToday ? "bg-surface text-royal" : "bg-surface text-ink"
                    )}>
                      <div className="flex flex-col items-center">
                        <span>{dayData.day}</span>
                        {isToday && <span className="text-[9px] uppercase font-bold text-royal mt-1 tracking-widest bg-royal/10 px-1.5 py-0.5 rounded">Today</span>}
                      </div>
                    </td>
                    
                    {TIME_SLOTS.map((ts) => {
                      if (ts.isBreak) {
                        return (
                          <td key={ts.id} className="border-b border-r border-border bg-surface-2/40 p-2 text-center text-xs font-medium text-muted min-w-[40px]">
                            <div className="flex items-center justify-center rotate-180" style={{ writingMode: 'vertical-rl' }}>{ts.name}</div>
                          </td>
                        );
                      }

                      if (skipNextCol) {
                        skipNextCol = false;
                        return null; 
                      }

                      const slot = dayData.slots[dataSlotIndex++] as unknown as ClassSlot;
                      if (!slot) return <td key={ts.id} className="border-b border-r border-border bg-surface"></td>;

                      if (slot.colSpan && slot.colSpan > 1) {
                        skipNextCol = true;
                      }

                      return (
                        <td 
                          key={ts.id} 
                          colSpan={slot.colSpan || 1}
                          onClick={() => slot.type !== "Empty" && setSelectedSlot({ ...slot, slotInfo: ts })}
                          className={cn(
                            "border-b border-r border-border p-3 align-top min-w-[120px]",
                            slot.type !== "Empty" ? "cursor-pointer hover:bg-surface-2 transition-colors relative group" : ""
                          )}
                        >
                          {slot.type !== "Empty" && (
                            <div className="flex flex-col h-full min-h-[90px] justify-between">
                              <div>
                                <span className={cn(
                                  "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2",
                                  slot.type === 'Lecture' ? "bg-blue-100 text-blue-700" :
                                  slot.type === 'Practical' || slot.type === 'Project' ? "bg-emerald-100 text-emerald-700" :
                                  "bg-purple-100 text-purple-700"
                                )}>
                                  {slot.type}
                                </span>
                                <div className="font-bold text-sm text-ink leading-tight pr-2 group-hover:text-royal transition-colors">{slot.name}</div>
                              </div>
                              <div className="mt-3 flex flex-col gap-1.5 text-[11px] font-medium text-muted">
                                {slot.faculty && (
                                  <div className="flex items-center gap-1.5 line-clamp-1"><BookOpen size={10} className="shrink-0"/> <span className="truncate">{slot.faculty}</span></div>
                                )}
                                {slot.room && (
                                  <div className="flex items-center gap-1.5"><MapPin size={10} className="shrink-0"/> <span>{slot.room}</span></div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subject Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedSlot(null)}>
          <div className="w-full max-w-sm rounded-[16px] border border-border bg-surface p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest mb-2",
                  selectedSlot.type === 'Lecture' ? "bg-blue-100 text-blue-700" :
                  selectedSlot.type === 'Practical' || selectedSlot.type === 'Project' ? "bg-emerald-100 text-emerald-700" :
                  "bg-purple-100 text-purple-700"
                )}>
                  {selectedSlot.type}
                </span>
                <h3 className="text-xl font-bold text-ink leading-tight">{selectedSlot.name}</h3>
                {selectedSlot.code && <p className="text-xs font-semibold text-muted mt-1 uppercase tracking-wider">{selectedSlot.code}</p>}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-sm text-ink">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted"><Clock size={16} /></div>
                <div>
                  <p className="font-semibold text-ink">{selectedSlot.slotInfo.label}</p>
                </div>
              </div>
              {selectedSlot.room && (
                <div className="flex items-center gap-3 text-sm text-ink">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted"><MapPin size={16} /></div>
                  <p className="font-semibold text-ink">{selectedSlot.room}</p>
                </div>
              )}
              {selectedSlot.faculty && (
                <div className="flex items-center gap-3 text-sm text-ink">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted"><BookOpen size={16} /></div>
                  <p className="font-semibold text-ink line-clamp-2">{selectedSlot.faculty}</p>
                </div>
              )}
            </div>
            
            {/* Action */}
            {selectedSlot.code ? (
              (() => {
                const matched = data.subjects.find(
                  (s) =>
                    s.courseCode === selectedSlot.code ||
                    s.subject === selectedSlot.code ||
                    s.subject.toUpperCase().includes(selectedSlot.name.split(" ")[0].toUpperCase())
                );
                const targetSlug = matched ? matched.subject : selectedSlot.code;
                return (
                  <Link 
                    href={`/subjects/${encodeURIComponent(targetSlug)}`}
                    className="flex w-full items-center justify-between rounded-lg bg-royal px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-royal/90"
                  >
                    <span>View Attendance</span>
                    <ArrowRight size={18} />
                  </Link>
                );
              })()
            ) : (
              <button 
                onClick={() => setSelectedSlot(null)}
                className="w-full rounded-lg bg-surface-2 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2/80"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
