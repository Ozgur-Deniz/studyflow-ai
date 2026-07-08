import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { AuthError, getUserIdFromRequest } from "@/lib/auth";
import { getAvatarOption, isAvatarId } from "@/lib/avatar";

interface ProfileRequestBody {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  avatarId?: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
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
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[Settings Profile API] Error loading profile:", error);

    return NextResponse.json(
      { message: "A server-side error occurred." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = (await request.json()) as ProfileRequestBody;
    const firstName =
      typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName =
      typeof body.lastName === "string" ? body.lastName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const avatarId =
      typeof body.avatarId === "string" ? body.avatarId.trim() : "";

    if (!firstName || !email) {
      return NextResponse.json(
        { message: "Please enter your first name and email address." },
        { status: 400 },
      );
    }

    if (!avatarId || !isAvatarId(avatarId)) {
      return NextResponse.json(
        { message: "Please choose a valid avatar." },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: [firstName, lastName].filter(Boolean).join(" "),
        email,
        avatarId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarId: true,
      },
    });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarId: updatedUser.avatarId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(secret);

    const response = NextResponse.json(
      {
        message: "Profile updated successfully.",
        user: updatedUser,
      },
      { status: 200 },
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "This email address is already in use." },
        { status: 409 },
      );
    }

    console.error("[Settings Profile API] Error updating profile:", error);

    return NextResponse.json(
      { message: "A server-side error occurred." },
      { status: 500 },
    );
  }
}
