import { Resend } from 'resend';

const notificationStore = new Set();

function getEmailMetadata(ctx) {
  const { workflowType, customerName, transactionId, refundAmount, currency = 'USD', parameters = {} } = ctx;
  const currSym = currency === 'USD' ? '$' : '₹';
  const formattedAmount = `${currSym}${Number(refundAmount).toLocaleString('en-IN')}`;

  switch (workflowType) {
    case 'cab_booking': {
      const rideId = parameters.rideId || transactionId;
      const pickup = parameters.pickupLocation || 'Thiruvanmiyur';
      const drop = parameters.dropLocation || 'OMR One Hub';
      const driver = parameters.driverName || 'Karthik V. (DRV-CHN-1042)';
      return {
        subject: 'UNDO.AI — Ride Transaction Successfully Reversed',
        metaDetails: [
          { label: 'Ride Identifier', value: rideId },
          { label: 'Driver Allocated', value: `${driver} (Released)` },
          { label: 'Original Fare', value: formattedAmount },
          { label: 'Refund Settled', value: formattedAmount, highlight: true },
        ],
        actions: [
          `Payment fare refunded — ${formattedAmount} (Txn: ${transactionId})`,
          `Ride booking cancelled & driver returned to dispatch pool`,
          `Final system invariants verified (0 leaked driver holds)`,
          `Idempotency verified (No duplicate refund created)`,
        ],
        plainText: `Hello ${customerName},

Your Cab/Ride Booking transaction has been successfully reversed by UNDO.AI.

Ride ID: ${rideId}
Route: ${pickup} to ${drop}
Driver: ${driver} (Released)
Original Fare: ${formattedAmount}
Refund: ${formattedAmount}

Recovery actions:
✓ Payment refunded — ${formattedAmount}
✓ Ride cancelled
✓ Driver released
✓ Final state verified

Recovery Status:
FULLY RESTORED

Transaction ID: ${transactionId}
Workflow ID: ${ctx.workflowId}

Regards,
UNDO.AI
Transactional Recovery Engine
`,
      };
    }

    case 'ecommerce_order': {
      const orderId = parameters.orderId || transactionId;
      const item = parameters.productName || parameters.item || 'AI Dev Workstation Laptop';
      const warehouse = parameters.warehouseLocation || 'Velachery Central Hub';
      return {
        subject: 'UNDO.AI — E-Commerce Order Successfully Reversed',
        metaDetails: [
          { label: 'Order Identifier', value: orderId },
          { label: 'Warehouse Allocation', value: `${warehouse} (Restocked)` },
          { label: 'Original Amount', value: formattedAmount },
          { label: 'Refund Settled', value: formattedAmount, highlight: true },
        ],
        actions: [
          `Payment refunded — ${formattedAmount} (Txn: ${transactionId})`,
          `Inventory reservation released back to warehouse stock`,
          `Courier delivery manifest cancelled`,
          `Final system invariants verified (0 inventory leaks)`,
        ],
        plainText: `Hello ${customerName},

Your E-Commerce Order transaction has been successfully reversed by UNDO.AI.

Order ID: ${orderId}
Product: ${item}
Original Amount: ${formattedAmount}
Refund: ${formattedAmount}

Recovery actions:
✓ Payment refunded — ${formattedAmount}
✓ Inventory reservation released
✓ Courier manifest cancelled
✓ Final state verified

Recovery Status:
FULLY RESTORED

Transaction ID: ${transactionId}
Workflow ID: ${ctx.workflowId}

Regards,
UNDO.AI
Transactional Recovery Engine
`,
      };
    }

    case 'support_ticket': {
      const ticketId = parameters.ticketId || transactionId;
      const issue = parameters.issueType || 'Billing Inquiry Escalation';
      return {
        subject: 'UNDO.AI — Support Escalation & Credit Successfully Reversed',
        metaDetails: [
          { label: 'Ticket Issue', value: issue },
          { label: 'Resolution Credit', value: formattedAmount },
          { label: 'Refund / Reversal', value: formattedAmount, highlight: true },
        ],
        actions: [
          `Goodwill credit reversed — ${formattedAmount}`,
          `Tier-1 priority flag reset to standard queue`,
          `Customer communication ledger updated`,
          `Final system state verified`,
        ],
        plainText: `Hello ${customerName},

Your Customer Support transaction has been successfully reversed by UNDO.AI.

Ticket ID: ${ticketId}
Issue: ${issue}
Credit Reversed: ${formattedAmount}

Recovery actions:
✓ Goodwill credit reversed — ${formattedAmount}
✓ Priority escalation reset
✓ Final state verified

Recovery Status:
FULLY RESTORED

Ticket ID: ${ticketId}
Workflow ID: ${ctx.workflowId}

Regards,
UNDO.AI
Transactional Recovery Engine
`,
      };
    }

    case 'hotel_booking':
    default: {
      const hotel = parameters.hotelName || 'The Leela Palace Chennai';
      const room = parameters.roomType || 'Deluxe Room (Room 101)';
      const bookingId = parameters.bookingId || transactionId;
      return {
        subject: 'UNDO.AI — Hotel Booking Successfully Reversed',
        metaDetails: [
          { label: 'Booking Identifier', value: bookingId },
          { label: 'Room Unit', value: `${room} (Restored to AVAILABLE)` },
          { label: 'Original Charged Amount', value: formattedAmount },
          { label: 'Refund Settled', value: formattedAmount, highlight: true },
        ],
        actions: [
          `Payment refunded — ${formattedAmount} (Txn: ${transactionId})`,
          `Hotel reservation cancelled & room inventory returned to pool`,
          `Final system invariants verified (0 leaked side effects)`,
          `Idempotency verified (No duplicate refund created)`,
        ],
        plainText: `Hello ${customerName},

Your Hotel Booking transaction has been successfully reversed by UNDO.AI.

Booking ID: ${bookingId}
Hotel: ${hotel}
Room: ${room}
Original Amount: ${formattedAmount}
Refund: ${formattedAmount}

Recovery actions:
✓ Payment refunded — ${formattedAmount}
✓ Hotel reservation cancelled
✓ Final system state verified

Recovery Status:
FULLY RESTORED

Transaction ID: ${transactionId}
Workflow ID: ${ctx.workflowId}

Regards,
UNDO.AI
Transactional Recovery Engine
`,
      };
    }
  }
}

