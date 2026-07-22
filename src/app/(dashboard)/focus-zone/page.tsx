"use client";

import { useEffect, useRef, useState } from "react";
import { Ubuntu_Sans } from "next/font/google";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { recordFocusSession } from "@/app/actions/focus-session.actions";
import { refreshDashboardActivity } from "@/lib/dashboard-notifications";

type FocusTab = "Pomodoro" | "Stopwatch" | "Countdown";
type PomodoroMode = "focus" | "shortBreak" | "longBreak" | "deepWork";

const tabs: FocusTab[] = ["Pomodoro", "Stopwatch", "Countdown"];
const countdownHours = Array.from({ length: 13 }, (_, index) => index);
const countdownMinutes = Array.from({ length: 60 }, (_, index) => index);
const ubuntuSans = Ubuntu_Sans({
  subsets: ["latin"],
  weight: ["700"],
});

const pomodoroModes: Array<{
  id: PomodoroMode;
  name: string;
  description: string;
  durations: number[];
}> = [
  {
    id: "focus",
    name: "Focus",
    description: "Classic focus block",
    durations: [25, 30, 45],
  },
  {
    id: "shortBreak",
    name: "Short Break",
    description: "Quick recovery",
    durations: [5, 10, 15],
  },
  {
    id: "longBreak",
    name: "Long Break",
    description: "Extended reset",
    durations: [15, 20, 30],
  },
  {
    id: "deepWork",
    name: "Deep Work",
    description: "Long focus session",
    durations: [50, 75, 90],
  },
];

