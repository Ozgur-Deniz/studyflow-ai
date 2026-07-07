import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, AuthError } from "@/lib/auth";
import { awardFixedXp } from "@/lib/xp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

interface QuizPayload {
  title: string;
  questions: Array<{
    questionText: string;
    options: string[];
    correctAnswer: string;
  }>;
}

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

const parseQuizPayload = (value: unknown): QuizPayload | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Record<string, unknown>;

  if (
    typeof payload.title !== "string" ||
    payload.title.trim().length === 0 ||
    !Array.isArray(payload.questions)
  ) {
    return null;
  }

  const questions = payload.questions
    .filter((question): question is Record<string, unknown> => {
      return Boolean(question) && typeof question === "object";
    })
    .map((question) => {
      const options = Array.isArray(question.options)
        ? question.options
            .filter((option): option is string => typeof option === "string")
            .map((option) => option.trim())
            .filter((option) => option.length > 0)
        : [];

      return {
        questionText:
          typeof question.questionText === "string"
            ? question.questionText.trim()
            : "",
        options,
        correctAnswer:
          typeof question.correctAnswer === "string"
            ? question.correctAnswer.trim()
            : "",
      };
    })
    .filter(
      (question) =>
        question.questionText.length > 0 &&
        question.options.length === 4 &&
        question.correctAnswer.length > 0 &&
        question.options.includes(question.correctAnswer),
    );

  if (questions.length === 0) {
    return null;
  }

  return {
    title: payload.title.trim(),
    questions,
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
    const prompt = `You are an expert educator. Based on the given topic or attached document, create a 5-question multiple-choice quiz for the student. Each question must have 4 options. Return JSON exactly in this structure: { "title": "Quiz Title", "questions": [ { "questionText": "Question text...", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": "The full text of the correct option" } ] }

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
      generationConfig: {
        responseMimeType: "application/json",
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
      console.error("Failed to parse quiz JSON response:", error);
      return NextResponse.json(
        { error: "AI generated an invalid JSON response." },
        { status: 502 },
      );
    }

    const quizPayload = parseQuizPayload(parsedResponse);

    if (!quizPayload) {
      console.error("AI generated an invalid quiz payload:", responseText);
      return NextResponse.json(
        { error: "AI generated an invalid quiz structure." },
        { status: 502 },
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: quizPayload.title,
        sourceName,
        conversationId,
        userId,
        questions: {
          create: quizPayload.questions.map((question) => ({
            questionText: question.questionText,
            options: question.options,
            correctAnswer: question.correctAnswer,
          })),
        },
      },
      include: {
        questions: true,
      },
    });
    await awardFixedXp(userId, "AI_RESOURCE_GENERATED");

    return NextResponse.json({ success: true, quiz }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Quiz generation request failed:", error);

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
            "AI servers are currently busy. Please try again in 1-2 minutes.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while creating the quiz." },
      { status: 500 },
    );
  }
}
