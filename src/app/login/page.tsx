"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Sparkles, BookOpen, BarChart3, XCircle } from "lucide-react";
import { AuthBrandingPanel } from "../../components/auth/AuthBrandingPanel";
import { InputField } from "../../components/ui/InputField";
import { GradientButton } from "../../components/ui/GradientButton";
import { Logo } from "../../components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
        throw new Error(data.message || "Login Failed");
      }
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <AuthBrandingPanel
        title={
          <>
            Study Smarter,
            <br />
            <span className="text-white/80">Not Harder</span>
          </>
        }
        description="Let AI create personalized study plans, track your progress, and optimize your entire learning journey."
        gradient="indigo"
        features={[
          {
            icon: Sparkles,
            label: "AI-Powered Learning",
            desc: "Smart recommendations",
          },
          {
            icon: BookOpen,
            label: "Adaptive Study Plans",
            desc: "Personalized for you",
          },
          {
            icon: BarChart3,
            label: "Progress Analytics",
            desc: "Track every milestone",
          },
        ]}
      />

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-[420px] animate-slide-in-right">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10">
            <Logo size="sm" />
          </div>

          <h2 className="text-[28px] font-extrabold text-[#0f172a] mb-1.5 tracking-tight">
            Welcome back 👋
          </h2>
          <p className="text-[15px] text-[#64748b] mb-8 font-medium">
            Sign in to continue your learning journey
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] rounded-xl text-[13px] font-semibold flex items-center gap-2.5 animate-scale-in">
              <XCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              id="email"
              label="Email Address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              focusColor="indigo"
            />

            <InputField
              id="password"
              label="Password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              focusColor="indigo"
            />

            <GradientButton
              type="submit"
              isLoading={isLoading}
              loadingText="Signing in..."
              gradient="indigo"
            >
              Sign in
            </GradientButton>
          </form>

          {/* Divider */}
          <div className="flex items-center my-7">
            <div className="flex-1 h-px bg-[#e2e8f0]" />
            <span className="px-4 text-[12px] text-[#94a3b8] font-medium">
              or
            </span>
            <div className="flex-1 h-px bg-[#e2e8f0]" />
          </div>

          <p className="text-center text-[14px] text-[#64748b] font-medium">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#6366f1] hover:text-[#4f46e5] font-bold transition-colors inline-flex items-center gap-1 group"
            >
              Create account
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:translate-x-1 transition-transform duration-300"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
