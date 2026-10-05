export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { emailId } = req.query;
  const resendApiKey = process.env.RESEND_API_KEY || '';

  if (!resendApiKey || resendApiKey.includes('your_api_key')) {
    return res.status(200).json({
      success: false,
      status: 'EMAIL_PROVIDER_NOT_CONFIGURED',
      error: 'RESEND_API_KEY not configured.',
    });
  }

  try {
    const statusRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await statusRes.json();
    if (statusRes.ok) {
      const lastEvent = (data.last_event || 'accepted').toLowerCase();
      let status = 'EMAIL_ACCEPTED';
      if (lastEvent === 'delivered') status = 'EMAIL_DELIVERED';
      else if (lastEvent === 'delivery_delayed') status = 'EMAIL_DELIVERY_DELAYED';
      else if (lastEvent === 'bounced') status = 'EMAIL_BOUNCED';
      else if (lastEvent === 'suppressed') status = 'EMAIL_SUPPRESSED';
      else if (lastEvent === 'complained') status = 'EMAIL_COMPLAINED';

      return res.status(200).json({
        success: true,
        email_id: emailId,
        status,
        last_event: lastEvent,
        recipient: data.to?.[0],
        sender: data.from,
        subject: data.subject,
        created_at: data.created_at,
        raw_response: data,
      });
    } else {
      return res.status(200).json({
        success: false,
        email_id: emailId,
        status: 'EMAIL_FAILED',
        error: data.message || `Resend Error (${statusRes.status})`,
      });
    }
  } catch (err) {
    return res.status(200).json({
      success: false,
      email_id: emailId,
      status: 'EMAIL_FAILED',
      error: err.message || 'Failed to query Resend status',
    });
  }
}
