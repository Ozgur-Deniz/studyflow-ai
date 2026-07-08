import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { getAvatarOption } from "@/lib/avatar";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "No active session found." },
        { status: 401 },
      );
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = typeof payload.id === "string" ? payload.id : "";

    if (!userId) {
      return NextResponse.json(
        { message: "Invalid session payload." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User account could not be found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        user: {
          ...user,
          avatarId: getAvatarOption(user.avatarId).id,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Invalid or expired session." },
      { status: 401 },
    );
  }
}
