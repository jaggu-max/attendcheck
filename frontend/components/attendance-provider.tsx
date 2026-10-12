"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { AttendanceData } from "@/lib/types";

interface AttendanceState {
  data: AttendanceData | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AttendanceState | null>(null);

export function useAttendance(): AttendanceState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
  return ctx;
}

const STORAGE_KEY = "gmit_attendance_cache_v1";

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const started = useRef(false);

  // Instant local cache hydration on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AttendanceData;
        if (parsed && parsed.subjects && parsed.student) {
          setData(parsed);
          setLoading(false);
        }
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  const load = useCallback(
    async (force: boolean) => {
      if (force) setRefreshing(true);
      try {
        const res = await fetch(`/gs/attendance${force ? "?refresh=1" : ""}`, {
          credentials: "same-origin",
        });
        if (res.status === 401) {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
          router.replace("/");
          return;
        }
        const json = await res.json();
        if (!res.ok) {
          // If we already have cached data, don't break the user experience with an error screen
          setData((prev) => {
            if (!prev) setError(json.error ?? "Attendance data couldn't be loaded.");
            return prev;
          });
        } else {
          const freshData = json as AttendanceData;
          setData(freshData);
          setError(null);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
          } catch {}
        }
      } catch {
        setData((prev) => {
          if (!prev) setError("Attendance data couldn't be loaded.");
          return prev;
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return (
    <Ctx.Provider
      value={{
        data,
        error,
        loading,
        refreshing,
        lastUpdated: data?.fetchedAt ?? null,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
