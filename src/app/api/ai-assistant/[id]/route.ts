import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, AuthError } from "@/lib/auth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request);
    const resolvedParams = await params;

    if (!resolvedParams.id) {
      return NextResponse.json(
        { error: "Conversation ID is required." },
        { status: 400 },
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: resolvedParams.id,
        conversation: {
          userId,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Failed to fetch AI assistant messages:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching messages." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request);
    const resolvedParams = await params;

    if (!resolvedParams.id) {
      return NextResponse.json(
        { error: "Conversation ID is required." },
        { status: 400 },
      );
    }

    await prisma.conversation.deleteMany({
      where: {
        id: resolvedParams.id,
        userId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Failed to delete AI assistant conversation:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting the conversation." },
      { status: 500 },
    );
  }
}
