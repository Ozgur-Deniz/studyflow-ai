import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const resolvedParams = await params;
    const planId = resolvedParams.id;

    const plan = await prisma.studyPlan.findFirst({
      where: {
        id: planId,
        userId: userId,
      },
    });

    if (!plan) {
      return NextResponse.json({ message: "Plan not found." }, { status: 404 });
    }

    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    console.error("[Plan Detail API] Error fetching plan detail:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching plan details." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const resolvedParams = await params;
    const planId = resolvedParams.id;

    const updatedPlan = await prisma.studyPlan.update({
      where: {
        id: planId,
        userId: userId,
      },
      data: {
        isCompleted: true,
      },
    });

    console.log(
      `[Plan Detail API] Plan "${updatedPlan.title}" marked as completed.`,
    );
    return NextResponse.json(
      { success: true, plan: updatedPlan },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Plan Detail API] Error updating plan status:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the plan." },
      { status: 500 },
    );
  }
}
