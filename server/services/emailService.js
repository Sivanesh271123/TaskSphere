/**
 * TaskSphere Email Service (Resend Migration)
 * Handles dispatching sample test emails, password reset OTP emails,
 * and task reminder notifications via Resend's HTTPS API.
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

console.log("[DEBUG] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
console.log(
  "[DEBUG] RESEND_API_KEY prefix:",
  process.env.RESEND_API_KEY
    ? process.env.RESEND_API_KEY.substring(0, 5)
    : "undefined"
);

// Initialize Resend SDK
const resend = new Resend(process.env.RESEND_API_KEY);

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

  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

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
    const data = await resend.emails.send({
      from,
      to: [toEmail],
      subject: 'TaskSphere - Sample Test Email',
      html: htmlContent
    });
    console.log(`[EMAIL SERVICE] Test email sent successfully to ${toEmail} (ID: ${data.id})`);
    return data;
  } catch (error) {
    console.error('[EMAIL SERVICE ERROR] Test email failed:', error.message);
    throw error;
  }
}

/**
 * Sends a 6-digit password reset verification code (OTP) email.
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit verification code
 */
export async function sendPasswordResetOTP(email, otp) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!apiKey || apiKey === 'your_resend_api_key') {
    console.error(`[EMAIL SERVICE ERROR] Failed to send password reset OTP to ${email}: RESEND_API_KEY is missing.`);
    return false;
  }

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
    const data = await resend.emails.send({
      from,
      to: [email],
      subject: 'TaskSphere Password Reset Verification Code',
      html: htmlContent
    });
    console.log(`[EMAIL SERVICE] Sent password reset OTP email to ${email}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send password reset OTP to ${email}:`, err.message);
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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!apiKey || apiKey === 'your_resend_api_key') {
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
    await resend.emails.send({
      from,
      to: [to],
      subject,
      html: htmlContent
    });
    console.log(`[EMAIL SERVICE] Sent ${type} reminder to ${to} for task "${taskData.title}"`);
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send email to ${to}:`, err.message);
  }
}

const EmailService = {
  sendTestEmail,
  sendPasswordResetOTP,
  sendTaskReminderEmail
};

export default EmailService;