export default function FocusZonePage() {
  const [activeTab, setActiveTab] = useState<FocusTab>("Pomodoro");
  const [activePomodoroMode, setActivePomodoroMode] =
    useState<PomodoroMode>("focus");
  const [timeLeft, setTimeLeft] = useState(1500);
  const [initialTime, setInitialTime] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [countdownHour, setCountdownHour] = useState(0);
  const [countdownMinute, setCountdownMinute] = useState(15);
  const focusSessionSaveLockRef = useRef(false);

  const currentPomodoroMode =
    pomodoroModes.find((mode) => mode.id === activePomodoroMode) ??
    pomodoroModes[0];
  const customPlaceholder =
    currentPomodoroMode.durations[1] ?? currentPomodoroMode.durations[0];

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((currentTime) => {
        if (activeTab === "Stopwatch") {
          return currentTime + 1;
        }

        if (currentTime <= 1) {
          window.clearInterval(intervalId);
          setIsRunning(false);
          return 0;
        }

        return currentTime - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeTab, isRunning]);

  useEffect(() => {
    if (timeLeft !== 0) {
      return;
    }

    if (
      activeTab !== "Pomodoro" ||
      (activePomodoroMode !== "focus" && activePomodoroMode !== "deepWork") ||
      initialTime <= 0 ||
      focusSessionSaveLockRef.current
    ) {
      return;
    }

    focusSessionSaveLockRef.current = true;

    void recordFocusSession({
      mode: activePomodoroMode,
      durationSeconds: initialTime,
    }).then((result) => {
      if (!result.success) {
        console.error("[Focus Zone] Focus session was not recorded:", result.error);
        return;
      }

      refreshDashboardActivity();
    });
  }, [activePomodoroMode, activeTab, initialTime, timeLeft]);

  const handleSetDuration = (minutes: number) => {
    const nextTime = minutes * 60;

    focusSessionSaveLockRef.current = false;
    setTimeLeft(nextTime);
    setInitialTime(nextTime);
    setIsRunning(false);
  };

  const handleSetCountdownDuration = (hours: number, minutes: number) => {
    const nextTime = hours * 3600 + minutes * 60;

    focusSessionSaveLockRef.current = false;
    setCountdownHour(hours);
    setCountdownMinute(minutes);
    setTimeLeft(nextTime);
    setInitialTime(nextTime);
    setIsRunning(false);
  };

  const totalHours = Math.floor(timeLeft / 3600);
  const minuteValue = Math.floor((timeLeft % 3600) / 60);
  const secondValue = timeLeft % 60;
  const showHours =
    totalHours > 0 || (activeTab === "Countdown" && countdownHour > 0);
  const displayHours = String(totalHours).padStart(2, "0");
  const displayMinutes = String(
    showHours ? minuteValue : Math.floor(timeLeft / 60),
  ).padStart(2, "0");
  const displaySeconds = String(secondValue).padStart(2, "0");
  const flipGroups = showHours
    ? [displayHours, displayMinutes, displaySeconds]
    : [displayMinutes, displaySeconds];
  const progressPercent =
    initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <style>{`
        @keyframes flipDown {
          0% {
            opacity: 0.9;
            transform: rotateX(0deg);
          }

          100% {
            opacity: 0;
            transform: rotateX(-92deg);
          }
        }

        .flip-card-top {
          animation: flipDown 620ms cubic-bezier(0.2, 0.8, 0.2, 1);
          transform-origin: bottom;
          transform-style: preserve-3d;
        }
      `}</style>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-sm font-medium uppercase tracking-[0.12em] text-slate-500 shadow-sm">
            <Timer className="h-3.5 w-3.5 text-emerald-700" />
            Focus Studio
          </div>
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-slate-950">
            Focus Zone
          </h1>
          <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Build a calm study rhythm with focused work sessions, intentional
            breaks, a simple stopwatch, and flexible countdown tools.
          </p>
        </div>
      </div>

      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 xl:p-8">
        <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  focusSessionSaveLockRef.current = false;
                  setActiveTab(tab);
                  setIsRunning(false);

                  if (tab === "Pomodoro") {
                    handleSetDuration(currentPomodoroMode.durations[0]);
                  }

                  if (tab === "Countdown") {
                    handleSetCountdownDuration(countdownHour, countdownMinute);
                  }

                  if (tab === "Stopwatch") {
                    setTimeLeft(0);
                    setInitialTime(0);
                  }
                }}
                className={`cursor-pointer rounded-lg px-1 py-2.5 text-[11px] font-medium transition-all min-[400px]:px-3 min-[400px]:text-sm sm:text-base ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-4 xl:gap-8 xl:px-4">
          {activeTab === "Pomodoro" && (
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 xl:col-span-1">
              <div className="mb-5">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                  Select Mode
                </p>
                <p className="mt-1 text-sm font-normal leading-5 text-slate-500">
                  Pick a session type, then choose a preset or enter your own
                  time.
                </p>
              </div>

              <div className="space-y-2">
                {pomodoroModes.map((mode) => {
                  const isActive = activePomodoroMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setActivePomodoroMode(mode.id);
                        handleSetDuration(mode.durations[0]);
                      }}
                      className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        isActive
                          ? "border-slate-900 bg-white text-slate-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {mode.durations[0]}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-sm font-medium ${
                            isActive ? "text-slate-900" : "text-slate-700"
                          }`}
                        >
                          {mode.name}
                        </span>
                        <span
                          className={`mt-0.5 block text-xs font-normal leading-5 ${
                            isActive ? "text-slate-500" : "text-slate-500"
                          }`}
                        >
                          {mode.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                  Template Time
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {currentPomodoroMode.durations.map((minutes) => {
                    const isSelected = timeLeft === minutes * 60;

                    return (
                      <button
                        key={`${currentPomodoroMode.id}-${minutes}`}
                        type="button"
                        onClick={() => {
                          handleSetDuration(minutes);
                          setCustomMinutes("");
                        }}
                        className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-slate-900 bg-white text-slate-900"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {minutes}m
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <label
                  htmlFor="custom-pomodoro-minutes"
                  className="block text-xs font-medium uppercase tracking-[0.12em] text-slate-500"
                >
                  Custom Time
                </label>
                <div className="mt-3 flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <input
                      id="custom-pomodoro-minutes"
                      type="number"
                      min="1"
                      max="180"
                      value={customMinutes}
                      onChange={(event) => setCustomMinutes(event.target.value)}
                      placeholder={String(customPlaceholder)}
                      className="h-11 w-full cursor-text rounded-xl border border-slate-200 bg-slate-50 px-3 pr-12 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-600 focus:border-emerald-200 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600">
                      min
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const minutes = Number(customMinutes);

                      if (Number.isFinite(minutes) && minutes > 0) {
                        handleSetDuration(Math.min(180, Math.floor(minutes)));
                      }
                    }}
                    className="h-11 cursor-pointer rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100"
                  >
                    Apply
                  </button>
                </div>
                <p className="mt-2 text-xs font-normal leading-5 text-slate-500">
                  Use any duration between 1 and 180 minutes.
                </p>
              </div>
            </aside>
          )}

          <div
            className={`@container flex min-w-0 flex-col ${
              activeTab === "Countdown"
                ? "order-2 min-h-0 justify-start pt-0"
                : "min-h-[28rem] justify-center"
            } ${
              activeTab === "Pomodoro" ? "xl:col-span-3" : "xl:col-span-4"
            }`}
          >
            {activeTab === "Pomodoro" && (
              <div className="mb-7 text-center">
                <p className="text-3xl font-medium text-slate-800 sm:text-4xl">
                  {currentPomodoroMode.name}
                </p>
                <div className="mx-auto mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-[width] duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex min-w-0 max-w-full justify-center text-center">
              <div
                className={`max-w-full rounded-[2rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-[clamp(0.75rem,2cqw,3rem)] shadow-inner ${
                  showHours
                    ? "py-6 xl:py-8"
                    : "py-8 xl:py-10"
                }`}
              >
                <div className="flex min-w-0 items-center justify-center gap-[clamp(0.375rem,1.25cqw,0.75rem)]">
                  {flipGroups.map((group, groupIndex) => (
                    <div
                      key={`${groupIndex}-${group}`}
                      className="flex min-w-0 items-center gap-[clamp(0.375rem,1.25cqw,0.75rem)]"
                    >
                      {groupIndex > 0 && (
                        <div
                          className={`mx-[clamp(0rem,0.5cqw,0.5rem)] flex shrink-0 flex-col justify-center ${
                            showHours
                              ? "h-[clamp(6rem,16cqw,8rem)] gap-2"
                              : "h-[clamp(6rem,20cqw,10rem)] gap-3"
                          }`}
                        >
                          <span
                            className={`rounded-full bg-slate-800 shadow-inner ${
                              showHours
                              ? "h-2.5 w-2.5 xl:h-3 xl:w-3"
                                : "h-3 w-3 xl:h-4 xl:w-4"
                            }`}
                          />
                          <span
                            className={`rounded-full bg-slate-800 shadow-inner ${
                              showHours
                              ? "h-2.5 w-2.5 xl:h-3 xl:w-3"
                                : "h-3 w-3 xl:h-4 xl:w-4"
                            }`}
                          />
                        </div>
                      )}
                      {group.split("").map((digit, digitIndex) => (
                        <div
                          key={`${groupIndex}-${digitIndex}-${digit}-${group}`}
                          className={`relative rounded-xl border border-slate-200 bg-white text-slate-950 shadow-[inset_0_2px_12px_rgba(255,255,255,0.95),inset_0_-14px_24px_rgba(15,23,42,0.08),0_16px_30px_rgba(15,23,42,0.10)] ${
                            showHours
                              ? "h-[clamp(7rem,18cqw,9rem)] w-[clamp(2.75rem,10.5cqw,6rem)]"
                              : "h-[clamp(7rem,24cqw,11rem)] w-[clamp(3rem,16cqw,7rem)]"
                          }`}
                          style={{ perspective: "900px" }}
                        >
                          <span className="absolute -top-2 left-[28%] z-20 h-4 w-1.5 rounded-full border border-gray-700 bg-gradient-to-b from-gray-300 to-gray-500 shadow" />
                          <span className="absolute -top-2 right-[28%] z-20 h-4 w-1.5 rounded-full border border-gray-700 bg-gradient-to-b from-gray-300 to-gray-500 shadow" />
                          <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white to-slate-100" />
                          <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-xl bg-gradient-to-b from-slate-50 to-slate-200" />
                          <div className="absolute left-0 right-0 top-1/2 z-10 h-px -translate-y-1/2 border-b border-slate-300 bg-slate-400/70 shadow-[0_1px_0_rgba(255,255,255,0.9)]" />
                          <div className="pointer-events-none absolute inset-x-1 top-1 h-1/2 rounded-t-lg bg-white/70" />
                          <div
                            className={`${ubuntuSans.className} absolute inset-0 z-10 flex items-center justify-center font-bold leading-none tracking-tight ${
                              showHours
                                ? "text-[clamp(3.5rem,10cqw,6rem)]"
                                : "text-[clamp(4rem,14cqw,8rem)]"
                            }`}
                          >
                            {digit}
                          </div>
                          <div
                            className={`${ubuntuSans.className} flip-card-top pointer-events-none absolute inset-x-0 top-0 z-20 flex h-1/2 items-end justify-center overflow-hidden rounded-t-xl border-b border-slate-300 bg-gradient-to-b from-white to-slate-200 font-bold leading-none tracking-tight text-slate-950 shadow-lg ${
                              showHours
                                ? "text-[clamp(3.5rem,10cqw,6rem)]"
                                : "text-[clamp(4rem,14cqw,8rem)]"
                            }`}
                          >
                            <span className="translate-y-1/2">{digit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label={isRunning ? "Pause" : "Play"}
                onClick={() => {
                  if (activeTab === "Stopwatch" || timeLeft > 0) {
                    setIsRunning((currentState) => !currentState);
                  }
                }}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm transition-all hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              >
                {isRunning ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="h-6 w-6 fill-current" />
                )}
              </button>

              <button
                type="button"
                aria-label="Pause"
                onClick={() => setIsRunning(false)}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100"
              >
                <Pause className="h-6 w-6 fill-current" />
              </button>

              <button
                type="button"
                aria-label="Reset"
                onClick={() => {
                  focusSessionSaveLockRef.current = false;
                  setTimeLeft(activeTab === "Stopwatch" ? 0 : initialTime);
                  setIsRunning(false);
                }}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100"
              >
                <RotateCcw className="h-6 w-6" />
              </button>
            </div>
          </div>

          {activeTab === "Countdown" && (
            <aside className="order-1 w-fit max-w-full self-start justify-self-center rounded-2xl border border-slate-200 bg-slate-50 p-3 xl:col-span-4">
              <div className="mb-3 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                  Set Countdown
                </p>
              </div>

              <div className="grid grid-cols-[auto_auto_auto] items-start gap-0">
                <div className="flex flex-col items-center">
                  <p className="mb-1.5 text-center text-xs font-medium text-slate-500">
                    Hours
                  </p>
                  <div className="h-24 w-10 overflow-y-auto rounded-xl bg-white p-1 shadow-inner [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="space-y-1">
                      {countdownHours.map((hour) => {
                        const isSelected = countdownHour === hour;

                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() =>
                              handleSetCountdownDuration(hour, countdownMinute)
                            }
                            className={`h-7 w-full cursor-pointer rounded-lg text-center text-sm font-medium transition-colors ${
                              isSelected
                                ? "text-emerald-700"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            {String(hour).padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-0 pt-14 text-lg font-medium text-slate-600">
                  :
                </div>

                <div className="flex flex-col items-center">
                  <p className="mb-1.5 text-center text-xs font-medium text-slate-500">
                    Minutes
                  </p>
                  <div className="h-24 w-10 overflow-y-auto rounded-xl bg-white p-1 shadow-inner [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="space-y-1">
                      {countdownMinutes.map((minute) => {
                        const isSelected = countdownMinute === minute;

                        return (
                          <button
                            key={minute}
                            type="button"
                            onClick={() =>
                              handleSetCountdownDuration(countdownHour, minute)
                            }
                            className={`h-7 w-full cursor-pointer rounded-lg text-center text-sm font-medium transition-colors ${
                              isSelected
                                ? "text-emerald-700"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            {String(minute).padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
