import { NextResponse } from "next/server";
import { PlanSlidesSchema } from "@/lib/validators";
import { planSlides } from "@/services/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = PlanSlidesSchema.safeParse(body);

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

    const { text, tone, focus, slideCount } = validation.data;
    const slides = await planSlides(text, tone, focus, slideCount);

    return NextResponse.json({
      success: true,
      data: {
        slides,
      },
    });
  } catch (error: any) {
    console.error("[API Plan Slides] Execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate slide plan using Groq.",
      },
      { status: 500 }
    );
  }
}
