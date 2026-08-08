/**
 * TaskSphere Email Service (Resend Migration with Non-Hanging Timeout & Connectivity Diagnostics)
 * Handles dispatching sample test emails, password reset OTP emails,
 * and task reminder notifications via Resend's HTTPS API.
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

let resendClientInstance = null;

/**
 * Lazily retrieves or instantiates the Resend client instance.
 * Avoids executing `new Resend()` at module import time so missing env vars won't crash process boot.
 * @returns {Resend|null} Initialized Resend client or null if key is missing
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  console.log("[DEBUG] RESEND_API_KEY exists:", !!apiKey);
  console.log("[DEBUG] RESEND_API_KEY length:", apiKey?.length || 0);
  console.log(
    "[DEBUG] RESEND_API_KEY prefix:",
    apiKey ? apiKey.substring(0, 5) : "undefined"
  );

  if (!apiKey || apiKey === 'your_resend_api_key') {
    return null;
  }

  if (!resendClientInstance) {
    resendClientInstance = new Resend(apiKey);
  }
  return resendClientInstance;
}

/**
 * Executes a promise with an 8-second strict timeout to prevent API calls from hanging indefinitely.
 * @param {Promise} promise 
 * @param {number} ms 
 * @returns {Promise}
 */
async function withTimeout(promise, ms = 8000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`Resend API request timed out after ${ms}ms`);
      err.name = 'TimeoutError';
      reject(err);
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Server-side connectivity test to verify Render host can reach api.resend.com.
 */
export async function diagnoseResendConnectivity() {
  console.log(`[RESEND DIAGNOSTIC] Starting connectivity test to https://api.resend.com...`);
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://api.resend.com', {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timer);
    const elapsed = Date.now() - startTime;
    console.log(`[RESEND DIAGNOSTIC] ✅ Host reachable in ${elapsed}ms! HTTP Status: ${res.status}`);
    return true;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`[RESEND DIAGNOSTIC ERROR] ❌ Failed to connect to https://api.resend.com after ${elapsed}ms:`, {
      name: err.name,
      message: err.message,
      cause: err.cause,
      code: err.code,
      stack: err.stack
    });
    return false;
  }
}

/**
 * Validates that the RESEND_API_KEY is present.
 * @throws {Error} if the key is missing.
 */
function validateResendConfig() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY environment variable. Please set it to use the email service.');
  }
}

/**
 * Sends a sample test email to verify the Resend connection.
 * @param {string} toEmail - Recipient email address
 * @returns {Promise<Object>} Send info response from Resend
 */
