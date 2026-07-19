/**
 * Convert a base64 PNG data URI to JPEG (0.98 quality) via canvas.
 */
export function convertBase64PngToJpg(pngBase64Uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.98));
    };
    img.onerror = (err) => reject(err);
    img.src = pngBase64Uri;
  });
}

/**
 * Sanitize a string for use as a file name (lowercase, hyphens, max 50 chars).
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50)
    || "slide";
}
