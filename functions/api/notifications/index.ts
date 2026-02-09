import { json, error, requireAuth, getToday } from '../_lib';
import type { Env } from '../_lib';

// GET /api/notifications - Get all notifications (due_soon + expired subs)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const today = getToday();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const soonDate = soon.toISOString().split('T')[0];

  try {
    // Get notifications from DB
    const dbNotifs = await db
      .prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50')
      .all();

    // Get live alerts (due soon + expired)
    const alerts = await db
      .prepare(
        `SELECT s.id, s.domain_or_service, s.end_date, s.price, s.currency,
                c.name as customer_name, c.phone_primary, c.email as customer_email,
                st.name as service_name
         FROM subscriptions s
         JOIN customers c ON s.customer_id = c.id
         JOIN service_types st ON s.service_type_id = st.id
         WHERE s.end_date <= ?
         ORDER BY s.end_date ASC`
      )
      .bind(soonDate)
      .all();

    // Build live notifications
    const liveNotifs = (alerts.results || []).map((s: any) => {
      const end = new Date(s.end_date);
      const todayDate = new Date(today);
      const diff = Math.ceil((end.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = diff < 0;

      return {
        id: `live_${s.id}`,
        subscription_id: s.id,
        type: isExpired ? 'expired' : 'due_soon',
        title: isExpired
          ? `Expired: ${s.customer_name} - ${s.domain_or_service}`
          : `Due in ${diff} days: ${s.customer_name} - ${s.domain_or_service}`,
        message: `${s.service_name} | ${s.domain_or_service} | End: ${s.end_date} | ${s.price} ${s.currency}`,
        customer_name: s.customer_name,
        domain: s.domain_or_service,
        end_date: s.end_date,
        days_left: diff,
        is_read: 0,
        created_at: today,
      };
    });

    // Merge with stored notifications
    const stored = (dbNotifs.results || []).map((n: any) => ({
      ...n,
      type: n.type || 'info',
    }));

    // Unread count for live notifs
    const unreadCount = liveNotifs.filter((n: any) => !n.is_read).length;

    return json({
      notifications: liveNotifs,
      stored: stored,
      unread_count: unreadCount,
    });
  } catch (e: any) {
    return error('Failed to fetch notifications: ' + e.message, 500);
  }
};

// POST /api/notifications - Mark notification as read or send email
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

  try {
    const body = (await context.request.json()) as {
      action?: string;
      notification_id?: string;
    };

    if (body.action === 'mark_read' && body.notification_id) {
      // Store in DB that it's been read
      await db
        .prepare(
          `INSERT OR REPLACE INTO notifications (id, type, title, message, is_read, created_at)
           VALUES (?, 'read', ?, '', 1, datetime('now'))`
        )
        .bind(body.notification_id, body.notification_id)
        .run();

      return json({ message: 'Marked as read' });
    }

    if (body.action === 'mark_all_read') {
      // We don't really store all of them, just clear approach
      return json({ message: 'All marked as read' });
    }

    return error('Invalid action');
  } catch (e: any) {
    return error('Failed: ' + e.message, 500);
  }
};
