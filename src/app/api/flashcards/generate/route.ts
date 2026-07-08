import {
  GoogleGenerativeAI,
  SchemaType,
  type Part,
  type Schema,
} from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, AuthError } from "@/lib/auth";
import { awardFixedXp } from "@/lib/xp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SYSTEM_INSTRUCTION =
  "Sen zorlu ve ölçücü sınavlar hazırlayan uzman bir eğitim tasarımcısısın. Amacın ezbere dayalı değil, analitik düşünmeyi gerektiren çalışma materyalleri üretmektir. Sadece 'Kavram - Tanım' eşleştirmesi yapma, konuları senaryolaştırarak sor. Çeldirici şıklar (yanlış cevaplar) çok güçlü ve mantıklı olmalıdır. Her doğru cevabın yanına mutlaka 'Neden bu doğru?' açıklamasını (explanation) ekle. İçeriği SADECE verilen PDF'e veya spesifik konuya sınırla.";

interface FlashcardPayload {
  title: string;
  cards: Array<{
    frontText: string;
    backText: string;
    explanation: string;
  }>;
}

const flashcardResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
    },
    cards: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          frontText: {
            type: SchemaType.STRING,
          },
          backText: {
            type: SchemaType.STRING,
          },
          explanation: {
            type: SchemaType.STRING,
          },
        },
        required: ["frontText", "backText", "explanation"],
      },
    },
  },
  required: ["title", "cards"],
};

const extractInlineFileData = (file: string) => {
  return {
    data: file.trim().replace(/^data:.*,/, ""),
    mimeType: "application/pdf",
  };
};

const getOptionalString = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const parseFlashcardPayload = (value: unknown): FlashcardPayload | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Record<string, unknown>;

  if (typeof payload.title !== "string" || !Array.isArray(payload.cards)) {
    return null;
  }

  const cards = payload.cards
    .filter((card): card is Record<string, unknown> => {
      return Boolean(card) && typeof card === "object";
    })
    .map((card) => ({
      frontText:
        typeof card.frontText === "string" ? card.frontText.trim() : "",
      backText: typeof card.backText === "string" ? card.backText.trim() : "",
      explanation:
        typeof card.explanation === "string" ? card.explanation.trim() : "",
    }))
    .filter(
      (card) =>
        card.frontText.length > 0 &&
        card.backText.length > 0 &&
        card.explanation.length > 0,
    );

  if (payload.title.trim().length === 0 || cards.length === 0) {
    return null;
  }

  return {
    title: payload.title.trim(),
    cards,
  };
};

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    const body = (await request.json()) as {
      topic?: unknown;
      file?: unknown;
      sourceName?: unknown;
      conversationId?: unknown;
    };

    if (typeof body.topic !== "string" || body.topic.trim().length === 0) {
      return NextResponse.json(
        { error: "Topic is required." },
        { status: 400 },
      );
    }

    if (
      body.file !== undefined &&
      body.file !== null &&
      (typeof body.file !== "string" || body.file.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: "File must be a non-empty base64 string." },
        { status: 400 },
      );
    }

    const topic = body.topic.trim();
    const sourceName = getOptionalString(body.sourceName);
    const conversationId = getOptionalString(body.conversationId);
    const prompt = `Create 10 analytical flashcards that test the most important information from the given topic or attached PDF/file. Do not create simple "concept-definition" cards. Make the front side scenario-based or reasoning-based when possible. Return JSON exactly in this structure: { "title": "Deck Title", "cards": [ { "frontText": "Scenario-based question or analytical prompt", "backText": "Answer", "explanation": "Neden bu doğru? ..." } ] }

Topic: ${topic}

Your response must be valid JSON only. Do not include Markdown, explanations, or code fences.`;

    const requestParts: Array<string | Part> =
      typeof body.file === "string"
        ? [
            prompt,
            {
              inlineData: extractInlineFileData(body.file),
            },
          ]
        : [prompt];

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        responseMimeType: "application/json",
        responseSchema: flashcardResponseSchema,
      },
    });

    const result = await model.generateContent(requestParts);
    const responseText = result.response
      .text()
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(responseText);
    } catch (error) {
      console.error("Failed to parse flashcard JSON response:", error);
      return NextResponse.json(
        { error: "AI generated an invalid JSON response." },
        { status: 502 },
      );
    }

    const flashcardPayload = parseFlashcardPayload(parsedResponse);

    if (!flashcardPayload) {
      console.error("AI generated an invalid flashcard payload:", responseText);
      return NextResponse.json(
        { error: "AI generated an invalid flashcard structure." },
        { status: 502 },
      );
    }

    const deck = await prisma.flashcardDeck.create({
      data: {
        title: flashcardPayload.title,
        sourceName,
        conversationId,
        userId,
        flashcards: {
          create: flashcardPayload.cards.map((card) => ({
            frontText: card.frontText,
            backText: `${card.backText}\n\nNeden bu doğru? ${card.explanation}`,
          })),
        },
      },
      include: {
        flashcards: true,
      },
    });
    await awardFixedXp(userId, "AI_RESOURCE_GENERATED");

    return NextResponse.json({ success: true, deck }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Flashcard generation request failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("503") ||
      errorMessage.includes("Service Unavailable") ||
      errorMessage.toLowerCase().includes("high demand")
    ) {
      return NextResponse.json(
        {
          error:
            "AI servers are currently under heavy load. Please try again in 1-2 minutes.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while creating flashcards." },
      { status: 500 },
    );
  }
}
