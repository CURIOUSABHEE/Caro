import { withValidation } from "@/lib/api-route";
import { ExportZipSchema } from "@/lib/validators";
import JSZip from "jszip";

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100) || "slide";
}

export const POST = withValidation(ExportZipSchema, async ({ images }) => {
  const zip = new JSZip();

  for (const { fileName, dataUri } of images) {
    const safeFileName = sanitizeFileName(fileName);
    const matches = dataUri.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      throw new Error(`Invalid image data URI format for file: ${safeFileName}`);
    }
    zip.file(safeFileName, Buffer.from(matches[2], "base64"));
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  return new Response(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=carousel-export.zip",
      "Content-Length": zipBuffer.length.toString(),
    },
  });
});
