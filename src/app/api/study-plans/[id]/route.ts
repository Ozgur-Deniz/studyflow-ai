import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, AuthError } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request);

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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

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
    const userId = await getUserIdFromRequest(request);

    const resolvedParams = await params;
    const planId = resolvedParams.id;
    let nextIsCompleted = true;

    try {
      const body = (await request.json()) as { isCompleted?: unknown };

      if (typeof body.isCompleted === "boolean") {
        nextIsCompleted = body.isCompleted;
      }
    } catch {
      nextIsCompleted = true;
    }

    const updatedPlan = await prisma.studyPlan.update({
      where: {
        id: planId,
        userId: userId,
      },
      data: {
        isCompleted: nextIsCompleted,
      },
    });

    console.log(
      `[Plan Detail API] Plan "${updatedPlan.title}" status updated to ${
        updatedPlan.isCompleted ? "completed" : "in progress"
      }.`,
    );
    return NextResponse.json(
      { success: true, plan: updatedPlan },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("[Plan Detail API] Error updating plan status:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the plan." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request);

    const resolvedParams = await params;
    const planId = resolvedParams.id;

    const plan = await prisma.studyPlan.findFirst({
      where: {
        id: planId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ message: "Plan not found." }, { status: 404 });
    }

    await prisma.studyPlan.delete({
      where: {
        id: planId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[Plan Detail API] Error deleting plan:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting the plan." },
      { status: 500 },
    );
  }
}
