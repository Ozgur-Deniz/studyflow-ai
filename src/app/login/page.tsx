"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";

interface AuthInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  placeholder: string;
  icon: LucideIcon;
  onChange: (value: string) => void;
}

function AuthInput({
  id,
  label,
  type,
  value,
  placeholder,
  icon: Icon,
  onChange,
}: AuthInputProps) {
  return (
    <label className="group block" htmlFor={id}>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-muted">
        {label}
      </span>
      <span className="relative flex h-14 items-center rounded-2xl border border-border bg-white/80 px-4 shadow-soft-sm transition-all duration-300 group-focus-within:border-primary group-focus-within:bg-white group-focus-within:shadow-glow">
        <Icon className="h-5 w-5 shrink-0 text-subtle transition-colors duration-300 group-focus-within:text-primary" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          className="ml-3 h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] font-semibold text-foreground outline-none placeholder:text-subtle focus:border-transparent focus:shadow-none"
        />
      </span>
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-border bg-[#101828] p-10 text-white lg:flex">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(135deg,rgba(91,92,246,0.38),rgba(20,184,166,0.18),transparent)]" />
          <div className="relative z-10 flex w-full flex-col justify-between">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#101828] shadow-soft">
                <BrainCircuit className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black tracking-tight">
                  StudyFlow AI
                </span>
                <span className="block text-xs font-semibold text-white/50">
                  Focused learning workspace
                </span>
              </span>
            </Link>

            <div className="max-w-xl animate-fade-in-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-bold text-white/70 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-teal-200" />
                Adaptive planning for serious study sessions
              </div>
              <h1 className="max-w-lg text-5xl font-black leading-[0.98] tracking-tight">
                Return to a cleaner way to study.
              </h1>
              <p className="mt-6 max-w-md text-base font-medium leading-7 text-white/62">
                Open your workspace, review active plans, and keep every
                flashcard, quiz, and study session moving in one calm system.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-3">
              {[
                ["Active", "Plans"],
                ["AI", "Assistant"],
                ["Smart", "Practice"],
              ].map(([top, bottom]) => (
                <div
                  key={top}
                  className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/12"
                >
                  <p className="text-lg font-black">{top}</p>
                  <p className="mt-1 text-xs font-bold text-white/48">
                    {bottom}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[29rem] animate-slide-up">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-3 lg:hidden"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-white shadow-soft">
                <BrainCircuit className="h-5 w-5" />
              </span>
              <span className="text-sm font-black">StudyFlow AI</span>
            </Link>

            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5 text-xs font-bold text-muted shadow-soft-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Secure workspace access
              </div>
              <h2 className="text-4xl font-black tracking-tight text-foreground">
                Welcome back
              </h2>
              <p className="mt-3 text-[15px] font-medium leading-6 text-muted">
                Sign in to continue your plans, flashcards, quizzes, and AI
                study sessions.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 animate-scale-in">
                <XCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <AuthInput
                id="email"
                label="Email"
                type="email"
                icon={Mail}
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
              />
              <AuthInput
                id="password"
                label="Password"
                type="password"
                icon={LockKeyhole}
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-foreground px-5 text-sm font-black text-white shadow-soft transition-all duration-300 hover:scale-[1.015] hover:shadow-soft-lg focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.24),transparent)] transition-transform duration-700 group-hover:translate-x-[120%]" />
                <span className="relative flex items-center gap-2">
                  {isLoading ? "Signing in..." : "Sign in"}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </span>
              </button>
            </form>

            <div className="mt-7 flex items-center justify-between rounded-2xl border border-border bg-white/60 px-4 py-3 text-sm font-semibold text-muted shadow-soft-sm">
              <span>New to StudyFlow?</span>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 font-black text-primary transition hover:text-primary-hover"
              >
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs font-bold text-subtle">
              <BookOpenCheck className="h-4 w-4" />
              Your study data stays attached to your private workspace.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
