import type { Env } from '../_lib';

// GET /api/notices/:uuid - Public endpoint (no auth)
export const onRequestGet: PagesFunction<Env, 'uuid'> = async (context) => {
  const db = context.env.DB;
  const uuid = context.params.uuid;

  try {
    const notice = await db
      .prepare('SELECT * FROM renewal_notices WHERE uuid = ?')
      .bind(uuid)
      .first();

    if (!notice) {
      return new Response(JSON.stringify({ error: 'Notice not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(notice), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Failed: ' + e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
