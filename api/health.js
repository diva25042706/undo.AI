export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const resendApiKey = process.env.RESEND_API_KEY || '';
  const hasKey = !!resendApiKey && !resendApiKey.includes('your_api_key');

  return res.status(200).json({
    status: 'ok',
    engine: 'online',
    resendConfigured: hasKey,
    workflowEngine: true,
    durableLog: true,
    compensationEngine: true,
    stateVerifier: true,
    timestamp: new Date().toISOString(),
  });
}
