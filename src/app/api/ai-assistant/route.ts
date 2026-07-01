import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SYSTEM_INSTRUCTION =
  "You are StudyFlow AI, a helpful, focused, and supportive study assistant. Provide clear, practical, and accurate guidance for learning, planning, and studying.";

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { message, conversationId } = body as {
      message?: unknown;
      conversationId?: unknown;
    };

    if (typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message is required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (
      conversationId !== undefined &&
      conversationId !== null &&
      typeof conversationId !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "Conversation ID must be a string." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    let activeConversationId: string;

    if (typeof conversationId === "string" && conversationId.length > 0) {
      activeConversationId = conversationId;
    } else {
      const conversation = await prisma.conversation.create({
        data: {
          userId,
          title: message.slice(0, 40),
        },
      });

      activeConversationId = conversation.id;
    }

    await prisma.message.create({
      data: {
        content: message,
        role: "USER",
        conversationId: activeConversationId,
      },
    });

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContentStream(
      `${SYSTEM_INSTRUCTION}\n\nUser message:\n${message}`,
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let assistantMessage = "";

        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();

            if (!chunkText) {
              continue;
            }

            assistantMessage += chunkText;
            controller.enqueue(encoder.encode(chunkText));
          }

          await prisma.message.create({
            data: {
              content: assistantMessage,
              role: "ASSISTANT",
              conversationId: activeConversationId,
            },
          });

          controller.close();
        } catch (error) {
          console.error("Error occurred while streaming AI response:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-conversation-id": activeConversationId,
      },
    });
  } catch (error) {
    console.error("AI assistant request failed:", error);

    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
