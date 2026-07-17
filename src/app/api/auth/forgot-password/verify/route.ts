import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const CODE_PATTERN = /^\d{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (!CODE_PATTERN.test(token)) {
      return NextResponse.json(
        { message: "Please enter the complete 6-digit code." },
        { status: 400 },
      );
    }

    const existingToken = await prisma.passwordResetToken.findFirst({
      where: {
        email,
        token,
      },
    });

    if (!existingToken) {
      return NextResponse.json(
        { message: "Invalid password reset code." },
        { status: 400 },
      );
    }

    if (new Date(existingToken.expires) < new Date()) {
      await prisma.passwordResetToken.delete({
        where: {
          id: existingToken.id,
        },
      });

      return NextResponse.json(
        { message: "Password reset code has expired." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: "Password reset code verified.",
    });
  } catch (error) {
    console.error("Password reset verification error:", error);
    return NextResponse.json(
      { message: "A server-side error occurred." },
      { status: 500 },
    );
  }
}
