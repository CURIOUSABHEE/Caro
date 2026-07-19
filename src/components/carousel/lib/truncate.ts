export function clampText(text: string, maxLen: number): string {
  if (!text) return text;
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "\u2026" : text;
}
