import { NextRequest, NextResponse } from "next/server";
import { AuthError, getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardFixedXp } from "@/lib/xp";

type FlashcardActivity = "FLASHCARD_REVIEWED" | "FLASHCARD_DECK_COMPLETED";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = (await request.json()) as {
      actionType?: unknown;
      deckId?: unknown;
    };

    if (
      body.actionType !== "FLASHCARD_REVIEWED" &&
      body.actionType !== "FLASHCARD_DECK_COMPLETED"
    ) {
      return NextResponse.json(
        { message: "Unsupported flashcard activity." },
        { status: 400 },
      );
    }

    if (typeof body.deckId === "string" && body.deckId.length > 0) {
      const deck = await prisma.flashcardDeck.findFirst({
        where: {
          id: body.deckId,
          userId,
        },
        select: {
          id: true,
        },
      });

      if (!deck) {
        return NextResponse.json({ message: "Deck not found." }, { status: 404 });
      }
    }

    const xp = await awardFixedXp(userId, body.actionType as FlashcardActivity);

    return NextResponse.json({ success: true, xp }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[Flashcard Activity API] Error recording activity:", error);
    return NextResponse.json(
      { message: "An error occurred while recording flashcard activity." },
      { status: 500 },
    );
  }
}
