"use client";

import {
  useState,
  type HTMLInputTypeAttribute,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/ui/Logo";

interface AuthShellProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  visual?: {
    eyebrow: string;
    title: string;
    description: string;
    highlights: Array<{
      icon: LucideIcon;
      title: string;
      description: string;
      tone: "indigo" | "teal" | "amber";
    }>;
  };
}

interface AuthFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "type" | "value"
  > {
  id: string;
  label: string;
  type: HTMLInputTypeAttribute;
  value: string;
  icon: LucideIcon;
  onChange: (value: string) => void;
  error?: string;
}

interface AuthSubmitButtonProps {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
}

export function AuthShell({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  footer,
  visual,
}: AuthShellProps) {
  const toneClasses = {
    indigo: {
      icon: "bg-[#ecfdf3] text-[#0a9f43] ring-[#bbf7d0]",
      line: "from-[#0a9f43] to-[#4ade80]",
    },
    teal: {
      icon: "bg-[#e8fbf7] text-[#0f9f91] ring-[#c9f2ea]",
      line: "from-[#14b8a6] to-[#22c55e]",
    },
    amber: {
      icon: "bg-[#fff7e6] text-[#d97706] ring-[#fde7b2]",
      line: "from-[#f59e0b] to-[#f97316]",
    },
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f7fa] px-4 py-6 text-[#0f172a] sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(10,159,67,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(10,159,67,0.045)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#0a9f43] via-[#4ade80] to-[#14b8a6]"
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col sm:min-h-[calc(100vh-4rem)]">
        <header className="animate-fade-in">
          <Link
            href="/"
            aria-label="Go to StudyFlow AI"
            className="inline-flex rounded-xl focus:outline-none focus:ring-4 focus:ring-[#0a9f43]/15"
          >
            <Logo size="sm" />
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-6 sm:py-10">
          <div
            className={`grid w-full items-center ${
              visual
                ? "max-w-[68rem] gap-10 lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-16"
                : "max-w-[28rem]"
            }`}
          >
            {visual && (
              <aside className="relative hidden min-w-0 lg:block">
                <div
                  aria-hidden="true"
                  className="absolute -left-8 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#cbd5e1] to-transparent"
                />

                <div className="animate-fade-in-up">
                  <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0a9f43]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0a9f43] shadow-[0_0_0_5px_rgba(10,159,67,0.1)]" />
                    {visual.eyebrow}
                  </div>
                  <h2 className="mt-4 max-w-xl text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-[#0f172a]">
                    {visual.title}
                  </h2>
                  <p className="mt-5 max-w-lg text-[15px] font-medium leading-7 text-[#64748b]">
                    {visual.description}
                  </p>
                </div>

                <div className="mt-9 space-y-1">
                  {visual.highlights.map((highlight, index) => {
                    const HighlightIcon = highlight.icon;
                    const tone = toneClasses[highlight.tone];

                    return (
                      <div
                        key={highlight.title}
                        className="group relative flex animate-fade-in-up items-center gap-4 border-b border-[#e2e8f0] py-4 last:border-b-0"
                        style={{ animationDelay: `${120 + index * 90}ms` }}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-soft-sm ${tone.icon}`}
                        >
                          <HighlightIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#1e293b]">
                            {highlight.title}
                          </p>
                          <p className="mt-1 text-[13px] font-medium leading-5 text-[#64748b]">
                            {highlight.description}
                          </p>
                        </div>
                        <span
                          aria-hidden="true"
                          className={`h-8 w-1 rounded-full bg-gradient-to-b opacity-0 transition-all duration-300 group-hover:opacity-100 ${tone.line}`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div
                  className="mt-8 flex animate-fade-in items-center gap-3 text-xs font-semibold text-[#64748b]"
                  style={{ animationDelay: "460ms" }}
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  Your private workspace stays synced and ready.
                </div>
              </aside>
            )}

            <div className="mx-auto w-full max-w-md">
              <div className="animate-fade-in-up text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#bbf7d0] bg-[#ecfdf3] text-[#087b36] shadow-soft-sm">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0a9f43]">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f172a] sm:text-3xl">
                {title}
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-[#64748b]">
                {description}
              </p>
            </div>

            {visual && (
              <div className="mt-6 grid grid-cols-3 gap-2 lg:hidden">
                {visual.highlights.map((highlight, index) => {
                  const HighlightIcon = highlight.icon;
                  const tone = toneClasses[highlight.tone];

                  return (
                    <div
                      key={highlight.title}
                      className="animate-fade-in-up text-center"
                      style={{ animationDelay: `${80 + index * 70}ms` }}
                    >
                      <div
                        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${tone.icon}`}
                      >
                        <HighlightIcon
                          className="h-[18px] w-[18px]"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-2 text-[11px] font-semibold leading-4 text-[#475569]">
                        {highlight.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              className="relative mx-auto mt-7 w-full max-w-md animate-fade-in-up overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-soft sm:p-7"
              style={{ animationDelay: "140ms" }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#0a9f43] via-[#14b8a6] to-[#f59e0b]"
              />
              {children}
            </div>

            <div
              className="mt-5 animate-fade-in text-center text-sm font-medium text-[#64748b]"
              style={{ animationDelay: "240ms" }}
            >
              {footer}
            </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function AuthField({
  id,
  label,
  type,
  value,
  icon: Icon,
  onChange,
  error,
  ...inputProps
}: AuthFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && isPasswordVisible ? "text" : type;
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[13px] font-semibold text-[#334155]"
      >
        {label}
      </label>
      <div className="group relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94a3b8] transition-colors duration-200 group-focus-within:text-[#087b36]"
          aria-hidden="true"
        />
        <input
          {...inputProps}
          id={id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-12 w-full rounded-xl border bg-[#f8fafc] py-3 pl-10 text-sm font-medium text-[#0f172a] outline-none transition-all duration-200 placeholder:text-[#94a3b8] focus:bg-white ${
            error
              ? "border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/15"
              : "border-[#e2e8f0] focus:ring-2 focus:ring-[#0a9f43]/15"
          } ${
            isPassword ? "pr-12" : "pr-3.5"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((current) => !current)}
            aria-label={
              isPasswordVisible ? "Hide password" : "Show password"
            }
            title={isPasswordVisible ? "Hide password" : "Show password"}
            className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[#94a3b8] transition hover:bg-[#eef2f7] hover:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#0a9f43]/20"
          >
            {isPasswordVisible ? (
              <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-[12px] font-medium text-[#dc2626]">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthSubmitButton({
  label,
  loadingLabel,
  isLoading,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="group animate-shimmer flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#0a9f43] via-[#22c55e] to-[#4ade80] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-200/70 focus:outline-none focus:ring-4 focus:ring-[#0a9f43]/15 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-65"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {loadingLabel}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {label}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      )}
    </button>
  );
}
