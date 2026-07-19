import { withValidation } from "@/lib/api-route";
import { FillVisualDataSchema } from "@/lib/validators";
import { fillVisualData } from "@/services/groq";

export const POST = withValidation(FillVisualDataSchema, async ({ visualType, title, body: slideBody }) => {
  const visualData = await fillVisualData(visualType, title, slideBody);
  return { visualData };
});
