import { NextResponse } from "next/server";
import { RegenerateAlternativesSchema } from "@/lib/validators";
import { generateAlternatives } from "@/services/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = RegenerateAlternativesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { slideType, originalText, currentTitle, currentBody, tone, audience, goal } = validation.data;
    const result = await generateAlternatives(
      slideType,
      originalText,
      tone,
      audience,
      goal,
      currentTitle,
      currentBody
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("[API Regenerate Alternatives] Execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate alternatives using Groq.",
      },
      { status: 500 }
    );
  }
}
