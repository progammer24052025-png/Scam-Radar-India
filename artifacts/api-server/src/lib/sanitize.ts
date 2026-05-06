const LIMITS = {
  SHORT: 100,
  MEDIUM: 500,
  LONG: 2000,
  TOKEN: 512,
};

function truncate(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

function stripControl(s: string): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

export function sanitizeShort(value: unknown): string {
  return stripControl(truncate(value, LIMITS.SHORT).trim());
}

export function sanitizeMedium(value: unknown): string {
  return stripControl(truncate(value, LIMITS.MEDIUM).trim());
}

export function sanitizeLong(value: unknown): string {
  return stripControl(truncate(value, LIMITS.LONG).trim());
}

export function sanitizeToken(value: unknown): string {
  return stripControl(truncate(value, LIMITS.TOKEN).trim());
}

export { LIMITS };
