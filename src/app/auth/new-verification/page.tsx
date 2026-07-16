"use client";

import {
  FormEvent,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";

import { newVerification } from "@/actions/new-verification";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerificationCountdown } from "@/components/auth/VerificationCountdown";

const CODE_LENGTH = 6;
const VERIFICATION_EXPIRES_KEY = "studyflow:verification-expires-at";

function getStoredVerificationExpiresAt() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    sessionStorage.getItem(VERIFICATION_EXPIRES_KEY) ??
    new Date(Date.now() + 60 * 60 * 1000).toISOString()
  );
}

export default function NewVerificationPage() {
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: CODE_LENGTH }, () => ""),
  );
  const [isVerified, setIsVerified] = useState(false);
  const [expiresAt] = useState<string | null>(() =>
    getStoredVerificationExpiresAt(),
  );
  const [isExpired, setIsExpired] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const updateDigit = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const digit = event.target.value.replace(/\D/g, "").slice(-1);

    setDigits((current) =>
      current.map((currentDigit, digitIndex) =>
        digitIndex === index ? digit : currentDigit,
      ),
    );

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pastedCode = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);

    if (!pastedCode) {
      return;
    }

    setDigits(
      Array.from(
        { length: CODE_LENGTH },
        (_, index) => pastedCode[index] ?? "",
      ),
    );
    inputRefs.current[Math.min(pastedCode.length, CODE_LENGTH) - 1]?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const verificationCode = digits.join("");

    if (isExpired) {
      toast.error("Verification code has expired. Please create a new code.");
      return;
    }

    if (verificationCode.length !== CODE_LENGTH) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }

    startTransition(() => {
      newVerification(verificationCode)
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
            return;
          }

          setIsVerified(true);
          sessionStorage.removeItem(VERIFICATION_EXPIRES_KEY);
          toast.success(data.success || "Email verified successfully.");
        })
        .catch(() => {
          toast.error("Something went wrong. Please try again.");
        });
    });
  };

  return (
    <AuthShell
      icon={ShieldCheck}
      eyebrow="Email verification"
      title={isVerified ? "Email verified" : "Enter your code"}
      description={
        isVerified
          ? "Your account is ready. You can now sign in to your workspace."
          : "Enter the 6-digit code sent to your email address. The code expires in one hour."
      }
      footer={
        <Link
          href="/login"
          className="font-semibold text-[#087b36] transition hover:text-[#06652d]"
        >
          Back to sign in
        </Link>
      }
    >
      {isVerified ? (
        <div className="animate-scale-in py-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-medium leading-6 text-[#64748b]">
            Verification completed successfully.
          </p>
          <Link
            href="/login"
            className="group mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0a9f43] via-[#22c55e] to-[#4ade80] px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-200/70 focus:outline-none focus:ring-4 focus:ring-[#0a9f43]/15"
          >
            Continue to sign in
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <VerificationCountdown
            expiresAt={expiresAt}
            onExpire={() => setIsExpired(true)}
          />

          <div
            onPaste={handlePaste}
            className="stagger mt-5 grid grid-cols-6 gap-2 sm:gap-3"
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                value={digit}
                onChange={(event) => updateDigit(index, event)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                autoFocus={index === 0}
                disabled={isPending || isExpired}
                aria-label={`Verification code digit ${index + 1}`}
                className="h-14 min-w-0 rounded-xl border border-[#dbe2ea] bg-[#f8fafc] text-center text-xl font-semibold text-[#0f172a] outline-none transition-all duration-200 focus:-translate-y-0.5 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isPending || isExpired}
            className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#0a9f43] to-[#4ade80] px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-200/70 focus:outline-none focus:ring-4 focus:ring-[#0a9f43]/15 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-65"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Verifying...
              </span>
            ) : isExpired ? (
              "Code expired"
            ) : (
              "Verify email"
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
