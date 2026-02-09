import { json, error, requireAuth, generateUUID } from '../_lib';
import type { Env } from '../_lib';

// GET /api/notices - List all notices
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

  try {
    const result = await db
      .prepare('SELECT * FROM renewal_notices ORDER BY created_at DESC')
      .all();
    return json(result.results || []);
  } catch (e: any) {
    return error('Failed to fetch notices: ' + e.message, 500);
  }
};

// POST /api/notices - Create a renewal notice
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

  try {
    const body = (await context.request.json()) as { subscription_id?: number };

    if (!body.subscription_id) return error('Subscription ID is required');

    const sub = await db
      .prepare(
        `SELECT s.*, c.name as customer_name, st.name as service_name
         FROM subscriptions s
         JOIN customers c ON s.customer_id = c.id
         JOIN service_types st ON s.service_type_id = st.id
         WHERE s.id = ?`
      )
      .bind(body.subscription_id)
      .first<any>();

    if (!sub) return error('Subscription not found', 404);

    const uuid = generateUUID();

    await db
      .prepare(
        `INSERT INTO renewal_notices (uuid, subscription_id, customer_name, service_name, domain_or_service, end_date, price, currency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        uuid,
        sub.id,
        sub.customer_name,
        sub.service_name,
        sub.domain_or_service,
        sub.end_date,
        sub.price || 0,
        sub.currency || 'JOD'
      )
      .run();

    return json({ uuid, url: `/notice/${uuid}` }, 201);
  } catch (e: any) {
    return error('Failed to create notice: ' + e.message, 500);
  }
};
