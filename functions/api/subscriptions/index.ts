import { json, error, requireAuth, getToday } from '../../lib';
import type { Env } from '../../lib';

function calcStatus(endDate: string): string {
  const today = new Date(getToday());
  const end = new Date(endDate);
  const diff = (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'expired';
  if (diff <= 30) return 'due_soon';
  return 'active';
}

// GET /api/subscriptions
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

  try {
    const result = await db
      .prepare(
        `SELECT s.*, c.name as customer_name, c.phone_primary, c.email as customer_email,
                st.name as service_name
         FROM subscriptions s
         JOIN customers c ON s.customer_id = c.id
         JOIN service_types st ON s.service_type_id = st.id
         ORDER BY s.end_date ASC`
      )
      .all();

    // Recalculate status for each
    const subs = (result.results || []).map((s: any) => ({
      ...s,
      status: calcStatus(s.end_date),
    }));

    return json(subs);
  } catch (e: any) {
    return error('Failed to fetch subscriptions: ' + e.message, 500);
  }
};

// POST /api/subscriptions
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

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

    if (!body.customer_id) return error('Customer is required');
    if (!body.service_type_id) return error('Service type is required');
    if (!body.domain_or_service?.trim()) return error('Domain/Service name is required');
    if (!body.end_date) return error('End date is required');

    const startDate = body.start_date || getToday();
    const status = calcStatus(body.end_date);

    const result = await db
      .prepare(
        `INSERT INTO subscriptions (customer_id, service_type_id, domain_or_service, start_date, end_date, price, currency, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        body.customer_id,
        body.service_type_id,
        body.domain_or_service.trim(),
        startDate,
        body.end_date,
        body.price || 0,
        body.currency || 'JOD',
        status,
        body.notes || ''
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
      .bind(result.meta.last_row_id)
      .first();

    return json(sub, 201);
  } catch (e: any) {
    return error('Failed to create subscription: ' + e.message, 500);
  }
};
