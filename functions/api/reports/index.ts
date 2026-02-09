import { json, error, requireAuth, hashPassword, getToday } from '../_lib';
import type { Env } from '../_lib';

// POST /api/reports - Get reports (requires password re-verification)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

  try {
    const body = (await context.request.json()) as { password?: string; report_type?: string };

    if (!body.password) return error('Password is required to access reports');

    // Verify password against admin
    const hash = await hashPassword(body.password);
    const user = await db
      .prepare('SELECT id FROM users WHERE username = ? AND password_hash = ?')
      .bind(auth.username, hash)
      .first();

    if (!user) return error('Invalid password', 401);

    const today = getToday();
    const thisYear = today.split('-')[0];
    const thisMonth = today.split('-')[1];

    // Summary stats
    const totalCustomers = await db.prepare('SELECT COUNT(*) as count FROM customers').first<{ count: number }>();
    const totalSubs = await db.prepare('SELECT COUNT(*) as count FROM subscriptions').first<{ count: number }>();
    const activeSubs = await db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE end_date >= ?').bind(today).first<{ count: number }>();

    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const soonDate = soon.toISOString().split('T')[0];
    const dueSoonCount = await db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE end_date >= ? AND end_date <= ?').bind(today, soonDate).first<{ count: number }>();
    const expiredCount = await db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE end_date < ?').bind(today).first<{ count: number }>();

    // Revenue stats
    const totalRevenue = await db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM subscriptions').first<{ total: number }>();
    const activeRevenue = await db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM subscriptions WHERE end_date >= ?').bind(today).first<{ total: number }>();

    // Monthly breakdown for current year
    const monthlyData = await db
      .prepare(
        `SELECT
           substr(end_date, 6, 2) as month,
           COUNT(*) as count,
           COALESCE(SUM(price), 0) as revenue
         FROM subscriptions
         WHERE substr(end_date, 1, 4) = ?
         GROUP BY substr(end_date, 6, 2)
         ORDER BY month`
      )
      .bind(thisYear)
      .all();

    // Yearly breakdown
    const yearlyData = await db
      .prepare(
        `SELECT
           substr(end_date, 1, 4) as year,
           COUNT(*) as count,
           COALESCE(SUM(price), 0) as revenue
         FROM subscriptions
         GROUP BY substr(end_date, 1, 4)
         ORDER BY year DESC`
      )
      .all();

    // Top customers by subscription count
    const topCustomers = await db
      .prepare(
        `SELECT c.name, COUNT(s.id) as sub_count, COALESCE(SUM(s.price), 0) as total_revenue
         FROM customers c
         JOIN subscriptions s ON c.id = s.customer_id
         GROUP BY c.id
         ORDER BY total_revenue DESC
         LIMIT 10`
      )
      .all();

    // Service breakdown
    const serviceBreakdown = await db
      .prepare(
        `SELECT st.name, COUNT(s.id) as count, COALESCE(SUM(s.price), 0) as revenue
         FROM service_types st
         JOIN subscriptions s ON st.id = s.service_type_id
         GROUP BY st.id
         ORDER BY count DESC`
      )
      .all();

    // Recent renewals (last 30)
    const recentRenewals = await db
      .prepare(
        `SELECT rl.*, s.domain_or_service, c.name as customer_name, st.name as service_name
         FROM renewal_logs rl
         JOIN subscriptions s ON rl.subscription_id = s.id
         JOIN customers c ON s.customer_id = c.id
         JOIN service_types st ON s.service_type_id = st.id
         ORDER BY rl.renewed_at DESC LIMIT 30`
      )
      .all();

    return json({
      verified: true,
      summary: {
        total_customers: totalCustomers?.count || 0,
        total_subscriptions: totalSubs?.count || 0,
        active_subscriptions: activeSubs?.count || 0,
        due_soon: dueSoonCount?.count || 0,
        expired: expiredCount?.count || 0,
        total_revenue: totalRevenue?.total || 0,
        active_revenue: activeRevenue?.total || 0,
      },
      monthly: monthlyData.results || [],
      yearly: yearlyData.results || [],
      top_customers: topCustomers.results || [],
      service_breakdown: serviceBreakdown.results || [],
      recent_renewals: recentRenewals.results || [],
      current_year: thisYear,
    });
  } catch (e: any) {
    return error('Failed to generate reports: ' + e.message, 500);
  }
};