function generateRecoveryEmailHtml(ctx) {
  const meta = getEmailMetadata(ctx);
  const { customerName, workflowName, workflowId, compensatedSteps = [], timestamp } = ctx;

  const metaRowsHtml = meta.metaDetails
    .map(
      (m) => `
      <tr ${m.highlight ? 'style="border-top: 1px solid #334155;"' : ''}>
        <td style="${m.highlight ? 'padding-top: 10px; font-size: 13px; color: #34d399; text-transform: uppercase; font-weight: 800;' : 'padding-bottom: 10px; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600;'}">
          ${m.label}
        </td>
        <td align="right" style="${m.highlight ? 'padding-top: 10px; font-size: 16px; font-weight: 800; color: #34d399;' : 'padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #f8fafc;'}">
          ${m.value}
        </td>
      </tr>
    `
    )
    .join('');

  const actionsHtml = meta.actions
    .map(
      (act) => `
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: #e2e8f0;">
          <span style="color: #34d399; font-weight: bold; margin-right: 8px;">✓</span> ${act}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 20px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #e11d48 100%); padding: 32px 36px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; padding: 4px 12px; background: rgba(0,0,0,0.3); border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #fecdd3; margin-bottom: 12px;">
                      ✦ SAGA RECOVERY CONFIRMATION
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                      UNDO.AI Recovery Engine
                    </h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #e2e8f0;">
                      Transaction Reversed & World State Restored
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 36px 24px 36px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #ffffff;">
                Hello ${customerName},
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Your recent autonomous transaction for <strong>${workflowName}</strong> has been safely and completely reversed by <strong>UNDO.AI</strong> following an execution failure in the downstream workflow pipeline.
              </p>

              <!-- Transaction Summary Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 14px; border: 1px solid #334155; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 10px; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Workflow Type</td>
                        <td align="right" style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #f8fafc;">${workflowName}</td>
                      </tr>
                      ${metaRowsHtml}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Recovery Actions Completed -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #a5b4fc;">
                  Recovery Actions Verified:
                </h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${actionsHtml}
                </table>
              </div>

              <!-- Status Badge & Meta -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #064e3b; border: 1px solid #059669; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6ee7b7; margin-bottom: 2px;">
                      Final System State
                    </div>
                    <div style="font-size: 15px; font-weight: 800; color: #ffffff;">
                      FULLY RESTORED ✓
                    </div>
                  </td>
                  <td align="right" style="font-size: 11px; color: #a7f3d0; font-family: monospace;">
                    Workflow ID: ${workflowId}<br>
                    Time: ${timestamp}<br>
                    Compensated: ${compensatedSteps.join(' ➔ ') || 'All Reversible Steps'}
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                The workflow has been safely rolled back in exact reverse topological order, and the system is now in its original baseline state.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 36px; border-top: 1px solid #334155; text-align: left;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #cbd5e1;">
                UNDO.AI — Transactional Recovery Engine
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.4;">
                <em>"AI agents can act. UNDO.AI makes their actions recoverable."</em><br>
                Buildathon 2026 AG02: The Agent With An Undo Button
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { workflowId } = req.query;
  const body = req.body || {};

  const resendApiKey = process.env.RESEND_API_KEY || '';
  const emailFrom = process.env.EMAIL_FROM || 'UNDO.AI Recovery <onboarding@resend.dev>';
  const defaultEmail = process.env.RECOVERY_NOTIFICATION_EMAIL || 'divakaranperumal27@gmail.com';
  const defaultName = process.env.RECOVERY_NOTIFICATION_NAME || 'Divakaran';
  const notificationKey = `RECOVERY-EMAIL-${workflowId}`;

  const customerName = body.customerName || defaultName;
  const recipientEmail = body.email || body.recipientEmail || defaultEmail;
  const refundAmount = typeof body.refundAmount === 'number' ? body.refundAmount : 750.0;
  const currency = body.currency || (body.workflowType === 'hotel_booking' ? 'USD' : 'INR');
  const transactionId = body.transactionId || 'TXN-CHN-4491';
  const workflowName = body.workflowName || 'Hotel Booking';
  const workflowType = body.workflowType || 'hotel_booking';
  const compensatedSteps = body.compensatedSteps || ['charge_payment', 'reserve_room'];
  const parameters = body.parameters || {};

  // If already delivered, don't spam duplicate unless forced
  if (notificationStore.has(notificationKey) && !body.forceRetry) {
    return res.status(200).json({
      success: true,
      workflow_id: workflowId,
      email: {
        recipient: recipientEmail,
        customer_name: customerName,
        status: 'EMAIL_ACCEPTED',
        stage: 'EMAIL_ACCEPTED',
        stage_label: 'C. EMAIL ACCEPTED (ALREADY SENT)',
        message_id: 'ALREADY_SENT',
        email_id: 'ALREADY_SENT',
        timestamp: new Date().toISOString(),
        error: undefined,
      },
    });
  }

  let emailStatus = 'EMAIL_FAILED';
  let messageId = undefined;
  let emailError = undefined;
  let stage = 'UNKNOWN';
  let stageLabel = 'UNKNOWN';

  if (!resendApiKey || resendApiKey.includes('your_api_key')) {
    emailStatus = 'EMAIL_PROVIDER_NOT_CONFIGURED';
    emailError = 'RESEND_API_KEY is not configured in Vercel environment variables.';
    stage = 'ENVIRONMENT_ERROR';
    stageLabel = 'A. ENVIRONMENT ERROR';
  } else {
    try {
      const resend = new Resend(resendApiKey);
      const emailCtx = {
        customerName,
        recipientEmail,
        workflowType,
        workflowName,
        workflowId: String(workflowId),
        transactionId,
        refundAmount,
        currency,
        compensatedSteps,
        parameters,
        timestamp: new Date().toISOString(),
      };

      const meta = getEmailMetadata(emailCtx);
      const emailHtml = generateRecoveryEmailHtml(emailCtx);
      const emailText = meta.plainText;

      const { data, error } = await resend.emails.send({
        from: emailFrom,
        to: [recipientEmail],
        subject: meta.subject,
        html: emailHtml,
        text: emailText,
      });

      if (error || !data?.id) {
        emailStatus = 'EMAIL_FAILED';
        emailError = error?.message || 'Failed to dispatch email via Resend';
        stage = 'RESEND_API_ERROR';
        stageLabel = 'B. RESEND API ERROR';
      } else {
        emailStatus = 'EMAIL_ACCEPTED';
        messageId = data.id;
        stage = 'EMAIL_ACCEPTED';
        stageLabel = 'C. EMAIL ACCEPTED';
        notificationStore.add(notificationKey);
      }
    } catch (err) {
      emailStatus = 'EMAIL_FAILED';
      emailError = err.message || 'Internal error dispatching email via Resend';
      stage = 'RESEND_API_ERROR';
      stageLabel = 'B. RESEND API NETWORK ERROR';
    }
  }

  return res.status(200).json({
    success: emailStatus === 'EMAIL_ACCEPTED',
    workflow_id: workflowId,
    email: {
      recipient: recipientEmail,
      customer_name: customerName,
      status: emailStatus,
      stage,
      stage_label: stageLabel,
      message_id: messageId,
      email_id: messageId,
      timestamp: new Date().toISOString(),
      error: emailError,
    },
  });
}
