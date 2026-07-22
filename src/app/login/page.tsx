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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const nextErrors: LoginErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
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
      <form onSubmit={handleSubmit} className="stagger space-y-5" noValidate>
        <AuthField
          id="email"
          label="Email address"
          type="email"
          icon={Mail}
          value={email}
          onChange={(value) => {
            setEmail(value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
          autoFocus
          required
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          icon={LockKeyhole}
          value={password}
          onChange={(value) => {
            setPassword(value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password}
          required
        />
        <div className="-mt-2 text-right text-sm">
          <Link
            href="/forgot-password"
            className="inline-flex cursor-pointer rounded-lg px-2 py-2 font-semibold text-[#087b36] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ecfdf3] hover:text-[#054f25] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0a9f43]/20"
          >
            Forgot password?
          </Link>
        </div>
        <AuthSubmitButton
          label="Sign in"
          loadingLabel="Signing in..."
          isLoading={isLoading}
        />
      </form>
    </AuthShell>
  );
}
