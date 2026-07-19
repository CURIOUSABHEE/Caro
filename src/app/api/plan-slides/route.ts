import { withValidation } from "@/lib/api-route";
import { PlanSlidesSchema } from "@/lib/validators";
import { planSlides } from "@/services/groq";
import { cachedLLMCall } from "@/lib/cached-llm";

export const POST = withValidation(PlanSlidesSchema, async (data) => {
  const { url, text, tone, focus, slideCount, targetPlatform, audience, goal, ctaStyle, selectedOutline } = data;

  const result = await cachedLLMCall(
    url,
    { text, tone, focus, slideCount, targetPlatform, audience, goal, ctaStyle, selectedOutline },
    () => planSlides(text, tone, focus, slideCount, targetPlatform, audience, goal, ctaStyle, selectedOutline)
  );

  return { slides: result };
});
