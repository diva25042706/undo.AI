// ============================================================================
// UNDO.AI — RESEND EMAIL DELIVERY STATUS QUERY (Serverless)
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// ============================================================================

import { Resend } from 'resend';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { emailId } = req.query;
  const resendApiKey = process.env.RESEND_API_KEY || '';

  if (!emailId) {
    return res.status(400).json({ error: 'emailId query parameter is required' });
  }

  if (!resendApiKey || resendApiKey.includes('your_api_key')) {
    return res.status(200).json({
      success: false,
      status: 'EMAIL_PROVIDER_NOT_CONFIGURED',
      stage: 'ENVIRONMENT_ERROR',
      email_id: emailId,
      error: 'RESEND_API_KEY not configured.',
    });
  }

  try {
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.get(emailId);

    if (error || !data) {
      return res.status(200).json({
        success: false,
        email_id: emailId,
        status: 'EMAIL_FAILED',
        error: error?.message || 'Failed to fetch status from Resend',
        raw_response: error,
      });
    }

    const lastEvent = (data.last_event || 'accepted').toLowerCase();
    let mappedStatus = 'EMAIL_ACCEPTED';
    let stageLabel = 'C. EMAIL ACCEPTED';

    if (lastEvent === 'delivered') {
      mappedStatus = 'EMAIL_DELIVERED';
      stageLabel = 'D. EMAIL DELIVERED';
    } else if (lastEvent === 'delivery_delayed') {
      mappedStatus = 'EMAIL_DELIVERY_DELAYED';
      stageLabel = 'G. EMAIL DELIVERY DELAYED';
    } else if (lastEvent === 'bounced') {
      mappedStatus = 'EMAIL_BOUNCED';
      stageLabel = 'E. EMAIL BOUNCED';
    } else if (lastEvent === 'suppressed') {
      mappedStatus = 'EMAIL_SUPPRESSED';
      stageLabel = 'F. EMAIL SUPPRESSED';
    } else if (lastEvent === 'complained') {
      mappedStatus = 'EMAIL_COMPLAINED';
      stageLabel = 'EMAIL COMPLAINED';
    }

    return res.status(200).json({
      success: true,
      email_id: emailId,
      status: mappedStatus,
      stage_label: stageLabel,
      last_event: lastEvent,
      recipient: data.to?.[0],
      sender: data.from,
      subject: data.subject,
      created_at: data.created_at,
      raw_response: data,
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      email_id: emailId,
      status: 'EMAIL_FAILED',
      error: err.message || 'Internal error checking email delivery status',
    });
  }
}
