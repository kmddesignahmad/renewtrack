import { json, error, requireAuth, getToday } from '../../lib';
import type { Env } from '../../lib';

// GET /api/renewals - Get due_soon + expired subscriptions
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const today = getToday();

  try {
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const soonDate = soon.toISOString().split('T')[0];

    const result = await db
      .prepare(
        `SELECT s.*, c.name as customer_name, c.phone_primary, c.email as customer_email,
                st.name as service_name
         FROM subscriptions s
         JOIN customers c ON s.customer_id = c.id
         JOIN service_types st ON s.service_type_id = st.id
         WHERE s.end_date <= ? OR s.status = 'review'
         ORDER BY s.end_date ASC`
      )
      .bind(soonDate)
      .all();

    // Recalculate status
    const subs = (result.results || []).map((s: any) => {
      const end = new Date(s.end_date);
      const todayDate = new Date(today);
      const diff = (end.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24);
      let status = s.status;
      if (s.status !== 'review') {
        status = diff < 0 ? 'expired' : diff <= 30 ? 'due_soon' : 'active';
      }
      return { ...s, status };
    });

    return json(subs);
  } catch (e: any) {
    return error('Failed to fetch renewals: ' + e.message, 500);
  }
};

// POST /api/renewals - Renew a subscription
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

  try {
    const body = (await context.request.json()) as { subscription_id?: number };

    if (!body.subscription_id) return error('Subscription ID is required');

    const sub = await db
      .prepare('SELECT * FROM subscriptions WHERE id = ?')
      .bind(body.subscription_id)
      .first<any>();

    if (!sub) return error('Subscription not found', 404);

    const oldEndDate = sub.end_date;

    // Add 365 days from end_date (or from today if expired)
    const baseDate = new Date(oldEndDate);
    const today = new Date(getToday());
    const startFrom = baseDate < today ? today : baseDate;
    startFrom.setDate(startFrom.getDate() + 365);
    const newEndDate = startFrom.toISOString().split('T')[0];

    // Update subscription
    await db
      .prepare(`UPDATE subscriptions SET end_date = ?, status = 'active', updated_at = datetime('now') WHERE id = ?`)
      .bind(newEndDate, body.subscription_id)
      .run();

    // Log renewal
    await db
      .prepare(
        `INSERT INTO renewal_logs (subscription_id, old_end_date, new_end_date, renewed_by)
         VALUES (?, ?, ?, ?)`
      )
      .bind(body.subscription_id, oldEndDate, newEndDate, auth.username || 'admin')
      .run();

    return json({ message: 'Subscription renewed', old_end_date: oldEndDate, new_end_date: newEndDate });
  } catch (e: any) {
    return error('Failed to renew: ' + e.message, 500);
  }
};
