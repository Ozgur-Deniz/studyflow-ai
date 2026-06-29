import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

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

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        message: "User successfully created!",
        user: { id: newUser.id, email: newUser.email },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error: ", error);
    return NextResponse.json(
      { message: "A server-side error occurred." },
      { status: 500 },
    );
  }
}
