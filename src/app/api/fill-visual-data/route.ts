import { NextResponse } from "next/server";
import { FillVisualDataSchema } from "@/lib/validators";
import { fillVisualData } from "@/services/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = FillVisualDataSchema.safeParse(body);

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

    const { visualType, title, body: slideBody } = validation.data;
    const visualData = await fillVisualData(visualType, title, slideBody);

    return NextResponse.json({
      success: true,
      data: {
        visualData,
      },
    });
  } catch (error: any) {
    console.error("[API Fill Visual Data] Execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to extract visual data.",
      },
      { status: 500 }
    );
  }
}
