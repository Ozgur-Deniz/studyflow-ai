import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, AuthError } from "@/lib/auth";
import { awardFixedXp } from "@/lib/xp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const DEFAULT_CHAT_MODEL = "gemini-3.5-flash";
const FALLBACK_CHAT_MODEL = "gemini-3.1-flash-lite";

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

const getRequestedModel = (model: unknown) => {
  if (typeof model !== "string") {
    return DEFAULT_CHAT_MODEL;
  }

  const trimmedModel = model.trim();

  return trimmedModel.length > 0 ? trimmedModel : DEFAULT_CHAT_MODEL;
};

const getErrorText = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

const isRetryableModelFailure = (error: unknown) => {
  const errorText = getErrorText(error).toLowerCase();

  return [
    "429",
    "503",
    "quota",
    "exhausted",
    "overloaded",
    "resource_exhausted",
    "service unavailable",
    "rate limit",
    "api",
    "rejected",
  ].some((keyword) => errorText.includes(keyword));
};

const startGeminiChatStream = async ({
  modelName,
  systemInstruction,
  parts,
}: {
  modelName: string;
  systemInstruction: string;
  parts: Array<string | Part>;
}) => {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
  });
  const chat = model.startChat();

  return chat.sendMessageStream(parts);
};

const createAssistantStreamResponse = ({
  result,
  activeConversationId,
  exhaustedModel,
}: {
  result: Awaited<ReturnType<typeof startGeminiChatStream>>;
  activeConversationId: string;
  exhaustedModel?: string;
}) => {
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

  const headers = new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "x-conversation-id": activeConversationId,
  });

  if (exhaustedModel) {
    headers.set("X-Exhausted-Model", exhaustedModel);
  }

  return new Response(stream, {
    headers,
  });
};

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

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
    const { message, conversationId, file, model } = body as {
      message?: unknown;
      conversationId?: unknown;
      file?: unknown;
      model?: unknown;
    };
    const requestedModel = getRequestedModel(model);

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
          ? `File Attached: ${uploadedFile.name}\n\n${message}`
          : message,
        role: "USER",
        conversationId: activeConversationId,
      },
    });
    await awardFixedXp(userId, "AI_MESSAGE_SENT");

    const systemInstructionWithContext = `${SYSTEM_INSTRUCTION}

Here are the user's current active study plans from the database: ${activePlansContext}. Use this context to provide personalized advice when the user asks about what to study, their progress, or their schedule. Do not list the plans automatically unless specifically asked, just be aware of them.`;

    const geminiRequestParts: Array<string | Part> = uploadedFile
      ? [
          message,
          {
            inlineData: {
              data: uploadedFile.base64,
              mimeType: uploadedFile.mimeType,
            },
          },
        ]
      : [message];

    try {
      const result = await startGeminiChatStream({
        modelName: requestedModel,
        systemInstruction: systemInstructionWithContext,
        parts: geminiRequestParts,
      });

      return createAssistantStreamResponse({
        result,
        activeConversationId,
      });
    } catch (error) {
      if (
        requestedModel === FALLBACK_CHAT_MODEL ||
        !isRetryableModelFailure(error)
      ) {
        throw error;
      }

      console.error(
        `Primary Gemini model failed. Retrying with fallback model. Exhausted model: ${requestedModel}`,
        error,
      );

      try {
        const fallbackResult = await startGeminiChatStream({
          modelName: FALLBACK_CHAT_MODEL,
          systemInstruction: systemInstructionWithContext,
          parts: geminiRequestParts,
        });

        return createAssistantStreamResponse({
          result: fallbackResult,
          activeConversationId,
          exhaustedModel: requestedModel,
        });
      } catch (fallbackError) {
        console.error("Fallback Gemini model failed:", fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

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
