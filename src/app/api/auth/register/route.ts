import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "@/lib/mail";
import { generateVerificationToken } from "@/lib/tokens";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { message: "Please fill in all fields." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "This email address is already in use." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(email, verificationToken.token);

    return NextResponse.json(
      {
        success: "Verification code sent! Please check your inbox.",
        verificationExpiresAt: verificationToken.expires.toISOString(),
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
