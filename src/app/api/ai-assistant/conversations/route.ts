import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Response.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch AI assistant conversations:", error);

    return Response.json(
      { error: "An unexpected error occurred while fetching conversations." },
      { status: 500 },
    );
  }
}
