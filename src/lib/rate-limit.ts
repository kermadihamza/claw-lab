const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; resetAt: number }>();

/** Limiteur en mémoire (par instance serverless) : bloque après 5 échecs en 15 min pour une même clé. */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export function resetRateLimit(key: string) {
  attempts.delete(key);
}