export async function sendTestEmail(toEmail) {
  validateResendConfig();

  const resend = getResendClient();
  if (!resend) {
    throw new Error('Missing or invalid RESEND_API_KEY.');
  }

  const from = process.env.EMAIL_FROM || 'TaskSphere <onboarding@resend.dev>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TaskSphere Resend Test Email</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0E0E10; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #FFFFFF;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0E0E10; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 520px; background-color: #17171B; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 18px; padding: 36px 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <div style="display: inline-block; padding: 10px 16px; border-radius: 12px; background: rgba(244, 197, 66, 0.1); border: 1px solid rgba(244, 197, 66, 0.3);">
                    <span style="font-size: 20px; font-weight: 800; color: #F4C542; letter-spacing: -0.5px;">⚡ TaskSphere</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 16px;">
                  <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF; text-align: center;">Resend Test Email</h2>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 20px; color: #B3B3B3; font-size: 15px; line-height: 1.6; text-align: center;">
                  Congratulations! Your TaskSphere email notification system is successfully configured and connected via Resend HTTP API.
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 16px 0;">
                  <div style="padding: 14px 20px; background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 10px; color: #34D399; font-size: 14px; font-weight: 700;">
                    ✅ Resend API Status: Connected
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const { data, error } = await withTimeout(
      resend.emails.send({
        from,
        to: [toEmail],
        subject: 'TaskSphere - Sample Test Email',
        html: htmlContent
      }),
      8000
    );

    if (error) {
      console.error('[EMAIL SERVICE ERROR] Test email failed:', {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        cause: error.cause,
        stack: error.stack
      });
      throw new Error(error.message || 'Failed to send test email');
    }
    console.log(`[EMAIL SERVICE] Test email sent successfully to ${toEmail} (ID: ${data?.id})`);
    return data;
  } catch (error) {
    console.error('[EMAIL SERVICE ERROR] Test email exception:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      cause: error.cause,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Sends a 6-digit password reset verification code (OTP) email.
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit verification code
 */
export async function sendPasswordResetOTP(email, otp) {
  const resend = getResendClient();
  const from = process.env.EMAIL_FROM || 'TaskSphere <onboarding@resend.dev>';

  console.log(`[EMAIL SERVICE DEBUG] Preparing OTP dispatch. Recipient: "${email}", From: "${from}"`);

  if (!resend) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send password reset OTP to ${email}: RESEND_API_KEY is missing or placeholder.`);
    return false;
  }

  // Run quick non-blocking connectivity check
  await diagnoseResendConnectivity();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TaskSphere Password Reset Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0E0E10; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FFFFFF;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0E0E10; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 520px; background-color: #17171B; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 18px; padding: 36px 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <div style="display: inline-block; padding: 10px 16px; border-radius: 12px; background: rgba(244, 197, 66, 0.1); border: 1px solid rgba(244, 197, 66, 0.3);">
                    <span style="font-size: 20px; font-weight: 800; color: #F4C542; letter-spacing: -0.5px;">⚡ TaskSphere</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 16px;">
                  <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF; text-align: center;">Password Reset Verification</h2>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 20px; color: #B3B3B3; font-size: 15px; line-height: 1.6; text-align: center;">
                  Hello,<br>
                  We received a request to reset the password for your TaskSphere account. Use the 6-digit verification code below to proceed:
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 16px 0 24px;">
                  <div style="display: inline-block; padding: 14px 28px; background: #141418; border: 2px solid #F4C542; border-radius: 12px; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #F4C542; font-family: monospace;">
                    ${otp}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 20px; color: #B3B3B3; font-size: 14px; line-height: 1.5; text-align: center;">
                  ⏱️ <strong>This code expires in 10 minutes.</strong><br>
                  If you didn't request this password reset, ignore this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const startTime = Date.now();
  console.log(`[EMAIL SERVICE DEBUG] [START] Invoking resend.emails.send() with 8000ms timeout...`);

  try {
    const { data, error } = await withTimeout(
      resend.emails.send({
        from,
        to: [email],
        subject: 'TaskSphere Password Reset Verification Code',
        html: htmlContent
      }),
      8000
    );

    const elapsed = Date.now() - startTime;
    console.log(`[EMAIL SERVICE DEBUG] [FINISH] resend.emails.send() completed in ${elapsed}ms`);
    console.log("Resend response data:", data);

    if (error) {
      console.error("Resend API returned error:", {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        cause: error.cause,
        stack: error.stack
      });
      return false;
    }

    console.log(`[EMAIL SERVICE] Sent password reset OTP email to ${email} (ID: ${data?.id})`);
    return true;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`[EMAIL SERVICE ERROR] resend.emails.send() failed after ${elapsed}ms:`, {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      cause: err.cause,
      stack: err.stack
    });
    return false;
  }
}

/**
 * Sends a stylized HTML email task reminder.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {Object} taskData - Task details object
 * @param {string} type - Reminder type ('30min', '1day', 'overdue')
 */
export async function sendTaskReminderEmail(to, subject, taskData, type) {
  const resend = getResendClient();
  const from = process.env.EMAIL_FROM || 'TaskSphere <onboarding@resend.dev>';

  if (!resend) {
    console.warn(`[EMAIL SERVICE] Skipping email reminder to ${to} (Missing RESEND_API_KEY).`);
    return;
  }

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  
  let headerColor = '#3b82f6';
  let typeLabel = 'Upcoming Task';
  
  if (type === '30min') {
    headerColor = '#f97316';
    typeLabel = 'Due in 30 Minutes';
  } else if (type === 'overdue') {
    headerColor = '#ef4444';
    typeLabel = 'Task Overdue';
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
      <div style="background-color: ${headerColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TaskSphere Reminder</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">${typeLabel}</p>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="margin-top: 0; color: #1f2937;">${taskData.title}</h2>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${appUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">Open in TaskSphere</a>
        </div>
      </div>
    </div>
  `;

  try {
    const { data, error } = await withTimeout(
      resend.emails.send({
        from,
        to: [to],
        subject,
        html: htmlContent
      }),
      8000
    );

    if (error) {
      console.error(`[EMAIL SERVICE ERROR] Resend API rejected reminder email to ${to}:`, {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        cause: error.cause,
        stack: error.stack
      });
      return;
    }

    console.log(`[EMAIL SERVICE] Sent ${type} reminder to ${to} for task "${taskData.title}" (ID: ${data?.id})`);
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send email to ${to}:`, {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      cause: err.cause,
      stack: err.stack
    });
  }
}

const EmailService = {
  sendTestEmail,
  sendPasswordResetOTP,
  sendTaskReminderEmail,
  diagnoseResendConnectivity
};

export default EmailService;
