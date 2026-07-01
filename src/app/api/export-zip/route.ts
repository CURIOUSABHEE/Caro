import { NextResponse } from "next/server";
import JSZip from "jszip";
import { ExportZipSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = ExportZipSchema.safeParse(body);

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

    const { images } = validation.data;
    const zip = new JSZip();

    // Loop through each image and add it to the ZIP
    for (const image of images) {
      const { fileName, dataUri } = image;
      
      // Parse base64 data uri (e.g. "data:image/png;base64,iVBORw0KGgo...")
      const matches = dataUri.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (!matches || matches.length < 3) {
        return NextResponse.json(
          { success: false, error: `Invalid image data URI format for file: ${fileName}` },
          { status: 400 }
        );
      }
      
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      
      zip.file(fileName, buffer);
    }

    // Generate zip file buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Return binary zip response
    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=carousel-export.zip",
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("[API Export ZIP] Failed to create ZIP archive:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create and download ZIP archive.",
      },
      { status: 500 }
    );
  }
}
