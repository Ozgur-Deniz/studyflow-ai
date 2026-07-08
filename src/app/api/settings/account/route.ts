import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, getUserIdFromRequest } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    await prisma.user.delete({
      where: { id: userId },
    });

    const response = NextResponse.json(
      { message: "Account deleted successfully." },
      { status: 200 },
    );

    response.cookies.delete("token");

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[Settings Account API] Error deleting account:", error);

    return NextResponse.json(
      { message: "A server-side error occurred." },
      { status: 500 },
    );
  }
}
