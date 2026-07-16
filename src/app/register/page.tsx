"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers3,
  LockKeyhole,
  Mail,
  Route,
  TrendingUp,
  UserPlus,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  AuthField,
  AuthShell,
  AuthSubmitButton,
} from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

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

      toast.success(
        data.success || "Verification code sent! Please check your inbox.",
      );
      sessionStorage.setItem(
        "studyflow:verification-expires-at",
        data.verificationExpiresAt ??
          new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      );
      router.push("/auth/new-verification");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred during registration.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      icon={UserPlus}
      eyebrow="Create account"
      title="Start your workspace"
      description="One account for focused plans, active practice, and visible progress."
      visual={{
        eyebrow: "Built for focused learning",
        title: "Shape a study system that grows with you.",
        description:
          "Bring planning, practice, and AI guidance into one workspace designed to make daily progress easier to see.",
        highlights: [
          {
            icon: Route,
            title: "Plan with direction",
            description: "Turn your goals into clear, manageable study steps.",
            tone: "indigo",
          },
          {
            icon: Layers3,
            title: "Practice with context",
            description: "Keep flashcards, quizzes, and notes connected.",
            tone: "teal",
          },
          {
            icon: TrendingUp,
            title: "See progress clearly",
            description: "Follow your consistency and improve with each session.",
            tone: "amber",
          },
        ],
      }}
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="auth-footer-link inline-block origin-left font-semibold underline decoration-transparent underline-offset-4 transition-all duration-500 ease-out hover:scale-[1.08] hover:decoration-[#0a9f43] focus:outline-none focus:ring-2 focus:ring-[#0a9f43]/20"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="stagger space-y-5">
        <AuthField
          id="name"
          label="Full name"
          type="text"
          icon={UserRound}
          value={name}
          onChange={setName}
          placeholder="Your full name"
          autoComplete="name"
          autoFocus
          required
        />
        <AuthField
          id="email"
          label="Email address"
          type="email"
          icon={Mail}
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          icon={LockKeyhole}
          value={password}
          onChange={setPassword}
          placeholder="Create a secure password"
          autoComplete="new-password"
          minLength={6}
          required
        />
        <AuthSubmitButton
          label="Create account"
          loadingLabel="Creating account..."
          isLoading={isLoading}
        />
      </form>
    </AuthShell>
  );
}
