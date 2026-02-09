// Shared types for Cloudflare Pages Functions
export interface Env {
  DB: D1Database;
}

export type CFContext = EventContext<Env, string, unknown>;

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function error(message: string, status = 400) {
  return json({ error: message }, status);
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

// Simple token: base64(username:timestamp:hash)
export async function createToken(username: string): Promise<string> {
  const timestamp = Date.now().toString();
  const raw = `${username}:${timestamp}`;
  const hash = await hashPassword(raw + 'renewtrack_secret');
  const token = btoa(`${username}:${timestamp}:${hash}`);
  return token;
}

export function verifyToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    if (parts.length < 3) return { valid: false };
    const username = parts[0];
    const timestamp = parseInt(parts[1]);
    // Token valid for 24 hours
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return { valid: false };
    return { valid: true, username };
  } catch {
    return { valid: false };
  }
}

export function requireAuth(request: Request): { valid: boolean; username?: string } {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }
  const token = authHeader.slice(7);
  return verifyToken(token);
}
