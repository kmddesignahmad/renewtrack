import { json, error, hashPassword } from '../../lib';
import type { Env } from '../../lib';

// POST /api/auth/init - Create admin user if not exists
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind('admin').first();
    if (existing) {
      return json({ message: 'Admin user already exists' });
    }

    const hash = await hashPassword('11071990');
    await db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').bind('admin', hash).run();

    return json({ message: 'Admin user created successfully' });
  } catch (e: any) {
    return error('Failed to initialize: ' + e.message, 500);
  }
};
