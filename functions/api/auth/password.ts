import { json, error, hashPassword, requireAuth } from '../../lib';
import type { Env } from '../../lib';

// POST /api/auth/password
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

  try {
    const body = (await context.request.json()) as {
      current_password?: string;
      new_password?: string;
    };

    if (!body.current_password || !body.new_password) {
      return error('Current and new passwords are required');
    }

    if (body.new_password.length < 4) {
      return error('New password must be at least 4 characters');
    }

    const currentHash = await hashPassword(body.current_password);
    const user = await db
      .prepare('SELECT id FROM users WHERE username = ? AND password_hash = ?')
      .bind(auth.username, currentHash)
      .first();

    if (!user) {
      return error('Current password is incorrect', 401);
    }

    const newHash = await hashPassword(body.new_password);
    await db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').bind(newHash, auth.username).run();

    return json({ message: 'Password changed successfully' });
  } catch (e: any) {
    return error('Failed to change password: ' + e.message, 500);
  }
};
