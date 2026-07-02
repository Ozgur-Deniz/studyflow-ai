import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SYSTEM_INSTRUCTION =
  "You are StudyFlow AI, a helpful, focused, and supportive study assistant. Provide clear, practical, and accurate guidance for learning, planning, and studying.";

const formatActiveStudyPlans = (
  plans: Array<{ title: string; description: string | null }>,
) => {
  if (plans.length === 0) {
    return "The user currently has no active study plans.";
  }

  return plans
    .map((plan, index) => {
      const description = plan.description?.trim()
        ? plan.description.trim()
        : "No topic or duration details provided.";

      return `${index + 1}. Title: ${plan.title}\nTopic and duration details: ${description}`;
    })
    .join("\n\n");
};

interface UploadedFile {
  base64: string;
  mimeType: string;
  name: string;
}

const isUploadedFile = (file: unknown): file is UploadedFile => {
  if (!file || typeof file !== "object") {
    return false;
  }

  const candidate = file as Record<string, unknown>;

  return (
    typeof candidate.base64 === "string" &&
    candidate.base64.trim().length > 0 &&
    typeof candidate.mimeType === "string" &&
    candidate.mimeType.trim().length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0
  );
};

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const activeStudyPlans = await prisma.studyPlan.findMany({
      where: {
        userId,
        isCompleted: false,
      },
      select: {
        title: true,
        description: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const activePlansContext = formatActiveStudyPlans(activeStudyPlans);

    const body = await request.json();
    const { message, conversationId, file } = body as {
      message?: unknown;
      conversationId?: unknown;
      file?: unknown;
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

    if (file !== undefined && file !== null && !isUploadedFile(file)) {
      return new Response(
        JSON.stringify({
          error: "File must include base64, mimeType, and name.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const uploadedFile = isUploadedFile(file)
      ? {
          base64: file.base64.trim().replace(/^data:.*,/, ""),
          mimeType: file.mimeType.trim(),
          name: file.name.trim(),
        }
      : null;

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
        content: uploadedFile
          ? `📎 **Dosya Eklendi:** ${uploadedFile.name}\n\n${message}`
          : message,
        role: "USER",
        conversationId: activeConversationId,
      },
    });

    const systemInstructionWithContext = `${SYSTEM_INSTRUCTION}

Here are the user's current active study plans from the database: ${activePlansContext}. Use this context to provide personalized advice when the user asks about what to study, their progress, or their schedule. Do not list the plans automatically unless specifically asked, just be aware of them.`;

    const prompt = `${systemInstructionWithContext}\n\nUser message:\n${message}`;
    const geminiRequestParts: Array<string | Part> = uploadedFile
      ? [
          prompt,
          {
            inlineData: {
              data: uploadedFile.base64,
              mimeType: uploadedFile.mimeType,
            },
          },
        ]
      : [prompt];

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContentStream(geminiRequestParts);

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
