// ============================================================================
// UNDO.AI — GLM / ZHIPU AI SERVERLESS PLANNER ENDPOINT (Vercel)
// BUILDATHON 2026 AG02: The Agent With An Undo Button
// ============================================================================

function parseNaturalLanguagePlan(prompt, customerOverride) {
  const lower = (prompt || '').toLowerCase();

  let workflow_type = 'hotel_booking';
  let intent = 'Hotel room reservation';
  let parameters = {};
  let requested_steps = [];

  if (
    lower.includes('cab') ||
    lower.includes('ride') ||
    lower.includes('taxi') ||
    lower.includes('driver') ||
    lower.includes('drop') ||
    lower.includes('pickup') ||
    lower.includes('omr') ||
    lower.includes('sholinganallur')
  ) {
    workflow_type = 'cab_booking';
    intent = 'Urban Cab / Ride Dispatch & Booking';

    let pickup = 'Thiruvanmiyur';
    let drop = 'Sholinganallur';

    if (lower.includes('from ')) {
      const fromPart = prompt.split(/from /i)[1]?.split(/ to | for | with |$/i)[0]?.trim();
      if (fromPart) pickup = fromPart;
    }
    if (lower.includes('to ')) {
      const toPart = prompt.split(/ to /i)[1]?.split(/ for | with | from |$/i)[0]?.trim();
      if (toPart) drop = toPart;
    }

    parameters = {
      pickup,
      drop,
      fare: 420.0,
      currency: 'INR',
      driverName: 'Murugan K',
      driverId: 'DRV-CHN-1042',
      cabNumber: 'TN-09-AX-4491',
    };
    requested_steps = ['request_ride', 'assign_driver', 'reserve_cab', 'charge_fare', 'dispatch_otp'];
  } else if (
    lower.includes('deliver') ||
    lower.includes('parcel') ||
    lower.includes('courier') ||
    lower.includes('tambaram') ||
    lower.includes('package')
  ) {
    workflow_type = 'delivery';
    intent = 'Autonomous Parcel Delivery & Logistics Dispatch';

    parameters = {
      pickup: 'Tambaram Central Hub',
      drop: 'Chromepet',
      fare: 350.0,
      currency: 'INR',
      manifestId: 'DEL-CHN-7701',
      driver: 'Ravi S (Courier #44)',
      vehicle: 'Logistics Van #04',
      parcelId: 'PKG-CHN-8821',
    };
    requested_steps = ['create_delivery', 'assign_courier', 'reserve_vehicle', 'dispatch_package', 'notify_customer'];
  } else if (
    lower.includes('order') ||
    lower.includes('buy') ||
    lower.includes('purchase') ||
    lower.includes('ecommerce') ||
    lower.includes('laptop') ||
    lower.includes('product')
  ) {
    workflow_type = 'ecommerce_order';
    intent = 'E-Commerce Order Fulfillment & Delivery';

    let item = 'AI Dev Workstation Laptop';
    if (lower.includes('laptop')) item = 'AI Dev Workstation Laptop (32GB / RTX 4090)';
    else if (lower.includes('gpu') || lower.includes('server')) item = 'Deep Learning Inference Server';

    parameters = {
      item,
      productName: item,
      price: 85000.0,
      currency: 'INR',
      warehouse: 'Velachery Central Hub',
      deliveryArea: 'Anna Nagar',
    };
    requested_steps = ['check_stock', 'reserve_inventory', 'process_order_payment', 'create_shipment', 'send_order_confirmation'];
  } else if (
    lower.includes('support') ||
    lower.includes('ticket') ||
    lower.includes('dispute') ||
    lower.includes('refund request') ||
    lower.includes('credit') ||
    lower.includes('escalat')
  ) {
    workflow_type = 'support_ticket';
    intent = 'Customer Support SLA Escalation & Goodwill Credit';

    parameters = {
      issue: 'Billing Dispute & SLA Escalation',
      issueType: 'Billing Dispute & SLA Escalation',
      creditAmount: 500.0,
      currency: 'INR',
      agentName: 'Sarah Jenkins (Senior Specialist)',
      priority: 'HIGH_VIP',
    };
    requested_steps = ['fetch_ticket', 'classify_intent', 'issue_goodwill_credit', 'assign_specialist', 'send_resolution_email'];
  } else {
    workflow_type = 'hotel_booking';
    intent = 'Luxury Hotel Room Reservation';

    let location = 'Nungambakkam';
    if (lower.includes('in ')) {
      const inPart = prompt.split(/in /i)[1]?.split(/ for | with |$/i)[0]?.trim();
      if (inPart) location = inPart;
    }

    const room_type = lower.includes('presidential')
      ? 'Presidential Suite'
      : lower.includes('executive')
      ? 'Executive Suite'
      : 'Deluxe Room (Room 101)';

    parameters = {
      location,
      hotelName: 'The Leela Palace Chennai',
      roomType: room_type,
      roomPrice: 750.0,
      currency: 'USD',
    };
    requested_steps = ['search_room', 'reserve_room', 'charge_card', 'send_confirmation'];
  }

  let customerName = customerOverride?.name || 'Divakaran';
  const customerEmail = customerOverride?.email || 'divakaranperumal27@gmail.com';

  if (lower.includes('for ')) {
    const forPart = prompt.split(/for /i)[1]?.split(/ with | to | from | in |$/i)[0]?.trim();
    if (forPart && forPart.length > 1 && !forPart.includes('@') && !forPart.includes('night')) {
      customerName = forPart;
    }
  }

  return {
    workflow_type,
    intent,
    customer: {
      name: customerName,
      email: customerEmail,
      phone: '+91 98400 12345',
    },
    parameters,
    requested_steps,
  };
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
  const prompt = body.prompt || 'Book a cab from Thiruvanmiyur to Sholinganallur for Divakaran';

  const glmApiKey = process.env.GLM_API_KEY || '';
  const glmBaseUrl = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
  const glmModel = process.env.GLM_MODEL || 'glm-5.3';
  const hasKey = !!glmApiKey && !glmApiKey.includes('your_api_key');

  let aiPlan = null;
  let isFallback = true;

  if (hasKey) {
    try {
      const systemPrompt = `You are the AI Planning Layer for UNDO.AI, a transactional Saga execution engine.
Your role is to interpret natural language requests and extract structured workflow plans.
You do NOT execute tools, you do NOT decide compensations or refunds.
You must return valid JSON matching this schema exactly:
{
  "workflow_type": "cab_booking" | "hotel_booking" | "ecommerce_order" | "customer_support",
  "intent": string,
  "customer": {
    "name": string,
    "email": string,
    "phone": string
  },
  "parameters": {
    "pickup"?: string,
    "drop"?: string,
    "fare"?: number,
    "location"?: string,
    "hotelName"?: string,
    "roomType"?: string,
    "roomPrice"?: number,
    "productName"?: string,
    "price"?: number,
    "currency"?: string
  },
  "requested_steps": string[]
}
Return ONLY raw JSON, no markdown fences, no explanatory text.`;

      const glmResponse = await fetch(`${glmBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${glmApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: glmModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
        }),
      });

      const glmData = await glmResponse.json();
      const rawContent = glmData?.choices?.[0]?.message?.content || '';

      if (rawContent) {
        const cleaned = rawContent.replace(/```json|```/g, '').trim();
        aiPlan = JSON.parse(cleaned);
        isFallback = false;
      }
    } catch (err) {
      isFallback = true;
    }
  }

  if (!aiPlan) {
    aiPlan = parseNaturalLanguagePlan(prompt, body.customer);
    isFallback = true;
  }

  return res.status(200).json({
    success: true,
    model: glmModel,
    provider: hasKey && !isFallback ? 'GLM BigModel API' : 'Zhipu AI (Deterministic Local Fallback Engine)',
    is_fallback: isFallback,
    configured: hasKey,
    plan: aiPlan,
    timestamp: new Date().toISOString(),
  });
}
