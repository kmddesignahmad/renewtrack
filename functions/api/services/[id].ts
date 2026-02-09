import { json, error, requireAuth } from '../_lib';
import type { Env } from '../_lib';

// PUT /api/services/:id
export const onRequestPut: PagesFunction<Env, 'id'> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const id = context.params.id;

  try {
    const body = (await context.request.json()) as { name?: string; is_active?: number };

    if (body.name !== undefined && !body.name.trim()) {
      return error('Service name cannot be empty');
    }

    const current = await db.prepare('SELECT * FROM service_types WHERE id = ?').bind(id).first();
    if (!current) return error('Service not found', 404);

    const name = body.name?.trim() || (current as any).name;
    const is_active = body.is_active !== undefined ? body.is_active : (current as any).is_active;

    await db
      .prepare('UPDATE service_types SET name = ?, is_active = ? WHERE id = ?')
      .bind(name, is_active, id)
      .run();

    const service = await db.prepare('SELECT * FROM service_types WHERE id = ?').bind(id).first();
    return json(service);
  } catch (e: any) {
    return error('Failed to update service: ' + e.message, 500);
  }
};

// DELETE /api/services/:id
export const onRequestDelete: PagesFunction<Env, 'id'> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const id = context.params.id;

  try {
    const usage = await db
      .prepare('SELECT COUNT(*) as count FROM subscriptions WHERE service_type_id = ?')
      .bind(id)
      .first<{ count: number }>();

    if (usage && usage.count > 0) {
      return error('Cannot delete service type that is used by subscriptions. Disable it instead.');
    }

    await db.prepare('DELETE FROM service_types WHERE id = ?').bind(id).run();
    return json({ message: 'Service deleted' });
  } catch (e: any) {
    return error('Failed to delete service: ' + e.message, 500);
  }
};
