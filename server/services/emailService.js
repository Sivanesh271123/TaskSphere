/**
 * TaskSphere Email Service — Resend HTTP API Integration
 * Handles email dispatching via Resend's HTTPS REST API (Port 443).
 * Supports sample test emails, password reset OTP emails, and scheduled task reminder notifications.
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends an email using Resend's HTTP REST API via HTTPS (Port 443).
 * @param {Object} params
 * @param {string|string[]} params.to - Recipient email address or array of addresses
 * @param {string} params.subject - Email subject line
 * @param {string} params.html - HTML content of the email
 * @param {string} [params.from] - Custom sender address (defaults to EMAIL_FROM or onboarding@resend.dev)
 * @returns {Promise<Object>} Resend API response ({ id })
 */
export async function sendEmailViaResend({ to, subject, html, from }) {
  const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_PASS;
  
  if (!apiKey) {
    console.error('[EMAIL SERVICE ERROR] RESEND_API_KEY is missing in environment variables.');
    throw new Error('RESEND_API_KEY is missing in environment variables.');
  }

  const defaultFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'TaskSphere <onboarding@resend.dev>';
  const fromAddress = from || defaultFrom;
  const recipient = Array.isArray(to) ? to : [to];

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromAddress,
      to: recipient,
      subject,
      html
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || data.error || `Resend HTTP API error status ${response.status}`;
    console.error(`[EMAIL SERVICE ERROR] Resend HTTP API dispatch failed (${response.status}):`, errorMsg);
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Sends a sample test email to verify Resend HTTP API connection.
 * @param {string} toEmail - Recipient email address
 * @returns {Promise<Object>} Resend API response { id }
 */
export async function sendTestEmail(toEmail) {
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'TaskSphere <onboarding@resend.dev>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TaskSphere Resend Email API Test</title>
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
                  <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF; text-align: center;">Resend Email API Test</h2>
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
                    ✅ Resend API Status: Connected & Verified
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
    console.log(`[EMAIL SERVICE] Dispatching test email via Resend HTTP API...`);
    const data = await sendEmailViaResend({
      from,
      to: toEmail,
      subject: 'TaskSphere - Sample Test Email',
      html: htmlContent
    });
    console.log(`[EMAIL SERVICE] Test email dispatched successfully (Resend ID: ${data.id})`);
    return data;
  } catch (err) {
    console.error('[EMAIL SERVICE ERROR] Test email failed:', err.message || err);
    throw err;
  }
}

/**
 * Sends a 6-digit password reset verification code (OTP) email via Resend HTTP API.
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit verification code
 * @returns {Promise<boolean>} True if email dispatched successfully, false otherwise
 */
export async function sendPasswordResetOTP(email, otp) {
  const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_PASS;
  if (!apiKey) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send password reset OTP: RESEND_API_KEY is missing in environment.`);
    return false;
  }

  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'TaskSphere <onboarding@resend.dev>';

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

  try {
    console.log(`[EMAIL SERVICE] Dispatching password reset OTP email via Resend HTTP API...`);
    const data = await sendEmailViaResend({
      from,
      to: email,
      subject: 'TaskSphere Password Reset Verification Code',
      html: htmlContent
    });

    console.log(`[EMAIL SERVICE] Password reset OTP email sent successfully (Resend ID: ${data.id})`);
    return true;
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send password reset OTP:`, err.message || err);
    return false;
  }
}

/**
 * Sends a stylized HTML email task reminder via Resend HTTP API.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {Object} taskData - Task details object
 * @param {string} type - Reminder type ('30min', '1day', 'overdue')
 * @returns {Promise<boolean>}
 */
export async function sendTaskReminderEmail(to, subject, taskData, type) {
  const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_PASS;
  if (!apiKey) {
    console.warn(`[EMAIL SERVICE] Skipping email reminder (RESEND_API_KEY is missing).`);
    return false;
  }

  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'TaskSphere <onboarding@resend.dev>';
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
    const data = await sendEmailViaResend({
      from,
      to,
      subject,
      html: htmlContent
    });
    console.log(`[EMAIL SERVICE] Sent ${type} reminder for task "${taskData.title}" (Resend ID: ${data.id})`);
    return true;
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send reminder email:`, err.message || err);
    return false;
  }
}

const EmailService = {
  sendEmailViaResend,
  sendTestEmail,
  sendPasswordResetOTP,
  sendTaskReminderEmail
};

export default EmailService;
