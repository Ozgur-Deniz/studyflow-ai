"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Fingerprint,
  LockKeyhole,
  Mail,
  PenLine,
  ShieldCheck,
  Sparkles,
  UserRound,
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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "An error occurred during registration.",
        );
      }

      router.push("/login");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during registration.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[30rem] animate-slide-up">
            <Link href="/" className="mb-10 inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-white shadow-soft">
                <BrainCircuit className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black">StudyFlow AI</span>
                <span className="block text-xs font-semibold text-muted">
                  Build your study workspace
                </span>
              </span>
            </Link>

            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5 text-xs font-bold text-muted shadow-soft-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Start with a calm plan
              </div>
              <h1 className="max-w-md text-4xl font-black tracking-tight text-foreground">
                Create your premium study command center.
              </h1>
              <p className="mt-3 text-[15px] font-medium leading-6 text-muted">
                StudyFlow keeps your planning, practice, and AI guidance in one
                secure workspace.
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
                id="name"
                label="Full name"
                type="text"
                icon={UserRound}
                value={name}
                onChange={setName}
                placeholder="John Doe"
              />
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
                placeholder="Create a strong password"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-primary px-5 text-sm font-black text-white shadow-glow transition-all duration-300 hover:scale-[1.015] hover:bg-primary-hover hover:shadow-soft-lg focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.28),transparent)] transition-transform duration-700 group-hover:translate-x-[120%]" />
                <span className="relative flex items-center gap-2">
                  {isLoading ? "Creating account..." : "Create account"}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </span>
              </button>
            </form>

            <div className="mt-7 flex items-center justify-between rounded-2xl border border-border bg-white/60 px-4 py-3 text-sm font-semibold text-muted shadow-soft-sm">
              <span>Already registered?</span>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 font-black text-primary transition hover:text-primary-hover"
              >
                Sign in <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden border-l border-border bg-white p-10 lg:flex">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,24,40,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(16,24,40,0.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="relative z-10 flex w-full flex-col justify-between">
            <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-xs font-black text-muted shadow-soft-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Private by default
            </div>

            <div className="mx-auto w-full max-w-xl animate-fade-in-up rounded-[2rem] border border-border bg-surface/86 p-6 shadow-soft-lg backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">
                    Workspace preview
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    Your first week
                  </h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <PenLine className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Generate a focused study roadmap",
                  "Turn topics into flashcards",
                  "Practice with adaptive quizzes",
                  "Review progress with AI guidance",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4 py-3 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft-sm"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                    <span className="text-sm font-bold text-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-[#101828] p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black">Secure study identity</p>
                    <p className="mt-1 text-xs font-medium text-white/52">
                      Your sessions, plans, and progress stay tied to your
                      private account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mx-auto max-w-md text-center text-sm font-semibold leading-6 text-muted">
              A minimal workspace that feels quiet enough for focus and capable
              enough for repeated daily study.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
