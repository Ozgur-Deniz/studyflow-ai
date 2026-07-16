"use client";

import { useEffect, useMemo, useRef } from "react";
import { Brain, Coffee, Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";
import { usePomodoroStore } from "@/store/usePomodoroStore";

type PomodoroMode = "focus" | "shortBreak" | "longBreak";

const MODE_CONFIG: Record<
  PomodoroMode,
  {
    label: string;
    accent: string;
    accentMuted: string;
    iconBg: string;
    iconColor: string;
    ringColor: string;
    glowColor: string;
  }
> = {
  focus: {
    label: "Focus",
    accent: "#0a9f43",
    accentMuted: "rgba(10, 159, 67, 0.15)",
    iconBg: "rgba(10, 159, 67, 0.12)",
    iconColor: "#0a9f43",
    ringColor: "#0a9f43",
    glowColor: "rgba(10, 159, 67, 0.25)",
  },
  shortBreak: {
    label: "Break",
    accent: "#14b8a6",
    accentMuted: "rgba(20, 184, 166, 0.15)",
    iconBg: "rgba(20, 184, 166, 0.12)",
    iconColor: "#14b8a6",
    ringColor: "#14b8a6",
    glowColor: "rgba(20, 184, 166, 0.25)",
  },
  longBreak: {
    label: "Rest",
    accent: "#f59e0b",
    accentMuted: "rgba(245, 158, 11, 0.15)",
    iconBg: "rgba(245, 158, 11, 0.12)",
    iconColor: "#f59e0b",
    ringColor: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.25)",
  },
};

const MODE_DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const BREAK_COMPLETION_MESSAGES: Record<
  Exclude<PomodoroMode, "focus">,
  string
> = {
  shortBreak: "Break is finished. Ready for the next focus session?",
  longBreak: "Long break is finished. Ready to focus again?",
};

const MODE_SEQUENCE: PomodoroMode[] = ["focus", "shortBreak", "longBreak"];

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

/* Mini SVG ring showing elapsed progress */
function ProgressRing({
  progress,
  color,
  size = 38,
  strokeWidth = 2.5,
}: {
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 -rotate-90"
      style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        className="text-border"
        strokeWidth={strokeWidth}
        opacity={0.3}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}

export function PomodoroTimer() {
  const completionHandledRef = useRef(false);
  const {
    timeLeft,
    isRunning,
    mode,
    startTimer,
    pauseTimer,
    resetTimer,
    setMode,
    tick,
  } = usePomodoroStore();

  const config = MODE_CONFIG[mode];
  const ModeIcon = mode === "focus" ? Brain : Coffee;

  const progress = useMemo(() => {
    const total = MODE_DURATIONS[mode];
    return 1 - timeLeft / total;
  }, [timeLeft, mode]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      tick();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, tick]);

  useEffect(() => {
    if (timeLeft > 0) {
      completionHandledRef.current = false;
      return;
    }

    if (completionHandledRef.current) {
      return;
    }

    completionHandledRef.current = true;

    const completeSession = async () => {
      if (typeof Audio !== "undefined") {
        const audio = new Audio("/sounds/success.mp3");
        audio.play().catch(() => undefined);
      }

      toast.success(
        mode === "focus"
          ? `Focus is finished. Great job, you earned ${Math.round(
              MODE_DURATIONS.focus / 60,
            )} XP!`
          : BREAK_COMPLETION_MESSAGES[mode],
      );

      try {
        if (mode === "focus") {
          await fetch("/api/study-sessions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              actionType: "POMODORO_FOCUS",
              durationSeconds: MODE_DURATIONS.focus,
            }),
          });
        }
      } finally {
        resetTimer();
      }
    };

    completeSession();
  }, [mode, resetTimer, timeLeft]);

  const cycleMode = () => {
    if (isRunning) {
      return;
    }

    const currentIndex = MODE_SEQUENCE.indexOf(mode);
    const nextMode = MODE_SEQUENCE[(currentIndex + 1) % MODE_SEQUENCE.length];
    setMode(nextMode);
  };

  const handleReset = () => {
    if (isRunning) {
      return;
    }

    resetTimer();
  };

  return (
    <div
      className="glass flex items-center gap-3 rounded-2xl px-3 py-1.5 transition-all duration-300"
      style={{
        boxShadow: isRunning
          ? `0 0 0 1px ${config.accent}22, 0 8px 32px -12px ${config.glowColor}`
          : "var(--shadow-soft-sm)",
        borderColor: isRunning ? `${config.accent}30` : undefined,
      }}
    >
      {/* Mode icon with progress ring */}
      <button
        type="button"
        onClick={cycleMode}
        disabled={isRunning}
        className={`relative flex h-[38px] w-[38px] items-center justify-center rounded-full transition-all duration-200 ${
          isRunning
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:scale-105 active:scale-95"
        }`}
        style={{ background: config.iconBg }}
        aria-label={`Switch mode. Current: ${config.label}`}
        title={config.label}
      >
        <ProgressRing progress={progress} color={config.ringColor} />
        <ModeIcon
          className="relative z-10 h-[16px] w-[16px]"
          style={{ color: config.iconColor }}
          aria-hidden="true"
        />
      </button>

      {/* Time + label */}
      <div className="flex flex-col items-center gap-0">
        <span
          className="min-w-[58px] text-center font-mono text-[15px] font-extrabold tabular-nums leading-tight text-foreground"
        >
          {formatTime(timeLeft)}
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: config.accent }}
        >
          {config.label}
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border" />

      {/* Controls */}
      <div className="flex items-center gap-0.5">
        {!isRunning ? (
          <button
            type="button"
            onClick={startTimer}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: config.accent,
              color: "#fff",
              boxShadow: `0 4px 12px -2px ${config.glowColor}`,
            }}
            aria-label="Start timer"
            title="Start"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={pauseTimer}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-all duration-200 hover:text-foreground hover:scale-105 active:scale-95"
            style={{
              background: config.accentMuted,
              color: config.accent,
            }}
            aria-label="Pause timer"
            title="Pause"
          >
            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={handleReset}
          disabled={isRunning}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-subtle transition-all duration-200 ${
            isRunning
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:bg-surface-muted hover:text-muted hover:scale-105 active:scale-95"
          }`}
          aria-label="Reset timer"
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
