import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

const CODE_PATTERN = /^\d{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";

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

    if (!password) {
      return NextResponse.json(
        { message: "Password is required." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords do not match." },
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

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.passwordResetToken.deleteMany({
      where: {
        email,
      },
    });

    return NextResponse.json({
      success: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { message: "A server-side error occurred." },
      { status: 500 },
    );
  }
}
