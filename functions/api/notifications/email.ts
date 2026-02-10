import { json, error, requireAuth, getToday } from '../_lib';
import type { Env } from '../_lib';

// POST /api/notifications/email - Send email digest to admin
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = requireAuth(context.request);
  if (!auth.valid) return error('Unauthorized', 401);

  const db = context.env.DB;
  const RESEND_API_KEY = context.env.RESEND_API_KEY;
  const ADMIN_EMAIL = context.env.ADMIN_EMAIL;

  if (!RESEND_API_KEY) return error('Resend API key not configured. Add RESEND_API_KEY in Cloudflare Pages settings.', 500);
  if (!ADMIN_EMAIL) return error('Admin email not configured. Add ADMIN_EMAIL in Cloudflare Pages settings.', 500);

  const today = getToday();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const soonDate = soon.toISOString().split('T')[0];

  try {
    // Get subscriptions needing attention
    const alerts = await db
      .prepare(
        `SELECT s.*, c.name as customer_name, c.phone_primary, c.email as customer_email,
                st.name as service_name
         FROM subscriptions s
         JOIN customers c ON s.customer_id = c.id
         JOIN service_types st ON s.service_type_id = st.id
         WHERE s.end_date <= ?
         ORDER BY s.end_date ASC`
      )
      .bind(soonDate)
      .all();

    const subs = alerts.results || [];

    if (subs.length === 0) {
      return json({ message: 'No subscriptions need attention. No email sent.' });
    }

    // Build email HTML
    const expired = subs.filter((s: any) => s.end_date < today);
    const dueSoon = subs.filter((s: any) => s.end_date >= today);

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0; font-size: 20px;">🔔 RenewTrack - Renewal Alert</h1>
          <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">Date: ${today}</p>
        </div>
        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
    `;

    if (expired.length > 0) {
      html += `<h2 style="color: #dc2626; font-size: 16px; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">❌ Expired (${expired.length})</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr style="background: #fef2f2;">
            <th style="text-align: left; padding: 8px; border: 1px solid #fecaca;">Customer</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #fecaca;">Service</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #fecaca;">Domain</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #fecaca;">End Date</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #fecaca;">Price</th>
          </tr>`;
      for (const s of expired as any[]) {
        html += `<tr>
            <td style="padding: 8px; border: 1px solid #fecaca;">${s.customer_name}</td>
            <td style="padding: 8px; border: 1px solid #fecaca;">${s.service_name}</td>
            <td style="padding: 8px; border: 1px solid #fecaca;">${s.domain_or_service}</td>
            <td style="padding: 8px; border: 1px solid #fecaca; color: #dc2626; font-weight: bold;">${s.end_date}</td>
            <td style="padding: 8px; border: 1px solid #fecaca;">${s.price} ${s.currency}</td>
          </tr>`;
      }
      html += '</table>';
    }

    if (dueSoon.length > 0) {
      html += `<h2 style="color: #d97706; font-size: 16px; border-bottom: 2px solid #d97706; padding-bottom: 8px;">⏰ Due Soon (${dueSoon.length})</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr style="background: #fffbeb;">
            <th style="text-align: left; padding: 8px; border: 1px solid #fde68a;">Customer</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #fde68a;">Service</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #fde68a;">Domain</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #fde68a;">End Date</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #fde68a;">Price</th>
          </tr>`;
      for (const s of dueSoon as any[]) {
        html += `<tr>
            <td style="padding: 8px; border: 1px solid #fde68a;">${s.customer_name}</td>
            <td style="padding: 8px; border: 1px solid #fde68a;">${s.service_name}</td>
            <td style="padding: 8px; border: 1px solid #fde68a;">${s.domain_or_service}</td>
            <td style="padding: 8px; border: 1px solid #fde68a; color: #d97706; font-weight: bold;">${s.end_date}</td>
            <td style="padding: 8px; border: 1px solid #fde68a;">${s.price} ${s.currency}</td>
          </tr>`;
      }
      html += '</table>';
    }

    html += `
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            This is an automated notification from RenewTrack.<br>
            Digital Creative Vision For Information Technology | Jordan – Amman
          </p>
        </div>
      </div>`;

    // Send via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RenewTrack <notify@dcv.jo>',
        to: [ADMIN_EMAIL],
        subject: `🔔 RenewTrack Alert: ${expired.length} expired, ${dueSoon.length} due soon`,
        html: html,
      }),
    });

    const emailResult = await emailRes.json();

    if (!emailRes.ok) {
      return error('Failed to send email: ' + JSON.stringify(emailResult), 500);
    }

    // Log the email send
    await db
      .prepare(
        `INSERT INTO notifications (id, type, title, message, is_read, created_at)
         VALUES (?, 'email_sent', ?, ?, 1, datetime('now'))`
      )
      .bind(
        'email_' + Date.now(),
        `Email sent to ${ADMIN_EMAIL}`,
        `${expired.length} expired, ${dueSoon.length} due soon`
      )
      .run();

    return json({
      message: `Email sent successfully to ${ADMIN_EMAIL}`,
      expired_count: expired.length,
      due_soon_count: dueSoon.length,
    });
  } catch (e: any) {
    return error('Failed to send email: ' + e.message, 500);
  }
};
