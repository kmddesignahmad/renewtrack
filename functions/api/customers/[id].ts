import { json, error, requireAuth } from '../_lib';
import type { Env } from '../_lib';

// GET /api/customers/:id
export const onRequestGet: PagesFunction<Env, 'id'> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const id = context.params.id;

  try {
    const customer = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first();
    if (!customer) return error('Customer not found', 404);
    return json(customer);
  } catch (e: any) {
    return error('Failed to fetch customer: ' + e.message, 500);
  }
};

// PUT /api/customers/:id
export const onRequestPut: PagesFunction<Env, 'id'> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const id = context.params.id;

  try {
    const body = (await context.request.json()) as {
      name?: string;
      phone_primary?: string;
      phone_secondary?: string;
      email?: string;
      notes?: string;
      action?: string;
    };

    // Restore from trash
    if (body.action === 'restore') {
      await db.prepare(`UPDATE customers SET deleted_at = NULL, updated_at = datetime('now') WHERE id = ?`).bind(id).run();
      const customer = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first();
      return json(customer);
    }

    if (!body.name || !body.name.trim()) {
      return error('Customer name is required');
    }

    await db
      .prepare(
        `UPDATE customers SET name = ?, phone_primary = ?, phone_secondary = ?, email = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(body.name.trim(), body.phone_primary || '', body.phone_secondary || '', body.email || '', body.notes || '', id)
      .run();

    const customer = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first();
    return json(customer);
  } catch (e: any) {
    return error('Failed to update customer: ' + e.message, 500);
  }
};

// DELETE /api/customers/:id?permanent=1 for permanent delete
export const onRequestDelete: PagesFunction<Env, 'id'> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const id = context.params.id;
  const url = new URL(context.request.url);
  const permanent = url.searchParams.get('permanent') === '1';

  try {
    if (permanent) {
      // Permanent delete - cascading will remove subscriptions
      await db.prepare('DELETE FROM customers WHERE id = ?').bind(id).run();
      return json({ message: 'Customer permanently deleted' });
    } else {
      // Soft delete - move to trash
      await db.prepare(`UPDATE customers SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).bind(id).run();
      return json({ message: 'Customer moved to trash' });
    }
  } catch (e: any) {
    return error('Failed to delete customer: ' + e.message, 500);
  }
};
