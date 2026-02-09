import { json, error, requireAuth } from '../_lib';
import type { Env } from '../_lib';

// GET /api/services
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

  try {
    const result = await db.prepare('SELECT * FROM service_types ORDER BY name ASC').all();
    return json(result.results || []);
  } catch (e: any) {
    return error('Failed to fetch services: ' + e.message, 500);
  }
};

// POST /api/services
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

  try {
    const body = (await context.request.json()) as { name?: string };

    if (!body.name || !body.name.trim()) {
      return error('Service name is required');
    }

    const result = await db
      .prepare('INSERT INTO service_types (name) VALUES (?)')
      .bind(body.name.trim())
      .run();

    const service = await db
      .prepare('SELECT * FROM service_types WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    return json(service, 201);
  } catch (e: any) {
    return error('Failed to create service: ' + e.message, 500);
  }
};
