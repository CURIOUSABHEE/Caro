import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

type Handler<T> = (data: T) => Promise<unknown>;

/**
 * Wraps a Next.js POST route handler with Zod validation and standard error handling.
 *
 * Usage:
 * ```ts
 * export const POST = withValidation(FillVisualDataSchema, async (data) => {
 *   const visualData = await fillVisualData(data.visualType, data.title, data.body);
 *   return { visualData };
 * });
 * ```
 */
export function withValidation<T>(schema: ZodSchema<T>, handler: Handler<T>) {
  return async function POST(req: Request) {
    try {
      const body = await req.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request payload",
            details: result.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const data = await handler(result.data);

      // If the handler returned a Response (e.g. binary zip), pass it through directly.
      if (data instanceof Response) {
        return data;
      }

      return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Internal server error";
      console.error(`[API ${req.url}]`, error);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  };
}
