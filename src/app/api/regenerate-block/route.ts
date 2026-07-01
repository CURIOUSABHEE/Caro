import { NextResponse } from "next/server";
import { RegenerateBlockSchema } from "@/lib/validators";
import { regenerateBlock } from "@/services/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = RegenerateBlockSchema.safeParse(body);

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

    const { block, instruction, originalText } = validation.data;
    const regenerated = await regenerateBlock(block, instruction, originalText);

    return NextResponse.json({
      success: true,
      data: {
        block: {
          ...block,
          title: regenerated.title,
          body: regenerated.body,
          type: regenerated.type,
        },
      },
    });
  } catch (error: any) {
    console.error("[API Regenerate Block] Execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to regenerate slide block using Groq.",
      },
      { status: 500 }
    );
  }
}
