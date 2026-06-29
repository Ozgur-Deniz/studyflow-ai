import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 },
    );
    response.cookies.delete("token");

    return response;
  } catch (err) {
    return NextResponse.json(
      { message: "An error occurred during logout." },
      { status: 500 },
    );
  }
}
