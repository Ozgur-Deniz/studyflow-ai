import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/tokens";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { message: "Email address is required." },
        { status: 400 },
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const passwordResetToken = await generatePasswordResetToken(email);
      await sendPasswordResetEmail(email, passwordResetToken.token);
    }

    return NextResponse.json({
      success:
        "If an account exists for this email, a password reset code has been sent.",
      verificationExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "A server-side error occurred." },
      { status: 500 },
    );
  }
}
