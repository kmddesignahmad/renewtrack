import { json, error, hashPassword, createToken } from '../../lib';
import type { Env } from '../../lib';

// POST /api/auth/login
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = (await context.request.json()) as { username?: string; password?: string };
    const { username, password } = body;

    if (!username || !password) {
      return error('Username and password are required');
    }

    const hash = await hashPassword(password);
    const user = await db
      .prepare('SELECT id, username FROM users WHERE username = ? AND password_hash = ?')
      .bind(username, hash)
      .first();

    if (!user) {
      return error('Invalid username or password', 401);
    }

    const token = await createToken(username);
    return json({ token, username: user.username });
  } catch (e: any) {
    return error('Login failed: ' + e.message, 500);
  }
};
