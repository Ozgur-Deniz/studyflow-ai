import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "@/lib/mail";
import { generatePendingRegistration } from "@/lib/tokens";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim() : "";
    const normalizedPassword = typeof password === "string" ? password : "";

    if (!normalizedEmail || !normalizedName || !normalizedPassword) {
      return NextResponse.json(
        { message: "Please fill in all fields." },
        { status: 400 },
      );
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (normalizedPassword.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "This email address is already in use." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    const pendingRegistration = await generatePendingRegistration({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    try {
      await sendVerificationEmail(normalizedEmail, pendingRegistration.token);
    } catch (error) {
      await prisma.pendingRegistration.delete({
        where: {
          id: pendingRegistration.id,
        },
      });

      throw error;
    }

    return NextResponse.json(
      {
        success: "Verification code sent! Please check your inbox.",
        verificationExpiresAt: pendingRegistration.expires.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error: ", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "A server-side error occurred.",
      },
      { status: 500 },
    );
  }
}
