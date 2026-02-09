import { json, error, requireAuth, getToday } from '../_lib';
import type { Env } from '../_lib';

function calcStatus(endDate: string): string {
  const today = new Date(getToday());
  const end = new Date(endDate);
  const diff = (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'expired';
  if (diff <= 30) return 'due_soon';
  return 'active';
}

// GET /api/subscriptions/:id
export const onRequestGet: PagesFunction<Env, 'id'> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const id = context.params.id;

  try {
    const sub = await db
      .prepare(
        `SELECT s.*, c.name as customer_name, st.name as service_name
         FROM subscriptions s
         JOIN customers c ON s.customer_id = c.id
         JOIN service_types st ON s.service_type_id = st.id
         WHERE s.id = ?`
      )
      .bind(id)
      .first();

    if (!sub) return error('Subscription not found', 404);
    return json({ ...sub, status: calcStatus((sub as any).end_date) });
  } catch (e: any) {
    return error('Failed to fetch subscription: ' + e.message, 500);
  }
};

// PUT /api/subscriptions/:id
export const onRequestPut: PagesFunction<Env, 'id'> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const id = context.params.id;

  try {
    const body = (await context.request.json()) as {
      customer_id?: number;
      service_type_id?: number;
      domain_or_service?: string;
      start_date?: string;
      end_date?: string;
      price?: number;
      currency?: string;
      notes?: string;
    };

    if (!body.end_date) return error('End date is required');

    const status = calcStatus(body.end_date);

    await db
      .prepare(
        `UPDATE subscriptions SET customer_id = ?, service_type_id = ?, domain_or_service = ?,
         start_date = ?, end_date = ?, price = ?, currency = ?, status = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(
        body.customer_id,
        body.service_type_id,
        body.domain_or_service,
        body.start_date,
        body.end_date,
        body.price || 0,
        body.currency || 'JOD',
        status,
        body.notes || '',
        id
      )
      .run();

    const sub = await db
      .prepare(
        `SELECT s.*, c.name as customer_name, st.name as service_name
         FROM subscriptions s
         JOIN customers c ON s.customer_id = c.id
         JOIN service_types st ON s.service_type_id = st.id
         WHERE s.id = ?`
      )
      .bind(id)
      .first();

    return json(sub);
  } catch (e: any) {
    return error('Failed to update subscription: ' + e.message, 500);
  }
};

// DELETE /api/subscriptions/:id
export const onRequestDelete: PagesFunction<Env, 'id'> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const id = context.params.id;

  try {
    await db.prepare('DELETE FROM subscriptions WHERE id = ?').bind(id).run();
    return json({ message: 'Subscription deleted' });
  } catch (e: any) {
    return error('Failed to delete subscription: ' + e.message, 500);
  }
};
