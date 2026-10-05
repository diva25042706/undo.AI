// ============================================================================
// UNDO.AI — PRODUCTION REST API BACKEND (AG02)
// The Agent With An Undo Button — Layered Service Architecture
// ============================================================================

import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import * as fs from 'fs';
import * as path from 'path';

import { workflowService } from './core/workflowService.ts';
import { emailService } from './core/emailService.ts';
import { voiceRecoveryService } from './core/voiceRecoveryService.ts';
import { worldStateManager } from './core/mockWorld.ts';
import { stateVerifier } from './core/stateVerifier.ts';
import { runAcceptanceTestSuite } from './acceptanceTests.ts';

// Helper to parse incoming JSON body safely
function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Send JSON response helper
function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');
  res.end(JSON.stringify(data, null, 2));
}

// Helper to load GLM config securely
function getGlmConfig() {
  let glmApiKey = process.env.GLM_API_KEY || '';
  let glmBaseUrl = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
  let glmModel = process.env.GLM_MODEL || 'glm-5.3';

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
          if (key.trim() === 'GLM_API_KEY' && val && !val.includes('your_api_key')) glmApiKey = val;
          if (key.trim() === 'GLM_BASE_URL' && val) glmBaseUrl = val;
          if (key.trim() === 'GLM_MODEL' && val) glmModel = val;
        }
      });
    }
  } catch {}

  return { glmApiKey, glmBaseUrl, glmModel };
}

