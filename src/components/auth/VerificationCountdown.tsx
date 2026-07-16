"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

interface VerificationCountdownProps {
  expiresAt?: string | null;
  durationMs?: number;
  onExpire?: () => void;
}

function getTargetTime(expiresAt?: string | null, durationMs = DEFAULT_DURATION_MS) {
  if (expiresAt) {
    const parsedTime = new Date(expiresAt).getTime();

    if (Number.isFinite(parsedTime)) {
      return parsedTime;
    }
  }

  return Date.now() + durationMs;
}

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function VerificationCountdown({
  expiresAt,
  durationMs = DEFAULT_DURATION_MS,
  onExpire,
}: VerificationCountdownProps) {
  const targetTime = useMemo(
    () => getTargetTime(expiresAt, durationMs),
    [durationMs, expiresAt],
  );
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, targetTime - Date.now()),
  );

  useEffect(() => {
    const updateRemainingTime = () => {
      const nextRemainingMs = Math.max(0, targetTime - Date.now());
      setRemainingMs(nextRemainingMs);

      if (nextRemainingMs === 0) {
        onExpire?.();
      }
    };

    updateRemainingTime();
    const interval = window.setInterval(updateRemainingTime, 1000);

    return () => window.clearInterval(interval);
  }, [onExpire, targetTime]);

  const progress = Math.max(0, Math.min(1, remainingMs / durationMs));
  const progressPercentage = Math.round(progress * 100);
  const isExpired = remainingMs === 0;

  return (
    <div
      className={`mt-5 overflow-hidden rounded-2xl border p-4 transition-all duration-500 ${
        isExpired
          ? "border-rose-100 bg-rose-50 text-rose-700"
          : "border-[#bbf7d0] bg-[#f0fdf4] text-[#087b36]"
      }`}
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-soft-sm"
          style={{
            background: `conic-gradient(${isExpired ? "#fb7185" : "#22c55e"} ${progressPercentage}%, #e2e8f0 0)`,
          }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">
              {isExpired ? "Code expired" : "Code expires in"}
            </p>
            <span className="tabular-nums text-lg font-semibold leading-none">
              {formatRemaining(remainingMs)}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                isExpired
                  ? "bg-rose-400"
                  : "bg-gradient-to-r from-[#0a9f43] via-[#22c55e] to-[#4ade80]"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
