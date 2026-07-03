import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, AuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    const decks = await prisma.flashcardDeck.findMany({
      where: {
        userId,
      },
      include: {
        flashcards: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedDecks = decks.map((deck) => ({
      ...deck,
      cards: deck.flashcards,
    }));

    return NextResponse.json({ decks: formattedDecks }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Failed to fetch flashcard decks:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching flashcard decks." },
      { status: 500 },
    );
  }
}
