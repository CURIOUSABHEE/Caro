import { withValidation } from "@/lib/api-route";
import { RegenerateAlternativesSchema } from "@/lib/validators";
import { generateAlternatives } from "@/services/groq";

export const POST = withValidation(RegenerateAlternativesSchema, async (data) => {
  const { slideType, originalText, currentTitle, currentBody, tone, audience, goal } = data;
  return generateAlternatives(slideType, originalText, tone, audience, goal, currentTitle, currentBody);
});
