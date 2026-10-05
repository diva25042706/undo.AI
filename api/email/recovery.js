import * as fs from 'fs';
import * as path from 'path';

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const config = getEnvConfig();
  const body = req.body || {};
  const workflowId = body.workflowId || 'WF-CAB-CHN-001';
  const customerName = body.customerName || config.recipientName;
  const recipient = body.recipient || body.email || config.recipientEmail;
  const refundAmount = body.fare || body.refundAmount || 420;

  if (!config.resendApiKey || config.resendApiKey.includes('your_api_key')) {
    return res.status(200).json({
      success: false,
      status: 'EMAIL_PROVIDER_NOT_CONFIGURED',
      stage: 'ENVIRONMENT_ERROR',
      error: 'RESEND_API_KEY is not configured.',
    });
  }

  const subject = `UNDO.AI — Transaction Successfully Reversed (${workflowId})`;
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:32px 16px;background:#0f172a;font-family:sans-serif;color:#f8fafc;">
  <div style="max-width:580px;margin:0 auto;background:#1e293b;border-radius:18px;padding:28px;border:1px solid #334155;">
    <h1 style="margin:0 0 12px 0;font-size:22px;color:#ffffff;">UNDO.AI Recovery Engine</h1>
    <p>Hello <strong>${customerName}</strong>,</p>
    <p>Your transaction has been successfully reversed by UNDO.AI.</p>
    <div style="background:#0f172a;padding:16px;border-radius:12px;margin:16px 0;">
      <div><strong>Workflow ID:</strong> ${workflowId}</div>
      <div><strong>Refund Settled:</strong> ₹${refundAmount}</div>
      <div><strong>Recovery Status:</strong> FULLY RESTORED ✓</div>
    </div>
    <p style="font-size:12px;color:#94a3b8;">Timestamp: ${new Date().toISOString()}</p>
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
        subject,
        html,
      }),
    });

    const resendData = await resendRes.json();
    if (resendRes.ok && resendData.id) {
      return res.status(200).json({
        success: true,
        workflow_id: workflowId,
        email: {
          recipient,
          customer_name: customerName,
          status: 'EMAIL_ACCEPTED',
          stage: 'EMAIL_ACCEPTED',
          email_id: resendData.id,
          timestamp: new Date().toISOString(),
          raw_response: resendData,
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        workflow_id: workflowId,
        email: {
          recipient,
          customer_name: customerName,
          status: 'EMAIL_FAILED',
          stage: 'RESEND_API_ERROR',
          error: resendData.message || `Resend Error (${resendRes.status})`,
          raw_response: resendData,
        },
      });
    }
  } catch (err) {
    return res.status(200).json({
      success: false,
      workflow_id: workflowId,
      email: {
        recipient,
        customer_name: customerName,
        status: 'EMAIL_FAILED',
        error: err.message || 'Network error reaching Resend',
      },
    });
  }
}
