import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const resolvedParams = await params;

    if (!resolvedParams.id) {
      return Response.json(
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

    return Response.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch AI assistant messages:", error);

    return Response.json(
      { error: "An unexpected error occurred while fetching messages." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const resolvedParams = await params;

    if (!resolvedParams.id) {
      return Response.json(
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

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete AI assistant conversation:", error);

    return Response.json(
      { error: "An unexpected error occurred while deleting the conversation." },
      { status: 500 },
    );
  }
}
