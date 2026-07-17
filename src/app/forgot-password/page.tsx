"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  KeyRound,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  AuthField,
  AuthShell,
  AuthSubmitButton,
} from "@/components/auth/AuthShell";
import { VerificationCountdown } from "@/components/auth/VerificationCountdown";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = /^\d{6}$/;
const PASSWORD_MISMATCH_ERROR = "Passwords do not match.";
const PASSWORD_RESET_EXPIRES_KEY = "studyflow:password-reset-expires-at";

type ResetStep = "email" | "code" | "password";

type ForgotPasswordErrors = {
  email?: string;
  code?: string;
  password?: string;
  confirmPassword?: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = () => {
    const nextErrors: ForgotPasswordErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateCode = () => {
    const nextErrors: ForgotPasswordErrors = {};

    if (isExpired) {
      nextErrors.code = "Password reset code has expired.";
    } else if (!code) {
      nextErrors.code = "Password reset code is required.";
    } else if (!CODE_PATTERN.test(code)) {
      nextErrors.code = "Please enter the complete 6-digit code.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePassword = () => {
    const nextErrors: ForgotPasswordErrors = {};

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

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset request failed.");
      }

      const nextExpiresAt =
        data.verificationExpiresAt ??
        new Date(Date.now() + 60 * 60 * 1000).toISOString();

      sessionStorage.setItem(PASSWORD_RESET_EXPIRES_KEY, nextExpiresAt);
      setExpiresAt(nextExpiresAt);
      setIsExpired(false);
      setStep("code");
      toast.success(data.success || "Password reset code sent.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Password reset request failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateCode()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), token: code }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset code verification failed.");
      }

      setErrors({});
      setStep("password");
      toast.success(data.success || "Password reset code verified.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Password reset code verification failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          token: code,
          password,
          confirmPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed.");
      }

      sessionStorage.removeItem(PASSWORD_RESET_EXPIRES_KEY);
      toast.success(data.success || "Password changed successfully.");
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Password reset failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      icon={KeyRound}
      eyebrow="Password recovery"
      title={
        step === "email"
          ? "Reset your password"
          : step === "code"
            ? "Enter your code"
            : "Create new password"
      }
      description={
        step === "email"
          ? "Enter your account email and we will send you a password reset code."
          : step === "code"
            ? "Enter the 6-digit code sent to your email address."
            : "Choose a new password and confirm it to finish the reset."
      }
      visual={{
        eyebrow: "Secure account recovery",
        title: "Get back to your workspace with a verified reset code.",
        description:
          "Password recovery stays tied to your email, then verifies the code before allowing a new password.",
        highlights: [
          {
            icon: Mail,
            title: "Email code",
            description: "A short-lived code is sent to your account email.",
            tone: "indigo",
          },
          {
            icon: ShieldCheck,
            title: "Code check",
            description: "The reset can continue only after code verification.",
            tone: "teal",
          },
          {
            icon: Sparkles,
            title: "Fresh password",
            description: "Confirm the new password before returning to sign in.",
            tone: "amber",
          },
        ],
      }}
      footer={
        <Link
          href="/login"
          className="auth-footer-link inline-block origin-left font-semibold underline decoration-transparent underline-offset-4 transition-all duration-500 ease-out hover:scale-[1.08] hover:decoration-[#0a9f43] focus:outline-none focus:ring-2 focus:ring-[#0a9f43]/20"
        >
          Back to sign in
        </Link>
      }
    >
      {step === "email" && (
        <form
          onSubmit={handleEmailSubmit}
          className="stagger space-y-5"
          noValidate
        >
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
          <AuthSubmitButton
            label="Send reset code"
            loadingLabel="Sending code..."
            isLoading={isLoading}
          />
        </form>
      )}

      {step === "code" && (
        <form
          onSubmit={handleCodeSubmit}
          className="stagger space-y-5"
          noValidate
        >
          <VerificationCountdown
            expiresAt={expiresAt}
            onExpire={() => setIsExpired(true)}
          />
          <AuthField
            id="code"
            label="Reset code"
            type="text"
            icon={BrainCircuit}
            value={code}
            onChange={(value) => {
              setCode(value.replace(/\D/g, "").slice(0, 6));
              setErrors((current) => ({ ...current, code: undefined }));
            }}
            placeholder="Enter 6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            error={errors.code}
            autoFocus
            required
          />
          <AuthSubmitButton
            label="Verify code"
            loadingLabel="Verifying code..."
            isLoading={isLoading}
          />
        </form>
      )}

      {step === "password" && (
        <form
          onSubmit={handlePasswordSubmit}
          className="stagger space-y-5"
          noValidate
        >
          <AuthField
            id="password"
            label="New password"
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
            placeholder="Create a new password"
            autoComplete="new-password"
            minLength={6}
            error={errors.password}
            autoFocus
            required
          />
          <AuthField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            icon={RefreshCw}
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              setErrors((current) => ({
                ...current,
                confirmPassword: undefined,
              }));
            }}
            placeholder="Enter your new password again"
            autoComplete="new-password"
            error={errors.confirmPassword}
            required
          />
          <AuthSubmitButton
            label="Change password"
            loadingLabel="Changing password..."
            isLoading={isLoading}
          />
        </form>
      )}
    </AuthShell>
  );
}
