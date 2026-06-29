import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

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

    return NextResponse.json({ user: payload }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid or expired session." },
      { status: 401 },
    );
  }
}