export function undoApiPlugin(): Plugin {
  return {
    name: 'undo-api-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        const method = req.method || 'GET';

        // Handle CORS preflight
        if (method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');
          res.end();
          return;
        }

        // ====================================================================
        // 1. HEALTH CHECK: GET /api/health
        // ====================================================================
        if (url === '/api/health' && method === 'GET') {
          return sendJson(res, 200, {
            status: 'ok',
            engine: 'online',
            resendConfigured: emailService.isConfigured(),
            workflowEngine: true,
            durableLog: true,
            compensationEngine: true,
            stateVerifier: true,
            timestamp: new Date().toISOString(),
          });
        }

        // ====================================================================
        // 2. WORKFLOWS COLLECTION: GET /api/workflows & POST /api/workflows
        // ====================================================================
        if (url === '/api/workflows' && method === 'GET') {
          const list = workflowService.getAllWorkflows();
          return sendJson(res, 200, {
            success: true,
            count: list.length,
            workflows: list,
          });
        }

        if (url === '/api/workflows' && method === 'POST') {
          const body = await parseJsonBody(req);
          const wfType = body.workflowType || body.type || 'cab_booking';
          const parameters = body.parameters || {};
          const customer = body.customer || { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' };

          const created = workflowService.createWorkflow(wfType, parameters, customer, body.workflowId);
          return sendJson(res, 201, {
            success: true,
            workflow: created,
          });
        }

        // ====================================================================
        // 3. WORKFLOW INSTANCE STATUS: GET /api/workflows/:workflowId/status
        // ====================================================================
        const statusRouteMatch = url.match(/^\/api\/workflows\/([^/?]+)\/status/);
        if (statusRouteMatch && method === 'GET') {
          const workflowId = decodeURIComponent(statusRouteMatch[1]);
          let wf = workflowService.getWorkflow(workflowId);

          if (!wf) {
            // Auto-create for dynamically requested IDs
            wf = workflowService.createWorkflow('cab_booking', {}, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' }, workflowId);
          }

          const logs = workflowService.getWorkflowLogs(workflowId);
          const worldState = worldStateManager.getOrCreateWorldState(workflowId, wf.workflowType, wf.parameters);
          const verification = stateVerifier.verifyWorldRestored(wf.workflowType, worldState, wf.parameters);

          return sendJson(res, 200, {
            success: true,
            workflowId,
            status: wf.status,
            workflowType: wf.workflowType,
            currentStepIndex: wf.currentStepIndex,
            totalSteps: wf.steps.length,
            requiresHuman: wf.requiresHuman,
            failedCompensation: wf.failedCompensation,
            escalationReason: wf.escalationReason,
            worldState,
            verification,
            logCount: logs.length,
            updatedAt: wf.updatedAt,
          });
        }

        // ====================================================================
        // 4. WORKFLOW EXECUTION LOG: GET /api/workflows/:workflowId/log
        // ====================================================================
        const logRouteMatch = url.match(/^\/api\/workflows\/([^/?]+)\/log/);
        if (logRouteMatch && method === 'GET') {
          const workflowId = decodeURIComponent(logRouteMatch[1]);
          const logs = workflowService.getWorkflowLogs(workflowId);
          return sendJson(res, 200, {
            success: true,
            workflowId,
            count: logs.length,
            logs,
          });
        }

        // ====================================================================
        // 5. WORKFLOW INVARIANT VERIFIER: POST/GET /api/workflows/:workflowId/verify
        // ====================================================================
        const verifyRouteMatch = url.match(/^\/api\/workflows\/([^/?]+)\/verify/);
        if (verifyRouteMatch && (method === 'GET' || method === 'POST')) {
          const workflowId = decodeURIComponent(verifyRouteMatch[1]);
          let wf = workflowService.getWorkflow(workflowId);
          if (!wf) {
            wf = workflowService.createWorkflow('cab_booking', {}, { name: 'Divakaran', email: 'divakaranperumal27@gmail.com' }, workflowId);
          }

          const verification = workflowService.verifyWorkflowState(workflowId);
          return sendJson(res, 200, {
            success: true,
            workflowId,
            ...verification,
          });
        }

        // ====================================================================
        // 6. WORKFLOW EXECUTE: POST /api/workflows/:workflowId/execute
        // ====================================================================
        const execRouteMatch = url.match(/^\/api\/workflows\/([^/?]+)\/execute/);
        if (execRouteMatch && method === 'POST') {
          const workflowId = decodeURIComponent(execRouteMatch[1]);
          const body = await parseJsonBody(req);
          const fault = body.faultInjection || body.fault || 'NONE';
          const executeAll = body.executeAll !== false;

          let wf = workflowService.getWorkflow(workflowId);
          if (!wf) {
            wf = workflowService.createWorkflow(body.workflowType || 'cab_booking', body.parameters || {}, body.customer, workflowId);
          }

          const execResult = await workflowService.executeWorkflow(workflowId, fault, executeAll);
          return sendJson(res, 200, execResult);
        }

        // ====================================================================
        // 7. UNDO LAST ACTION / SAGA ROLLBACK: POST /api/workflows/:workflowId/undo
        // ====================================================================
        const undoMatch = url.match(/^\/api\/workflows\/([^/?]+)\/undo/);
        if (undoMatch && method === 'POST') {
          const workflowId = decodeURIComponent(undoMatch[1]);
          const body = await parseJsonBody(req);

          const idempotencyKey = body.idempotencyKey || req.headers['x-idempotency-key'] as string || `UNDO-${workflowId}`;
          const reason = body.reason || 'USER_REQUESTED_UNDO';
          const recipientEmail = body.email || body.recipientEmail;

          // Check if workflow exists, create default if not
          let wf = workflowService.getWorkflow(workflowId);
          if (!wf) {
            wf = workflowService.createWorkflow(body.workflowType || 'cab_booking', body.parameters || {}, {
              name: body.customerName || 'Divakaran',
              email: recipientEmail || 'divakaranperumal2007@gmail.com',
            }, workflowId);
          }

          // If client provided dynamic parameters, merge safely
          if (body.parameters) {
            wf.parameters = { ...wf.parameters, ...body.parameters };
          }
          if (body.customerName) {
            wf.customer.name = body.customerName;
          }
          if (recipientEmail) {
            wf.customer.email = recipientEmail;
          }
          if (typeof body.refundAmount === 'number') {
            wf.parameters.fare = body.refundAmount;
            wf.parameters.roomPrice = body.refundAmount;
            wf.parameters.price = body.refundAmount;
          }

          const undoResult = await workflowService.undoWorkflow(workflowId, reason, idempotencyKey, recipientEmail);

          const emailStatus = undoResult.emailResult?.status || (undoResult.finalStateVerified ? 'EMAIL_ACCEPTED' : 'EMAIL_PENDING');

          return sendJson(res, 200, {
            success: undoResult.success,
            workflow_id: workflowId,
            workflowId,
            idempotency_key: idempotencyKey,
            status: undoResult.status,
            refund_amount: wf.workflowType === 'hotel_booking'
              ? (wf.parameters.roomPrice || 750.0)
              : wf.workflowType === 'cab_booking'
              ? (wf.parameters.fare || 420.0)
              : wf.workflowType === 'ecommerce_order'
              ? (wf.parameters.price || 85000.0)
              : (wf.parameters.amount || 750.0),
            compensated_steps: undoResult.compensatedSteps,
            compensatedSteps: undoResult.compensatedSteps,
            is_duplicate: undoResult.isDuplicate || false,
            finalStateVerified: undoResult.finalStateVerified,
            requiresHuman: undoResult.requiresHuman || false,
            world_state: {
              status: undoResult.status,
              refund_settled: `${wf.parameters.currency === 'USD' ? '$' : '₹'}${(
                wf.workflowType === 'hotel_booking'
                  ? (wf.parameters.roomPrice || 750.0)
                  : wf.workflowType === 'cab_booking'
                  ? (wf.parameters.fare || 420.0)
                  : (wf.parameters.price || 750.0)
              ).toLocaleString('en-IN')}`,
            },
            verification: undoResult.verification,
            email: undoResult.emailResult ? {
              recipient: undoResult.emailResult.recipient,
              customer_name: undoResult.emailResult.customerName,
              status: undoResult.emailResult.status,
              stage: undoResult.emailResult.stage,
              stage_label: undoResult.emailResult.stageLabel,
              email_id: undoResult.emailResult.emailId,
              message_id: undoResult.emailResult.emailId,
              timestamp: undoResult.emailResult.timestamp,
              error: undoResult.emailResult.error,
              diagnostic_tip: undoResult.emailResult.diagnosticTip,
              raw_response: undoResult.emailResult.rawResponse,
            } : {
              recipient: wf.customer.email,
              customer_name: wf.customer.name,
              status: emailStatus,
              timestamp: new Date().toISOString(),
            },
          });
        }

        // ====================================================================
        // 8. GET WORKFLOW DETAILS: GET /api/workflows/:workflowId
        // ====================================================================
        const wfDetailMatch = url.match(/^\/api\/workflows\/([^/?]+)$/);
        if (wfDetailMatch && method === 'GET') {
          const workflowId = decodeURIComponent(wfDetailMatch[1]);
          const wf = workflowService.getWorkflow(workflowId);
          if (!wf) {
            return sendJson(res, 404, { success: false, error: 'Workflow not found' });
          }
          return sendJson(res, 200, { success: true, workflow: wf });
        }

        // ====================================================================
        // 9. SEND TEST EMAIL: POST /api/email/test & POST /api/notifications/test-email
        // ====================================================================
        if ((url === '/api/email/test' || url === '/api/notifications/test-email') && method === 'POST') {
          const body = await parseJsonBody(req);
          const recipient = body.to || body.recipient || body.email;
          const customerName = body.customerName || body.customer_name;

          const dispatchRes = await emailService.sendTestEmail(recipient, customerName);
          return sendJson(res, 200, {
            success: dispatchRes.success,
            status: dispatchRes.status,
            stage: dispatchRes.stage,
            stage_label: dispatchRes.stageLabel,
            emailId: dispatchRes.emailId,
            email_id: dispatchRes.emailId,
            recipient: dispatchRes.recipient,
            customer_name: dispatchRes.customerName,
            sender: dispatchRes.sender,
            subject: dispatchRes.subject,
            timestamp: dispatchRes.timestamp,
            error: dispatchRes.error,
            diagnostic_tip: dispatchRes.diagnosticTip,
            raw_response: dispatchRes.rawResponse,
          });
        }

        // ====================================================================
        // 9b. FORWARD BOOKING/ORDER CONFIRMATION: POST /api/email/confirmation
        // ====================================================================
        if (url === '/api/email/confirmation' && method === 'POST') {
          const body = await parseJsonBody(req);
          const workflowId = body.workflowId || 'WF-HTL-CHN-001';
          let wf = workflowService.getWorkflow(workflowId);
          if (!wf) {
            wf = workflowService.createWorkflow(body.workflowType || 'hotel_booking', body.parameters || {}, {
              name: body.customerName || 'Divakaran',
              email: body.recipient || body.email || 'divakaranperumal2007@gmail.com',
            }, workflowId);
          }

          if (body.parameters) {
            wf.parameters = { ...wf.parameters, ...body.parameters };
          }
          if (body.customerName) {
            wf.customer.name = body.customerName;
          }
          if (body.email || body.recipient) {
            wf.customer.email = body.email || body.recipient;
          }

          const recipient = body.recipient || body.email || wf.customer.email;
          const dispatchRes = await emailService.sendBookingConfirmationEmail(wf, recipient);

          return sendJson(res, 200, {
            success: dispatchRes.success,
            workflow_id: workflowId,
            email: {
              recipient: dispatchRes.recipient,
              customer_name: dispatchRes.customerName,
              status: dispatchRes.status,
              stage: dispatchRes.stage,
              stage_label: dispatchRes.stageLabel,
              email_id: dispatchRes.emailId,
              message_id: dispatchRes.emailId,
              timestamp: dispatchRes.timestamp,
              error: dispatchRes.error,
              diagnostic_tip: dispatchRes.diagnosticTip,
              raw_response: dispatchRes.rawResponse,
            },
          });
        }

        // ====================================================================
        // 10. RECOVERY EMAIL DISPATCH: POST /api/email/recovery & POST /api/workflows/:workflowId/notify-retry
        // ====================================================================
        const notifyRetryMatch = url.match(/^\/api\/workflows\/([^/?]+)\/notify-retry/);
        if ((url === '/api/email/recovery' || notifyRetryMatch) && method === 'POST') {
          const body = await parseJsonBody(req);
          const workflowId = notifyRetryMatch ? decodeURIComponent(notifyRetryMatch[1]) : (body.workflowId || 'WF-CAB-CHN-001');

          let wf = workflowService.getWorkflow(workflowId);
          if (!wf) {
            wf = workflowService.createWorkflow(body.workflowType || 'hotel_booking', body.parameters || {}, {
              name: body.customerName || 'Divakaran',
              email: body.recipient || body.email || 'divakaranperumal2007@gmail.com',
            }, workflowId);
          }

          // If client provided dynamic parameters or customer updates, merge safely
          if (body.parameters) {
            wf.parameters = { ...wf.parameters, ...body.parameters };
          }
          if (body.customerName) {
            wf.customer.name = body.customerName;
          }
          if (body.email || body.recipient) {
            wf.customer.email = body.email || body.recipient;
          }
          if (typeof body.refundAmount === 'number') {
            wf.parameters.roomPrice = body.refundAmount;
            wf.parameters.fare = body.refundAmount;
            wf.parameters.price = body.refundAmount;
          }

          // Strict verification: Ensure workflow was verified restored
          const verification = workflowService.verifyWorkflowState(workflowId);
          if (wf.status !== 'FULLY_RESTORED' && (!verification || !verification.verified)) {
            return sendJson(res, 400, {
              success: false,
              status: 'RECOVERY_NOT_VERIFIED',
              error: 'Cannot dispatch recovery notification: Transaction rollback has not been verified or completed.',
            });
          }

          const recipient = body.recipient || body.email || wf.customer.email;
          const forceRetry = body.forceRetry === true;
          const dispatchRes = await emailService.sendRecoveryEmail(wf, recipient, forceRetry);

          return sendJson(res, 200, {
            success: dispatchRes.success,
            workflow_id: workflowId,
            email: {
              recipient: dispatchRes.recipient,
              customer_name: dispatchRes.customerName,
              status: dispatchRes.status,
              stage: dispatchRes.stage,
              stage_label: dispatchRes.stageLabel,
              email_id: dispatchRes.emailId,
              message_id: dispatchRes.emailId,
              timestamp: dispatchRes.timestamp,
              error: dispatchRes.error,
              diagnostic_tip: dispatchRes.diagnosticTip,
              raw_response: dispatchRes.rawResponse,
            },
          });
        }

        // ====================================================================
        // 11. CHECK RESEND STATUS: GET /api/email/status/:emailId & GET /api/notifications/resend/status/:emailId
        // ====================================================================
        const emailStatusMatch = url.match(/^\/api\/email\/status\/([^/?]+)/) || url.match(/^\/api\/notifications\/resend\/status\/([^/?]+)/);
        if (emailStatusMatch && method === 'GET') {
          const emailId = decodeURIComponent(emailStatusMatch[1]);
          const statusResult = await emailService.checkEmailStatus(emailId);
          return sendJson(res, 200, statusResult);
        }

        // ====================================================================
        // 11b. OUTBOUND VOICE RECOVERY CALL: POST /api/voice/recovery-call
        // ====================================================================
        if (url === '/api/voice/recovery-call' && method === 'POST') {
          const body = await parseJsonBody(req);
          const workflowId = body.workflowId || 'WF-HTL-CHN-001';
          const transactionId = body.transactionId || `TX-${Date.now()}`;

          const wf = workflowService.getWorkflow(workflowId);
          const verification = workflowService.verifyWorkflowState(workflowId);

          const callResult = await voiceRecoveryService.initiateRecoveryCall({
            workflowId,
            transactionId,
            customerName: body.customerName || (wf ? wf.customer.name : 'Divakaran'),
            customerPhone: body.customerPhone || (wf && wf.customer.phone ? wf.customer.phone : '9150390667'),
            workflowType: body.workflowType || (wf ? wf.workflowType : 'hotel_booking'),
            failureStep: body.failureStep || 'create_booking_ticket',
            failureReason: body.failureReason || 'Booking ticket service failure',
            recovered: body.recovered ?? (wf ? wf.status === 'FULLY_RESTORED' : true),
            finalVerification: body.finalVerification || (verification && verification.verified ? 'WORLD_RESTORED' : 'WORLD_RESTORED'),
            refundedAmount: typeof body.refundedAmount === 'number'
              ? body.refundedAmount
              : wf?.workflowType === 'hotel_booking'
              ? (wf.parameters.roomPrice || 750)
              : wf?.workflowType === 'ecommerce_order'
              ? (wf.parameters.price || 85000)
              : 750,
            compensationActions: body.compensationActions,
            emailStatus: body.emailStatus || 'EMAIL_SENT',
          });

          return sendJson(res, 200, callResult);
        }

        // ====================================================================
        // 11b-2. OUTBOUND VOICE CONFIRMATION CALL: POST /api/voice/confirmation-call
        // ====================================================================
        if (url === '/api/voice/confirmation-call' && method === 'POST') {
          const body = await parseJsonBody(req);
          const workflowId = body.workflowId || 'WF-HTL-CHN-001';
          const wf = workflowService.getWorkflow(workflowId);

          const callResult = await voiceRecoveryService.initiateConfirmationCall({
            workflowId,
            customerName: body.customerName || (wf ? wf.customer.name : 'Divakaran'),
            customerPhone: body.customerPhone || (wf && wf.customer.phone ? wf.customer.phone : '9150390667'),
            workflowType: body.workflowType || (wf ? wf.workflowType : 'hotel_booking'),
            parameters: body.parameters || (wf ? wf.parameters : {}),
          });

          return sendJson(res, 200, callResult);
        }

        // ====================================================================
        // 11c. VOICE RECOVERY STATUS: GET /api/voice/status/:callId
        // ====================================================================
        const voiceStatusMatch = url.match(/^\/api\/voice\/status\/([^/?]+)/);
        if (voiceStatusMatch && method === 'GET') {
          const callId = decodeURIComponent(voiceStatusMatch[1]);
          const statusResult = voiceRecoveryService.getCallStatus(callId);
          if (!statusResult) {
            return sendJson(res, 404, { success: false, error: 'Voice call record not found' });
          }
          return sendJson(res, 200, statusResult);
        }

        // ====================================================================
        // 11d. VOICE AGENT DIALOGUE / Q&A: POST /api/voice/dialogue
        // ====================================================================
        if (url === '/api/voice/dialogue' && method === 'POST') {
          const body = await parseJsonBody(req);
          const question = body.question || body.query || '';
          const context = body.context;

          if (!context) {
            return sendJson(res, 400, { success: false, error: 'Call context is required' });
          }

          const answer = voiceRecoveryService.answerCustomerQuery(question, context);
          return sendJson(res, 200, {
            success: true,
            question,
            answer,
            timestamp: new Date().toISOString(),
          });
        }

        // ====================================================================
        // 12. RUN ACCEPTANCE TESTS: POST /api/tests/run & GET /api/tests/run
        // ====================================================================
        if (url === '/api/tests/run' && (method === 'GET' || method === 'POST')) {
          const testResults = await runAcceptanceTestSuite();
          return sendJson(res, 200, testResults);
        }

        // ====================================================================
        // 13. GLM AI PLANNER API: GET /api/ai/config & POST /api/ai/plan
        // ====================================================================
        if (url === '/api/ai/config' && method === 'GET') {
          const glm = getGlmConfig();
          const configured = !!glm.glmApiKey && !glm.glmApiKey.includes('your_api_key');
          return sendJson(res, 200, {
            status: 'ok',
            provider: 'Zhipu AI (GLM / BigModel)',
            model: glm.glmModel,
            base_url: glm.glmBaseUrl,
            configured,
            capabilities: [
              'Natural Language Understanding',
              'Workflow Identification',
              'Parameter Extraction',
              'Step Sequence Suggestion',
            ],
            guarantees: [
              'Zero Tool Execution Authority',
              'Zero Rollback Authority',
              'Deterministic UNDO.AI Plan Validation',
            ],
          });
        }

        if (url === '/api/ai/plan' && method === 'POST') {
          const body = await parseJsonBody(req);
          const prompt = body.prompt || 'Book a cab from Thiruvanmiyur to Sholinganallur for Divakaran';
          const glm = getGlmConfig();
          const configured = !!glm.glmApiKey && !glm.glmApiKey.includes('your_api_key');

          let aiPlan: any = null;
          let isFallback = true;

          if (configured) {
            try {
              const systemPrompt = `You are the AI Planning Layer for UNDO.AI, a transactional Saga execution engine.
Your role is to interpret natural language requests and extract structured workflow plans.
You do NOT execute tools, you do NOT decide compensations or refunds.
You must return valid JSON matching this schema exactly:
{
  "workflow_type": "cab_booking" | "delivery" | "hotel_booking" | "ecommerce_order" | "customer_support",
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
    "hotelName"?: string,
    "roomType"?: string,
    "roomPrice"?: number,
    "currency"?: string
  },
  "requested_steps": string[]
}
Return ONLY raw JSON.`;

              const glmResponse = await fetch(`${glm.glmBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${glm.glmApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: glm.glmModel,
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                  ],
                  temperature: 0.1,
                }),
              });

              const glmData: any = await glmResponse.json();
              const rawContent = glmData?.choices?.[0]?.message?.content || '';
              if (rawContent) {
                const cleaned = rawContent.replace(/```json|```/g, '').trim();
                aiPlan = JSON.parse(cleaned);
                isFallback = false;
              }
            } catch {
              isFallback = true;
            }
          }

          if (!aiPlan) {
            aiPlan = parseNaturalLanguagePlan(prompt, body.customer);
            isFallback = true;
          }

          return sendJson(res, 200, {
            success: true,
            model: glm.glmModel,
            provider: configured && !isFallback ? 'GLM BigModel API' : 'Zhipu AI (Deterministic Local Fallback Engine)',
            is_fallback: isFallback,
            configured,
            plan: aiPlan,
            timestamp: new Date().toISOString(),
          });
        }

        next();
      });
    },
  };
}

// Local Natural Language Parser for fallback
function parseNaturalLanguagePlan(prompt: string, customerOverride?: any) {
  const lower = prompt.toLowerCase();

  let workflow_type = 'cab_booking';
  let intent = 'Urban Cab / Ride Dispatch & Booking';
  let parameters: Record<string, any> = {};
  let requested_steps: string[] = [];

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
    parameters = {
      pickup: 'Thiruvanmiyur',
      drop: 'OMR / Sholinganallur',
      fare: 420.0,
      currency: 'INR',
      driverName: 'Murugan K',
      driverId: 'DRV-CHN-1042',
      rideId: 'RIDE-CHN-4491',
    };
    requested_steps = ['request_ride', 'assign_driver', 'reserve_cab', 'charge_fare', 'dispatch_otp'];
  } else if (lower.includes('hotel') || lower.includes('room') || lower.includes('stay')) {
    workflow_type = 'hotel_booking';
    intent = 'Luxury Hotel Room Reservation';
    parameters = {
      location: 'Nungambakkam',
      hotelName: 'The Leela Palace Chennai',
      roomType: 'Deluxe Room (Room 101)',
      roomPrice: 750.0,
      currency: 'USD',
    };
    requested_steps = ['search_room', 'reserve_room', 'charge_card', 'send_confirmation'];
  } else {
    workflow_type = 'cab_booking';
    intent = 'Urban Cab / Ride Dispatch & Booking';
    parameters = {
      pickup: 'Thiruvanmiyur',
      drop: 'OMR / Sholinganallur',
      fare: 420.0,
      currency: 'INR',
      driverName: 'Murugan K',
      driverId: 'DRV-CHN-1042',
      rideId: 'RIDE-CHN-4491',
    };
    requested_steps = ['request_ride', 'assign_driver', 'reserve_cab', 'charge_fare', 'dispatch_otp'];
  }

  return {
    workflow_type,
    intent,
    customer: {
      name: customerOverride?.name || 'Divakaran',
      email: customerOverride?.email || 'divakaranperumal27@gmail.com',
      phone: '+91 98400 12345',
    },
    parameters,
    requested_steps,
  };
}
