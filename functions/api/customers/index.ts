import { json, error, requireAuth } from '../../lib';
import type { Env } from '../../lib';

// GET /api/customers
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

  try {
    const result = await db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
    return json(result.results || []);
  } catch (e: any) {
    return error('Failed to fetch customers: ' + e.message, 500);
  }
};

// POST /api/customers
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;

  try {
    const body = (await context.request.json()) as {
      name?: string;
      phone_primary?: string;
      phone_secondary?: string;
      email?: string;
      notes?: string;
    };

    if (!body.name || !body.name.trim()) {
      return error('Customer name is required');
    }

    const result = await db
      .prepare(
        `INSERT INTO customers (name, phone_primary, phone_secondary, email, notes)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        body.name.trim(),
        body.phone_primary || '',
        body.phone_secondary || '',
        body.email || '',
        body.notes || ''
      )
      .run();

    const customer = await db
      .prepare('SELECT * FROM customers WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    return json(customer, 201);
  } catch (e: any) {
    return error('Failed to create customer: ' + e.message, 500);
  }
};
