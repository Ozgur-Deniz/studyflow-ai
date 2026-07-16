"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck2,
  LockKeyhole,
  LogIn,
  Mail,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  AuthField,
  AuthShell,
  AuthSubmitButton,
} from "@/components/auth/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok || data.status >= 400) {
        throw new Error(data.message || "Login failed.");
      }

      toast.success("Signed in successfully.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      icon={LogIn}
      eyebrow="Account access"
      title="Welcome back"
      description="Your plans, practice sessions, and progress are waiting for you."
      visual={{
        eyebrow: "Your learning workspace",
        title: "Return to your rhythm without losing momentum.",
        description:
          "Everything you were working on stays organized in one clear view, ready for the next focused session.",
        highlights: [
          {
            icon: CalendarCheck2,
            title: "Plans stay organized",
            description: "Continue every active roadmap from where you paused.",
            tone: "indigo",
          },
          {
            icon: TimerReset,
            title: "Focus keeps its momentum",
            description: "Return to recent sessions without rebuilding context.",
            tone: "teal",
          },
          {
            icon: Sparkles,
            title: "AI remembers the context",
            description: "Your study history is ready for smarter guidance.",
            tone: "amber",
          },
        ],
      }}
      footer={
        <>
          New to StudyFlow?{" "}
          <Link
            href="/register"
            className="auth-footer-link inline-block origin-left font-semibold underline decoration-transparent underline-offset-4 transition-all duration-500 ease-out hover:scale-[1.08] hover:decoration-[#0a9f43] focus:outline-none focus:ring-2 focus:ring-[#0a9f43]/20"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="stagger space-y-5">
        <AuthField
          id="email"
          label="Email address"
          type="email"
          icon={Mail}
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          required
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          icon={LockKeyhole}
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
        <AuthSubmitButton
          label="Sign in"
          loadingLabel="Signing in..."
          isLoading={isLoading}
        />
      </form>
    </AuthShell>
  );
}
