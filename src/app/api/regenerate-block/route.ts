import { withValidation } from "@/lib/api-route";
import { RegenerateBlockSchema } from "@/lib/validators";
import { regenerateBlock } from "@/services/groq";

export const POST = withValidation(RegenerateBlockSchema, async ({ block, instruction, originalText }) => {
  const regenerated = await regenerateBlock(block, instruction, originalText);
  return {
    block: {
      ...block,
      title: regenerated.title,
      body: regenerated.body,
      type: regenerated.type,
      visualType: block.visualType,
      visualData: block.visualData,
    },
  };
});
