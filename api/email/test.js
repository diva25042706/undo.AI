import * as fs from 'fs';
import * as path from 'path';

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getEnvConfig() {
  let resendApiKey = process.env.RESEND_API_KEY || '';
  let emailFrom = process.env.EMAIL_FROM || 'UNDO.AI Recovery <onboarding@resend.dev>';
  let recipientEmail = process.env.RECOVERY_NOTIFICATION_EMAIL || 'divakaranperumal27@gmail.com';
  let recipientName = process.env.RECOVERY_NOTIFICATION_NAME || 'Divakaran';

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
          if (key.trim() === 'RESEND_API_KEY' && val && !val.includes('your_api_key')) resendApiKey = val;
          if (key.trim() === 'EMAIL_FROM' && val) emailFrom = val;
          if (key.trim() === 'RECOVERY_NOTIFICATION_EMAIL' && val) recipientEmail = val;
          if (key.trim() === 'RECOVERY_NOTIFICATION_NAME' && val) recipientName = val;
        }
      });
    }
  } catch {}

  return { resendApiKey, emailFrom, recipientEmail, recipientName };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const config = getEnvConfig();
  const body = req.body || {};
  const recipient = body.to || body.recipient || body.email || config.recipientEmail;
  const customerName = body.customerName || body.customer_name || config.recipientName;

  if (!isValidEmail(recipient)) {
    return res.status(200).json({
      success: false,
      status: 'EMAIL_FAILED',
      stage: 'INVALID_RECIPIENT',
      stage_label: 'E. INVALID RECIPIENT EMAIL',
      recipient,
      customer_name: customerName,
      error: `Invalid email address format: "${recipient}".`,
    });
  }

  if (!config.resendApiKey || config.resendApiKey.includes('your_api_key')) {
    return res.status(200).json({
      success: false,
      status: 'EMAIL_PROVIDER_NOT_CONFIGURED',
      stage: 'ENVIRONMENT_ERROR',
      stage_label: 'A. ENVIRONMENT ERROR (MISSING RESEND_API_KEY)',
      errorCode: 'RESEND_API_KEY_MISSING',
      recipient,
      customer_name: customerName,
      error: 'RESEND_API_KEY is not configured in .env.',
      diagnostic_tip: 'Create a free key at https://resend.com/api-keys and paste it into your .env file.',
    });
  }

  const testSubject = 'UNDO.AI Email Delivery Test';
  const testHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${testSubject}</title></head>
<body style="margin:0;padding:32px;background:#0f172a;font-family:sans-serif;color:#f8fafc;">
  <div style="max-width:540px;margin:0 auto;background:#1e293b;border-radius:16px;padding:28px;border:1px solid #334155;">
    <h2 style="color:#6366f1;margin-top:0;">UNDO.AI Email Delivery Test</h2>
    <p>Hello <strong>${customerName}</strong>,</p>
    <p>This is a real email delivery test from <strong>UNDO.AI Transactional Recovery Engine</strong>.</p>
    <div style="background:#064e3b;color:#6ee7b7;padding:12px;border-radius:8px;font-weight:bold;margin:16px 0;">
      ✓ Resend REST API integration is active and confirmed.
    </div>
    <div style="font-size:12px;color:#94a3b8;border-top:1px solid #334155;padding-top:12px;">
      Recipient: ${recipient}<br>
      Sender: ${config.emailFrom}<br>
      Time: ${new Date().toISOString()}
    </div>
  </div>
</body></html>`;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to: [recipient],
        subject: testSubject,
        html: testHtml,
      }),
    });

    const resendData = await resendRes.json();
    if (resendRes.ok && resendData.id) {
      return res.status(200).json({
        success: true,
        status: 'EMAIL_ACCEPTED',
        stage: 'EMAIL_ACCEPTED',
        stage_label: 'C. EMAIL ACCEPTED',
        emailId: resendData.id,
        email_id: resendData.id,
        recipient,
        customer_name: customerName,
        sender: config.emailFrom,
        subject: testSubject,
        timestamp: new Date().toISOString(),
        raw_response: resendData,
      });
    } else {
      const errMsg = resendData.message || resendData.error?.message || `Resend HTTP ${resendRes.status}`;
      return res.status(200).json({
        success: false,
        status: 'EMAIL_FAILED',
        stage: 'RESEND_API_ERROR',
        stage_label: 'B. RESEND API ERROR',
        recipient,
        customer_name: customerName,
        error: errMsg,
        raw_response: resendData,
      });
    }
  } catch (err) {
    return res.status(200).json({
      success: false,
      status: 'EMAIL_FAILED',
      stage: 'RESEND_API_ERROR',
      stage_label: 'B. RESEND API NETWORK ERROR',
      recipient,
      customer_name: customerName,
      error: err.message || 'Network error reaching Resend',
    });
  }
}
