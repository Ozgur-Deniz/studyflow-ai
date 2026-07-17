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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MISMATCH_ERROR = "Passwords do not match.";

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

async function readApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return {
    message: response.ok
      ? "Request completed."
      : "Registration request failed. Please try again.",
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const nextErrors: RegisterErrors = {};
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName) {
      nextErrors.name = "Full name is required.";
    }

    if (!normalizedEmail) {
      nextErrors.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (password && password !== confirmPassword) {
      nextErrors.confirmPassword = PASSWORD_MISMATCH_ERROR;
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = await readApiResponse(response);

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
      <form onSubmit={handleSubmit} className="stagger space-y-5" noValidate>
        <AuthField
          id="name"
          label="Full name"
          type="text"
          icon={UserRound}
          value={name}
          onChange={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          placeholder="Your full name"
          autoComplete="name"
          error={errors.name}
          autoFocus
          required
        />
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
            setErrors((current) => ({
              ...current,
              password: undefined,
              confirmPassword:
                current.confirmPassword === PASSWORD_MISMATCH_ERROR
                  ? undefined
                  : current.confirmPassword,
            }));
          }}
          placeholder="Create a secure password"
          autoComplete="new-password"
          minLength={6}
          error={errors.password}
          required
        />
        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          icon={LockKeyhole}
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            setErrors((current) => ({
              ...current,
              confirmPassword: undefined,
            }));
          }}
          placeholder="Enter your password again"
          autoComplete="new-password"
          error={errors.confirmPassword}
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
