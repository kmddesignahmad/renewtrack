import { json, error, requireAuth, getToday } from '../../lib';
import type { Env } from '../../lib';

// GET /api/dashboard
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const today = getToday();

  try {
    // Calculate date 30 days from now
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const soonDate = soon.toISOString().split('T')[0];

    const totalCustomers = await db.prepare('SELECT COUNT(*) as count FROM customers').first<{ count: number }>();
    const activeCount = await db
      .prepare('SELECT COUNT(*) as count FROM subscriptions WHERE end_date >= ?')
      .bind(today)
      .first<{ count: number }>();
    const dueSoonCount = await db
      .prepare('SELECT COUNT(*) as count FROM subscriptions WHERE end_date >= ? AND end_date <= ?')
      .bind(today, soonDate)
      .first<{ count: number }>();
    const expiredCount = await db
      .prepare('SELECT COUNT(*) as count FROM subscriptions WHERE end_date < ?')
      .bind(today)
      .first<{ count: number }>();

    const recentRenewals = await db
      .prepare(
        `SELECT rl.*, s.domain_or_service, c.name as customer_name, st.name as service_name
         FROM renewal_logs rl
         JOIN subscriptions s ON rl.subscription_id = s.id
         JOIN customers c ON s.customer_id = c.id
         JOIN service_types st ON s.service_type_id = st.id
         ORDER BY rl.renewed_at DESC LIMIT 10`
      )
      .all();

    return json({
      total_customers: totalCustomers?.count || 0,
      active_subscriptions: activeCount?.count || 0,
      due_soon: dueSoonCount?.count || 0,
      expired: expiredCount?.count || 0,
      recent_renewals: recentRenewals.results || [],
    });
  } catch (e: any) {
    return error('Dashboard error: ' + e.message, 500);
  }
};
