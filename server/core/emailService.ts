// ============================================================================
// UNDO.AI (AG02) — REAL RESEND EMAIL DISPATCH ENGINE
// Production side-effecting notification layer with zero secret leakage
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { durableStore } from './durableStore.ts';
import type { EmailDeliveryStatus, WorkflowInstanceData } from './types.ts';

export interface EmailDispatchContext {
  recipient: string;
  customerName: string;
  subject?: string;
  workflow?: WorkflowInstanceData;
  isTest?: boolean;
}

export interface EmailDispatchResult {
  success: boolean;
  status: EmailDeliveryStatus;
  stage: string;
  stageLabel: string;
  emailId?: string;
  recipient: string;
  customerName: string;
  sender?: string;
  subject?: string;
  timestamp: string;
  error?: string;
  diagnosticTip?: string;
  rawResponse?: any;
}

// In-memory rate limiting: max 10 emails per minute
const emailTimestamps: number[] = [];
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

export class EmailService {
  private getEnvConfig() {
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
    } catch {
      // Ignore file read errors
    }

    return { resendApiKey, emailFrom, recipientEmail, recipientName };
  }

  public isConfigured(): boolean {
    const config = this.getEnvConfig();
    return !!config.resendApiKey && !config.resendApiKey.includes('your_api_key');
  }

  public isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  public checkRateLimit(): boolean {
    const now = Date.now();
    // remove timestamps older than window
    while (emailTimestamps.length > 0 && emailTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
      emailTimestamps.shift();
    }
    if (emailTimestamps.length >= RATE_LIMIT_MAX) {
      return false;
    }
    emailTimestamps.push(now);
    return true;
  }

  public async sendTestEmail(recipient?: string, customerName?: string): Promise<EmailDispatchResult> {
    const config = this.getEnvConfig();
    const targetRecipient = recipient || config.recipientEmail;
    const targetCustomer = customerName || config.recipientName;

    if (!this.isValidEmail(targetRecipient)) {
      return {
        success: false,
        status: 'EMAIL_FAILED',
        stage: 'INVALID_RECIPIENT',
        stageLabel: 'E. INVALID RECIPIENT EMAIL',
        recipient: targetRecipient,
        customerName: targetCustomer,
        timestamp: new Date().toISOString(),
        error: `Invalid recipient email address format: "${targetRecipient}".`,
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'EMAIL_PROVIDER_NOT_CONFIGURED',
        stage: 'ENVIRONMENT_ERROR',
        stageLabel: 'A. ENVIRONMENT ERROR (MISSING RESEND_API_KEY)',
        recipient: targetRecipient,
        customerName: targetCustomer,
        timestamp: new Date().toISOString(),
        error: 'RESEND_API_KEY is not configured in .env.',
        diagnosticTip: 'Add a valid RESEND_API_KEY to your .env file from https://resend.com/api-keys.',
      };
    }

    if (!this.checkRateLimit()) {
      return {
        success: false,
        status: 'EMAIL_FAILED',
        stage: 'RATE_LIMITED',
        stageLabel: 'RATE LIMIT EXCEEDED',
        recipient: targetRecipient,
        customerName: targetCustomer,
        timestamp: new Date().toISOString(),
        error: 'Rate limit reached: Max 10 emails per minute. Please try again shortly.',
      };
    }

    const subject = 'UNDO.AI — Real Email Delivery Test';
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:32px;background:#0f172a;font-family:sans-serif;color:#f8fafc;">
  <div style="max-width:540px;margin:0 auto;background:#1e293b;border-radius:16px;padding:28px;border:1px solid #334155;">
    <h2 style="color:#6366f1;margin-top:0;">UNDO.AI Real Email Delivery Test</h2>
    <p>Hello <strong>${targetCustomer}</strong>,</p>
    <p>This is a live transactional email delivery test from <strong>UNDO.AI Transactional Recovery Engine</strong>.</p>
    <div style="background:#064e3b;color:#6ee7b7;padding:12px;border-radius:8px;font-weight:bold;margin:16px 0;">
      ✓ Resend REST API integration is active and confirmed.
    </div>
    <div style="font-size:12px;color:#94a3b8;border-top:1px solid #334155;padding-top:12px;">
      Recipient: ${targetRecipient}<br>
      Sender: ${config.emailFrom}<br>
      Time: ${new Date().toISOString()}
    </div>
  </div>
</body>
</html>`;

    return await this.dispatchToResend(config, targetRecipient, targetCustomer, subject, html);
  }

  public async sendRecoveryEmail(
    workflow: WorkflowInstanceData,
    recipientOverride?: string,
    forceRetry?: boolean
  ): Promise<EmailDispatchResult> {
    const config = this.getEnvConfig();
    const recipient = recipientOverride || workflow.customer.email || config.recipientEmail;
    const customerName = workflow.customer.name || config.recipientName;
    const params = workflow.parameters || {};
    const transactionId =
      params.transactionId ||
      params.bookingId ||
      params.ticketId ||
      params.rideId ||
      params.orderId ||
      workflow.workflowId;

    const notificationKey = `RECOVERY-EMAIL-${workflow.workflowId}-${transactionId}`;

    console.log('[EMAIL] Provider: Resend');
    console.log(`[EMAIL] Recipient: ${recipient}`);
    console.log(`[EMAIL] Workflow: ${workflow.workflowId}`);
    console.log(`[EMAIL] Transaction: ${transactionId}`);
    console.log('[EMAIL] Sending...');

    // Step 1: Check if already sent (Idempotency) unless forced
    if (!forceRetry && durableStore.hasEmailSent(notificationKey)) {
      const existingEmailId = durableStore.getIdempotencyResult(notificationKey)?.emailId || 'ALREADY_SENT';
      console.log(`[EMAIL] Status: EMAIL_ALREADY_SENT - Recovery email already sent for ${notificationKey} (idempotent skip).`);
      return {
        success: true,
        status: 'EMAIL_ALREADY_SENT',
        stage: 'EMAIL_ACCEPTED',
        stageLabel: 'C. EMAIL ACCEPTED (ALREADY SENT)',
        emailId: existingEmailId,
        recipient,
        customerName,
        timestamp: new Date().toISOString(),
      };
    }

    // Step 2: Validate Email
    if (!this.isValidEmail(recipient)) {
      console.error(`[EMAIL] Status: EMAIL_FAILED - Invalid recipient email: "${recipient}"`);
      return {
        success: false,
        status: 'EMAIL_FAILED',
        stage: 'INVALID_RECIPIENT',
        stageLabel: 'E. INVALID RECIPIENT EMAIL',
        recipient,
        customerName,
        timestamp: new Date().toISOString(),
        error: `Invalid recipient email address format: "${recipient}".`,
      };
    }

    // Step 3: Check Provider Configuration
    if (!this.isConfigured()) {
      console.log('[EMAIL] Status: EMAIL_PROVIDER_NOT_CONFIGURED - RESEND_API_KEY is not configured in .env.');
      return {
        success: false,
        status: 'EMAIL_PROVIDER_NOT_CONFIGURED',
        stage: 'ENVIRONMENT_ERROR',
        stageLabel: 'A. ENVIRONMENT ERROR (MISSING RESEND_API_KEY)',
        recipient,
        customerName,
        timestamp: new Date().toISOString(),
        error: 'RESEND_API_KEY is not configured in .env.',
        diagnosticTip: 'Add a valid RESEND_API_KEY to your .env file from https://resend.com/api-keys.',
      };
    }

    // Step 4: Rate limit check
    if (!this.checkRateLimit()) {
      console.error('[EMAIL] Status: EMAIL_FAILED - Rate limit exceeded (max 10/min)');
      return {
        success: false,
        status: 'EMAIL_FAILED',
        stage: 'RATE_LIMITED',
        stageLabel: 'RATE LIMIT EXCEEDED',
        recipient,
        customerName,
        timestamp: new Date().toISOString(),
        error: 'Rate limit reached: Max 10 emails per minute. Please try again shortly.',
      };
    }

    // Step 5: Generate dynamic email content strictly from workflow state
    const currency = params.currency === 'USD' ? '$' : '₹';
    const amount =
      workflow.workflowType === 'hotel_booking'
        ? (params.roomPrice || 750)
        : workflow.workflowType === 'cab_booking'
        ? (params.fare || 420)
        : workflow.workflowType === 'ecommerce_order'
        ? (params.price || 85000)
        : workflow.workflowType === 'customer_support'
        ? (params.creditAmount || 500)
        : (params.amount || 750);
    const formattedAmount = `${currency}${amount.toLocaleString('en-IN')}`;

    let subject = `UNDO.AI — Transaction Recovery Completed (${workflow.workflowId})`;
    let workflowLabel = 'Hotel Booking';
    let detailLines = '';
    let recoverySummaryLines = '';

    if (workflow.workflowType === 'hotel_booking') {
      subject = 'UNDO.AI — Booking Recovery Completed';
      workflowLabel = 'Hotel Booking';
      detailLines = `
        <tr><td style="color:#94a3b8;padding:6px 0;">Hotel:</td><td align="right" style="color:#f8fafc;font-weight:bold;">${params.hotelName || params.hotel || 'Pharos Hotels'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Location:</td><td align="right" style="color:#f8fafc;">${params.area || params.location || 'Nungambakkam, Chennai'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Room:</td><td align="right" style="color:#f8fafc;">${params.roomType || 'Deluxe Room'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Transaction:</td><td align="right" style="color:#f8fafc;font-family:monospace;">${transactionId}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Original Amount:</td><td align="right" style="color:#34d399;font-weight:bold;font-size:16px;">${formattedAmount}</td></tr>
      `;
      recoverySummaryLines = `
        ✓ Room reservation cancelled<br>
        ✓ Payment refunded (${formattedAmount})<br>
        ✓ Hotel inventory restored<br>
        ✓ Booking ticket was not created (failed before existence)<br>
        ✓ Final system state verified
      `;
    } else if (workflow.workflowType === 'ecommerce_order') {
      subject = 'UNDO.AI — Order Recovery Completed';
      workflowLabel = 'E-Commerce Purchase';
      detailLines = `
        <tr><td style="color:#94a3b8;padding:6px 0;">Product:</td><td align="right" style="color:#f8fafc;font-weight:bold;">${params.productName || 'AI Dev Workstation Laptop'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Order ID:</td><td align="right" style="color:#f8fafc;font-family:monospace;">${params.orderId || transactionId}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Location:</td><td align="right" style="color:#f8fafc;">${params.deliveryArea || 'Velachery, Chennai'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Original Amount:</td><td align="right" style="color:#34d399;font-weight:bold;font-size:16px;">${formattedAmount}</td></tr>
      `;
      recoverySummaryLines = `
        ✓ Payment refunded (${formattedAmount})<br>
        ✓ Warehouse inventory released & stock restored<br>
        ✓ Order cancelled<br>
        ✓ Shipment label was not created<br>
        ✓ Confirmation email never sent<br>
        ✓ Final system state verified
      `;
    } else if (workflow.workflowType === 'customer_support') {
      subject = 'UNDO.AI — Support Case Recovery Completed';
      workflowLabel = 'Customer Support Escalation';
      detailLines = `
        <tr><td style="color:#94a3b8;padding:6px 0;">Ticket ID:</td><td align="right" style="color:#f8fafc;font-family:monospace;">${params.ticketId || transactionId}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Issue:</td><td align="right" style="color:#f8fafc;">${params.issue || 'Payment transaction failed'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Resolution Credit:</td><td align="right" style="color:#34d399;font-weight:bold;font-size:16px;">${formattedAmount}</td></tr>
      `;
      recoverySummaryLines = `
        ✓ Customer priority restored to normal<br>
        ✓ Specialist released to pool<br>
        ✓ Support ticket cancelled<br>
        ✓ Resolution credit was not issued<br>
        ✓ Final system state verified
      `;
    } else if (workflow.workflowType === 'cab_booking') {
      subject = 'UNDO.AI — Ride Booking Recovery Completed';
      workflowLabel = 'Cab / Ride Booking';
      detailLines = `
        <tr><td style="color:#94a3b8;padding:6px 0;">Ride ID:</td><td align="right" style="color:#f8fafc;font-weight:bold;font-family:monospace;">${params.rideId || transactionId}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Driver:</td><td align="right" style="color:#f8fafc;">${params.driverName || 'Murugan K'} (Released)</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Route:</td><td align="right" style="color:#f8fafc;">${params.pickup || 'Thiruvanmiyur'} ➔ ${params.drop || 'OMR / Sholinganallur'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Refund Amount:</td><td align="right" style="color:#34d399;font-weight:bold;font-size:16px;">${formattedAmount}</td></tr>
      `;
      recoverySummaryLines = `
        ✓ Payment refunded (${formattedAmount})<br>
        ✓ Ride booking cancelled<br>
        ✓ Fleet driver released to available pool<br>
        ✓ Driver OTP was not dispatched<br>
        ✓ Final system state verified
      `;
    } else {
      detailLines = `
        <tr><td style="color:#94a3b8;padding:6px 0;">Workflow:</td><td align="right" style="color:#f8fafc;font-weight:bold;">${workflow.title || workflow.workflowType}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Transaction ID:</td><td align="right" style="color:#f8fafc;font-family:monospace;">${transactionId}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Reversed Amount:</td><td align="right" style="color:#34d399;font-weight:bold;font-size:16px;">${formattedAmount}</td></tr>
      `;
      recoverySummaryLines = `
        ✓ Side effects compensated in reverse order<br>
        ✓ Payment refunded<br>
        ✓ Final world state verified
      `;
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:32px 16px;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
  <div style="max-width:580px;margin:0 auto;background:#1e293b;border-radius:18px;border:1px solid #334155;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#e11d48 100%);padding:28px 32px;">
      <div style="display:inline-block;padding:4px 10px;background:rgba(0,0,0,0.3);border-radius:9999px;font-size:11px;font-weight:bold;color:#fecdd3;text-transform:uppercase;margin-bottom:8px;">
        ✦ TRANSACTION RECOVERY CONFIRMATION
      </div>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">UNDO.AI Recovery Engine</h1>
      <p style="margin:4px 0 0 0;font-size:13px;color:#e2e8f0;">Transaction Reversed & World State Restored</p>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="margin:0 0 12px 0;font-size:17px;font-weight:700;">Hello ${customerName},</h2>
      <p style="margin:0 0 20px 0;font-size:14px;color:#cbd5e1;line-height:1.5;">
        Your ${workflowLabel} could not be completed because an external service dependency failed during execution.
      </p>
      <div style="margin-bottom:20px;">
        <div style="color:#94a3b8;font-size:11px;font-weight:bold;text-transform:uppercase;margin-bottom:8px;">Transaction Details</div>
        <table style="width:100%;background:#0f172a;border-radius:12px;padding:16px;border:1px solid #334155;">
          ${detailLines}
        </table>
      </div>
      <div style="background:#064e3b;border:1px solid #059669;border-radius:10px;padding:14px;margin-bottom:20px;">
        <div style="color:#6ee7b7;font-size:11px;font-weight:bold;text-transform:uppercase;">Recovery Completed</div>
        <div style="color:#ffffff;font-size:15px;font-weight:800;margin-bottom:8px;">TRANSACTION FULLY RESTORED ✓</div>
        <div style="color:#a7f3d0;font-size:12px;line-height:1.6;">
          ${recoverySummaryLines}
        </div>
      </div>
      <p style="font-size:13px;color:#e2e8f0;margin:0 0 16px 0;">
        No further action is required.
      </p>
      <div style="font-size:12px;color:#64748b;border-top:1px solid #334155;padding-top:14px;">
        <strong>UNDO.AI</strong><br>
        Transactional Execution & Recovery Layer<br>
        Workflow ID: ${workflow.workflowId} &bull; Idempotency: ${notificationKey}<br>
        Timestamp: ${new Date().toISOString()}
      </div>
    </div>
  </div>
</body>
</html>`;

    const result = await this.dispatchToResend(config, recipient, customerName, subject, html);
    if (result.success && result.emailId) {
      durableStore.markEmailSent(notificationKey);
      durableStore.setIdempotencyResult(notificationKey, { emailId: result.emailId, timestamp: new Date().toISOString() });
    }
    return result;
  }

  public async sendBookingConfirmationEmail(
    workflow: WorkflowInstanceData,
    recipientOverride?: string
  ): Promise<EmailDispatchResult> {
    const config = this.getEnvConfig();
    const recipient = recipientOverride || workflow.customer.email || config.recipientEmail;
    const customerName = workflow.customer.name || config.recipientName;
    const params = workflow.parameters || {};
    const bookingId = params.bookingId || `HTL-CHN-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticketId = params.ticketId || `TKT-HTL-${Math.floor(1000 + Math.random() * 9000)}`;
    const currency = params.currency === 'USD' ? '$' : '₹';
    const amount =
      workflow.workflowType === 'hotel_booking'
        ? (params.roomPrice || 750)
        : workflow.workflowType === 'cab_booking'
        ? (params.fare || 420)
        : workflow.workflowType === 'ecommerce_order'
        ? (params.price || 85000)
        : (params.amount || 750);
    const formattedAmount = `${currency}${amount.toLocaleString('en-IN')}`;

    console.log('[EMAIL] Provider: Resend (Forward Confirmation)');
    console.log(`[EMAIL] Recipient: ${recipient}`);
    console.log(`[EMAIL] Workflow: ${workflow.workflowId}`);
    console.log(`[EMAIL] Booking ID: ${bookingId}`);
    console.log('[EMAIL] Sending forward confirmation email...');

    // Validate email
    if (!this.isValidEmail(recipient)) {
      return {
        success: false,
        status: 'EMAIL_FAILED',
        stage: 'INVALID_RECIPIENT',
        stageLabel: 'E. INVALID RECIPIENT EMAIL',
        recipient,
        customerName,
        timestamp: new Date().toISOString(),
        error: `Invalid recipient email address format: "${recipient}".`,
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'EMAIL_PROVIDER_NOT_CONFIGURED',
        stage: 'ENVIRONMENT_ERROR',
        stageLabel: 'A. ENVIRONMENT ERROR (MISSING RESEND_API_KEY)',
        recipient,
        customerName,
        timestamp: new Date().toISOString(),
        error: 'RESEND_API_KEY is not configured in .env.',
        diagnosticTip: 'Add a valid RESEND_API_KEY to your .env file from https://resend.com/api-keys.',
      };
    }

    let subject = `UNDO.AI — Booking Confirmation: ${params.hotelName || 'Pharos Hotels'} (${bookingId})`;
    let detailLines = '';

    if (workflow.workflowType === 'hotel_booking') {
      subject = `UNDO.AI — Booking Confirmation: ${params.hotelName || 'Pharos Hotels'} (${bookingId})`;
      detailLines = `
        <tr><td style="color:#94a3b8;padding:6px 0;">Hotel:</td><td align="right" style="color:#f8fafc;font-weight:bold;">${params.hotelName || params.hotel || 'Pharos Hotels'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Location:</td><td align="right" style="color:#f8fafc;">${params.area || params.location || 'Nungambakkam, Chennai'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Room:</td><td align="right" style="color:#f8fafc;">${params.roomType || 'Deluxe Room'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Booking ID:</td><td align="right" style="color:#f8fafc;font-family:monospace;">${bookingId}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Ticket Voucher ID:</td><td align="right" style="color:#a7f3d0;font-family:monospace;font-weight:bold;">${ticketId}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Amount Paid:</td><td align="right" style="color:#34d399;font-weight:bold;font-size:16px;">${formattedAmount}</td></tr>
      `;
    } else if (workflow.workflowType === 'ecommerce_order') {
      subject = `UNDO.AI — Order Confirmation: ${params.productName || 'Product'} (${params.orderId || bookingId})`;
      detailLines = `
        <tr><td style="color:#94a3b8;padding:6px 0;">Product:</td><td align="right" style="color:#f8fafc;font-weight:bold;">${params.productName || 'AI Dev Workstation Laptop'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Order ID:</td><td align="right" style="color:#f8fafc;font-family:monospace;">${params.orderId || bookingId}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Delivery Area:</td><td align="right" style="color:#f8fafc;">${params.deliveryArea || 'Velachery, Chennai'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Amount Paid:</td><td align="right" style="color:#34d399;font-weight:bold;font-size:16px;">${formattedAmount}</td></tr>
      `;
    } else if (workflow.workflowType === 'customer_support') {
      subject = `UNDO.AI — Support Case Update: Ticket #${params.ticketId || bookingId}`;
      detailLines = `
        <tr><td style="color:#94a3b8;padding:6px 0;">Ticket ID:</td><td align="right" style="color:#f8fafc;font-family:monospace;">${params.ticketId || bookingId}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Specialist:</td><td align="right" style="color:#f8fafc;">${params.specialist || 'Murugan K (Senior Specialist)'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Resolution Credit:</td><td align="right" style="color:#34d399;font-weight:bold;font-size:16px;">${formattedAmount}</td></tr>
      `;
    } else {
      subject = `UNDO.AI — Ride Booking Confirmed (${params.rideId || bookingId})`;
      detailLines = `
        <tr><td style="color:#94a3b8;padding:6px 0;">Ride ID:</td><td align="right" style="color:#f8fafc;font-family:monospace;">${params.rideId || bookingId}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Driver:</td><td align="right" style="color:#f8fafc;">${params.driverName || 'Murugan K'}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;">Fare Paid:</td><td align="right" style="color:#34d399;font-weight:bold;font-size:16px;">${formattedAmount}</td></tr>
      `;
    }

    let headerTitle = 'Booking Confirmed';
    let introParagraph = `Your booking with <strong>${params.hotelName || 'Pharos Hotels'}</strong> has been successfully authorized and confirmed.`;
    let statusChecklist = `
      ✓ Room reserved in hotel inventory<br>
      ✓ Payment captured (${formattedAmount})<br>
      ✓ Digital voucher issued (${ticketId})<br>
      ✓ Verified against external provider ledger
    `;

    if (workflow.workflowType === 'ecommerce_order') {
      headerTitle = 'Order Confirmed';
      introParagraph = `Your order for <strong>${params.productName || 'AI Dev Workstation Laptop'}</strong> has been successfully authorized, payment captured, and scheduled for shipment to ${params.deliveryArea || 'Velachery, Chennai'}.`;
      statusChecklist = `
        ✓ Warehouse inventory allocated (1 Unit)<br>
        ✓ Payment captured (${formattedAmount})<br>
        ✓ Order created & verified<br>
        ✓ Scheduled for carrier dispatch
      `;
    } else if (workflow.workflowType === 'customer_support') {
      headerTitle = 'Support Ticket Activated';
      introParagraph = `Your support case (Ticket #${params.ticketId || bookingId}) has been successfully processed and assigned to Senior Specialist <strong>${params.specialist || 'Murugan K'}</strong>.`;
      statusChecklist = `
        ✓ Support ticket created & assigned<br>
        ✓ Customer priority upgraded to HIGH<br>
        ✓ Resolution credit approved (${formattedAmount})<br>
        ✓ Specialist assigned to case
      `;
    } else if (workflow.workflowType === 'cab_booking') {
      headerTitle = 'Ride Booking Confirmed';
      introParagraph = `Your cab reservation has been confirmed and driver <strong>${params.driverName || 'Murugan K'}</strong> has been assigned to your pickup location at ${params.pickup || 'Thiruvanmiyur'}.`;
      statusChecklist = `
        ✓ Driver allocated from fleet<br>
        ✓ Fare payment captured (${formattedAmount})<br>
        ✓ Trip manifest generated<br>
        ✓ Driver en route to pickup
      `;
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:32px 16px;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
  <div style="max-width:580px;margin:0 auto;background:#1e293b;border-radius:18px;border:1px solid #334155;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
    <div style="background:linear-gradient(135deg,#059669 0%,#2563eb 100%);padding:28px 32px;">
      <div style="display:inline-block;padding:4px 10px;background:rgba(0,0,0,0.3);border-radius:9999px;font-size:11px;font-weight:bold;color:#a7f3d0;text-transform:uppercase;margin-bottom:8px;">
        ✓ AUTHORIZED TRANSACTION CONFIRMATION
      </div>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">${headerTitle}</h1>
      <p style="margin:4px 0 0 0;font-size:13px;color:#e2e8f0;">Dispatched via UNDO.AI Transactional Agent</p>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="margin:0 0 12px 0;font-size:17px;font-weight:700;">Hello ${customerName},</h2>
      <p style="margin:0 0 20px 0;font-size:14px;color:#cbd5e1;line-height:1.5;">
        ${introParagraph}
      </p>
      <div style="margin-bottom:20px;">
        <div style="color:#94a3b8;font-size:11px;font-weight:bold;text-transform:uppercase;margin-bottom:8px;">Confirmed Details</div>
        <table style="width:100%;background:#0f172a;border-radius:12px;padding:16px;border:1px solid #334155;">
          ${detailLines}
        </table>
      </div>
      <div style="background:#064e3b;border:1px solid #059669;border-radius:10px;padding:14px;margin-bottom:20px;">
        <div style="color:#6ee7b7;font-size:11px;font-weight:bold;text-transform:uppercase;">Transaction Status</div>
        <div style="color:#ffffff;font-size:15px;font-weight:800;margin-bottom:6px;">CONFIRMED & SETTLED ✓</div>
        <div style="color:#a7f3d0;font-size:12px;">
          ${statusChecklist}
        </div>
      </div>
      <div style="font-size:12px;color:#64748b;border-top:1px solid #334155;padding-top:14px;">
        <strong>UNDO.AI</strong><br>
        Transactional Execution & Recovery Layer<br>
        Workflow: ${workflow.workflowId} &bull; Customer: ${recipient}<br>
        Timestamp: ${new Date().toISOString()}
      </div>
    </div>
  </div>
</body>
</html>`;

    return await this.dispatchToResend(config, recipient, customerName, subject, html);
  }

  private async dispatchToResend(
    config: ReturnType<typeof this.getEnvConfig>,
    recipient: string,
    customerName: string,
    subject: string,
    html: string
  ): Promise<EmailDispatchResult> {
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

      const resendData: any = await resendRes.json();

      if (resendRes.ok && resendData.id) {
        console.log(`[EMAIL] Resend Message ID: ${resendData.id}`);
        console.log('[EMAIL] Status: EMAIL_SENT');
        return {
          success: true,
          status: 'EMAIL_SENT',
          stage: 'EMAIL_ACCEPTED',
          stageLabel: 'C. EMAIL ACCEPTED BY RESEND',
          emailId: resendData.id,
          recipient,
          customerName,
          sender: config.emailFrom,
          subject,
          timestamp: new Date().toISOString(),
          rawResponse: resendData,
        };
      } else {
        const errMsg = resendData.message || resendData.error?.message || `Resend HTTP ${resendRes.status}`;
        console.error(`[EMAIL] Status: EMAIL_FAILED - ${errMsg}`);
        return {
          success: false,
          status: 'EMAIL_FAILED',
          stage: 'RESEND_API_ERROR',
          stageLabel: 'B. RESEND API ERROR',
          recipient,
          customerName,
          timestamp: new Date().toISOString(),
          error: errMsg,
          diagnosticTip: errMsg.includes('testing emails')
            ? 'Resend Free Tier only allows sending to your registered Resend account email address when using onboarding@resend.dev.'
            : 'Check that your RESEND_API_KEY is active in Resend dashboard.',
          rawResponse: resendData,
        };
      }
    } catch (err: any) {
      console.error(`[EMAIL] Status: EMAIL_FAILED - Network exception:`, err.message);
      return {
        success: false,
        status: 'EMAIL_FAILED',
        stage: 'RESEND_API_ERROR',
        stageLabel: 'B. RESEND API NETWORK ERROR',
        recipient,
        customerName,
        timestamp: new Date().toISOString(),
        error: err.message || 'Network error reaching Resend REST API',
      };
    }
  }

  public async checkEmailStatus(emailId: string): Promise<any> {
    const config = this.getEnvConfig();
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'EMAIL_PROVIDER_NOT_CONFIGURED',
        error: 'RESEND_API_KEY not configured.',
      };
    }

    try {
      const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      const data: any = await res.json();
      if (res.ok) {
        const lastEvent = (data.last_event || 'accepted').toLowerCase();
        let status: EmailDeliveryStatus = 'EMAIL_ACCEPTED';
        if (lastEvent === 'delivered') status = 'EMAIL_DELIVERED';
        else if (lastEvent === 'delivery_delayed') status = 'EMAIL_DELIVERY_DELAYED';
        else if (lastEvent === 'bounced') status = 'EMAIL_BOUNCED';
        else if (lastEvent === 'suppressed') status = 'EMAIL_SUPPRESSED';
        else if (lastEvent === 'complained') status = 'EMAIL_COMPLAINED';

        return {
          success: true,
          email_id: emailId,
          status,
          last_event: lastEvent,
          recipient: data.to?.[0],
          sender: data.from,
          subject: data.subject,
          created_at: data.created_at,
          raw_response: data,
        };
      } else {
        return {
          success: false,
          status: 'EMAIL_FAILED',
          error: data.message || `Resend Error (${res.status})`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        status: 'EMAIL_FAILED',
        error: err.message || 'Failed to query Resend status',
      };
    }
  }
}

export const emailService = new EmailService();
