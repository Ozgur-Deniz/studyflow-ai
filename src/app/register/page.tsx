"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Shield, Globe, Users, XCircle } from "lucide-react";
import { AuthBrandingPanel } from "../../components/auth/AuthBrandingPanel";
import { InputField } from "../../components/ui/InputField";
import { GradientButton } from "../../components/ui/GradientButton";
import { Logo } from "../../components/ui/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("api/auth/register", {
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <AuthBrandingPanel
        title={
          <>
            Begin Your
            <br />
            <span className="text-white/80">Learning Journey</span>
          </>
        }
        description="Join thousands of students using AI to achieve their academic goals faster and more effectively."
        gradient="purple"
        features={[
          {
            icon: Users,
            label: "10K+ Students",
            desc: "Active community",
          },
          {
            icon: Shield,
            label: "100% Secure",
            desc: "Your data is safe",
          },
          {
            icon: Globe,
            label: "Available Everywhere",
            desc: "Study from any device",
          },
        ]}
      />

      {/* Right Panel — Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-[420px] animate-slide-in-right">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10">
            <Logo size="sm" />
          </div>

          <h2 className="text-[28px] font-extrabold text-[#0f172a] mb-1.5 tracking-tight">
            Create your account ✨
          </h2>
          <p className="text-[15px] text-[#64748b] mb-8 font-medium">
            Get started with your personalized study experience
          </p>

          {/* Error Message */}
          {!!error && (
            <div className="mb-5 p-4 bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] rounded-xl text-[13px] font-semibold flex items-center gap-2.5 animate-scale-in">
              <XCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              id="name"
              label="Full Name"
              type="text"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              focusColor="purple"
            />

            <InputField
              id="email"
              label="Email Address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              focusColor="purple"
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
              focusColor="purple"
            />

            <GradientButton
              type="submit"
              isLoading={isLoading}
              loadingText="Creating account..."
              gradient="purple"
            >
              Create account
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
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#8b5cf6] hover:text-[#7c3aed] font-bold transition-colors inline-flex items-center gap-1 group"
            >
              Sign in
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
