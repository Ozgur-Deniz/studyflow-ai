import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    console.log("[Study Plans API] Received request to generate a new plan...");

    // 1. Authenticate User via Token
    const token = request.cookies.get("token")?.value;
    if (!token) {
      console.warn("[Study Plans API] Unauthorized access attempt.");
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // 2. Parse Request Body
    const body = await request.json();
    const { topic, timeframe } = body;

    if (!topic || !timeframe) {
      console.warn(
        "[Study Plans API] Missing required fields: topic or timeframe.",
      );
      return NextResponse.json(
        { message: "Topic and timeframe are required." },
        { status: 400 },
      );
    }

    console.log(
      `[Study Plans API] Generating plan for user ${userId}. Topic: "${topic}", Timeframe: "${timeframe}"`,
    );

    // 3. Prepare AI Prompt & Config
    // generationConfig içine responseMimeType ekleyerek Gemini'ı JSON dönmeye zorluyoruz!
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Hangi model ismi sende çalıştıysa o kalsın
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
      You are an expert academic advisor and personalized tutor.
      Create a highly structured, efficient, and motivating study roadmap.
      Topic: ${topic}
      Time: ${timeframe}

      Your response MUST be ONLY a raw JSON object. No markdown, no backticks, no text outside the JSON.
      Structure:
      {
        "title": "A short catchy title here",
        "description": "The detailed markdown formatted study plan goes here"
      }
    `;

    // 4. Call Gemini API
    const aiResponse = await model.generateContent(prompt);
    let responseText = aiResponse.response.text().trim();

    // Güvenlik Duvarı: Model inat edip markdown yollarsa diye temizlik yapıyoruz
    responseText = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // 5. Parse and Validate AI JSON Output
    let parsedPlan;
    try {
      parsedPlan = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        "[Study Plans API] Failed to parse JSON. Cleaned response:",
        responseText,
      );
      return NextResponse.json(
        {
          message: "AI generated an invalid data structure. Please try again.",
        },
        { status: 502 },
      );
    }
    // 6. Save the Plan into Neon Database via Prisma
    const newPlan = await prisma.studyPlan.create({
      data: {
        title: parsedPlan.title,
        description: parsedPlan.description,
        userId: userId,
        isCompleted: false,
      },
    });

    console.log(
      `[Study Plans API] Study plan "${newPlan.title}" successfully created in database for user: ${userId}`,
    );
    return NextResponse.json({ success: true, plan: newPlan }, { status: 201 });
  } catch (error) {
    console.error("[Study Plans API] Critical internal server error:", error);
    return NextResponse.json(
      { message: "An error occurred while generating your study plan." },
      { status: 500 },
    );
  }
}

// GET Metodu: Kullanıcının mevcut planlarını veritabanından çekmek için
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // Veritabanından kullanıcının tüm planlarını en yeniden en eskiye doğru sıralayarak getir
    const userPlans = await prisma.studyPlan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ plans: userPlans }, { status: 200 });
  } catch (error) {
    console.error("[Study Plans API] Error fetching plans:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching your plans." },
      { status: 500 },
    );
  }
}
