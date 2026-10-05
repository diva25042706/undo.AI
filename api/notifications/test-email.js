// ============================================================================
// UNDO.AI — RESEND EMAIL DELIVERY DIAGNOSTIC TEST ENDPOINT (Serverless)
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// ============================================================================

import { Resend } from 'resend';

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const resendApiKey = process.env.RESEND_API_KEY || '';
  const emailFrom = process.env.EMAIL_FROM || 'UNDO.AI Recovery <onboarding@resend.dev>';
  const defaultRecipient = process.env.RECOVERY_NOTIFICATION_EMAIL || 'divakaranperumal27@gmail.com';
  const defaultName = process.env.RECOVERY_NOTIFICATION_NAME || 'Divakaran';

  const recipient = body.recipient || body.email || defaultRecipient;
  const customerName = body.customerName || defaultName;

  if (!isValidEmail(recipient)) {
    return res.status(400).json({
      success: false,
      stage: 'INVALID_RECIPIENT',
      stage_label: 'E. INVALID RECIPIENT EMAIL',
      status: 'EMAIL_FAILED',
      recipient,
      error: `Invalid email address format: "${recipient}".`,
    });
  }

  if (!resendApiKey || resendApiKey.includes('your_api_key')) {
    return res.status(200).json({
      success: false,
      stage: 'ENVIRONMENT_ERROR',
      stage_label: 'A. ENVIRONMENT ERROR',
      status: 'EMAIL_PROVIDER_NOT_CONFIGURED',
      recipient,
      customer_name: customerName,
      error: 'RESEND_API_KEY is not configured in environment variables. Set RESEND_API_KEY in Vercel or .env.',
      diagnostic_tip: 'Get a free key at https://resend.com/api-keys and configure RESEND_API_KEY.',
    });
  }

  const testSubject = 'UNDO.AI Email Delivery Test';
  const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${testSubject}</title>
</head>
<body style="margin: 0; padding: 30px; background-color: #0f172a; font-family: sans-serif; color: #f8fafc;">
  <table style="max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 28px; border: 1px solid #334155;">
    <tr>
      <td>
        <h2 style="color: #6366f1; margin-top: 0;">UNDO.AI Email Delivery Test</h2>
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>This is a real email delivery test from <strong>UNDO.AI Transactional Recovery Engine</strong>.</p>
        <p style="background: #064e3b; color: #6ee7b7; padding: 12px; border-radius: 8px; font-weight: bold;">
          ✓ If you received this message, the Resend integration is working correctly.
        </p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #334155; padding-top: 12px;">
          Timestamp: ${new Date().toISOString()}<br>
          Recipient: ${recipient}<br>
          Sender: ${emailFrom}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
  const testText = `Hello ${customerName},

This is a real email delivery test from UNDO.AI.

If you received this message, the Resend integration is working correctly.

Regards,
UNDO.AI
`;

  try {
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [recipient],
      subject: testSubject,
      html: testHtml,
      text: testText,
    });

    if (error || !data?.id) {
      const errMsg = error?.message || 'Failed to dispatch email via Resend';
      return res.status(200).json({
        success: false,
        stage: 'RESEND_API_ERROR',
        stage_label: 'B. RESEND API ERROR',
        status: 'EMAIL_FAILED',
        recipient,
        customer_name: customerName,
        error: errMsg,
        raw_response: error,
        diagnostic_tip: errMsg.includes('testing emails')
          ? 'Resend Free Tier with onboarding@resend.dev only allows sending to your registered Resend account email address.'
          : 'Check your RESEND_API_KEY in Resend dashboard.',
      });
    }

    return res.status(200).json({
      success: true,
      stage: 'EMAIL_ACCEPTED',
      stage_label: 'C. EMAIL ACCEPTED',
      status: 'EMAIL_ACCEPTED',
      email_id: data.id,
      recipient,
      customer_name: customerName,
      sender: emailFrom,
      subject: testSubject,
      timestamp: new Date().toISOString(),
      raw_response: data,
      message: `Email accepted by Resend with ID: ${data.id}.`,
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      stage: 'RESEND_API_ERROR',
      stage_label: 'B. RESEND API NETWORK ERROR',
      status: 'EMAIL_FAILED',
      recipient,
      customer_name: customerName,
      error: err.message || 'Internal error dispatching email via Resend',
      raw_response: null,
    });
  }
}
