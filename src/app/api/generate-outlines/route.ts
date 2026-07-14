import { NextResponse } from "next/server";
import { GenerateOutlinesSchema } from "@/lib/validators";
import { generateOutlines } from "@/services/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = GenerateOutlinesSchema.safeParse(body);

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

    const { text, tone, focus, slideCount, targetPlatform, audience, goal, ctaStyle } = validation.data;
    const result = await generateOutlines(
      text,
      tone,
      focus,
      slideCount,
      targetPlatform,
      audience,
      goal,
      ctaStyle
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("[API Generate Outlines] Execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate outlines using Groq.",
      },
      { status: 500 }
    );
  }
}
