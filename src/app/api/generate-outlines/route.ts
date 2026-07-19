import { withValidation } from "@/lib/api-route";
import { GenerateOutlinesSchema } from "@/lib/validators";
import { generateOutlines } from "@/services/groq";
import { cachedLLMCall } from "@/lib/cached-llm";

export const POST = withValidation(GenerateOutlinesSchema, async (data) => {
  const { url, text, tone, focus, slideCount, targetPlatform, audience, goal, ctaStyle } = data;

  return cachedLLMCall(
    url,
    { text, tone, focus, slideCount, targetPlatform, audience, goal, ctaStyle },
    () => generateOutlines(text, tone, focus, slideCount, targetPlatform, audience, goal, ctaStyle)
  );
});
