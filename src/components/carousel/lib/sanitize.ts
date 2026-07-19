export function sanitizeTextForSatori(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019\u201a\u201b\u2039\u203a]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f\u00ab\u00bb]/g, '"')
    .replace(/[\u00a0\u202f\u205f\u3000]/g, " ")
    .replace(/\u2026/g, "...")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "");
}

export function sanitizeObjectStrings<T>(obj: T): T {
  if (!obj) return obj;
  if (typeof obj === "string") {
    return sanitizeTextForSatori(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObjectStrings(item)) as unknown as T;
  }
  if (typeof obj === "object") {
    const res: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        res[key] = sanitizeObjectStrings((obj as Record<string, unknown>)[key]);
      }
    }
    return res as unknown as T;
  }
  return obj;
}
