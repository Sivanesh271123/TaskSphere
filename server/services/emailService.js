/**
 * TaskSphere Email Service — Nodemailer Gmail SMTP (Port 465 SSL)
 * Handles SMTP transporter initialization, sample test email dispatching,
 * password reset OTP emails, and scheduled task reminder notifications.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Creates and configures a Nodemailer SMTP Transporter for Gmail on SSL port 465.
 * @returns {Object} Nodemailer Transporter
 */
export function createTransporter() {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  console.log('[SMTP CONFIG LOG]', {
    host,
    port,
    secure: true,
    userConfigured: !!user,
    passConfigured: !!pass
  });

  return nodemailer.createTransport({
    host,
    port,
    secure: true, // SSL for port 465
    auth: {
      user,
      pass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
}

/**
 * Sends a sample test email to verify Nodemailer SMTP connection.
 * @param {string} toEmail - Recipient email address
 * @returns {Promise<Object>} Send info response from Nodemailer
 */
export async function sendTestEmail(toEmail) {
  const user = process.env.EMAIL_USER;
  const from = process.env.EMAIL_FROM || (user ? `TaskSphere <${user}>` : 'TaskSphere');
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TaskSphere SMTP Test Email</title>
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
                  <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF; text-align: center;">SMTP Test Email Connection</h2>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 20px; color: #B3B3B3; font-size: 15px; line-height: 1.6; text-align: center;">
                  Congratulations! Your TaskSphere email notification system is successfully configured and connected via Gmail SMTP (SSL Port 465) using Nodemailer.
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 16px 0;">
                  <div style="padding: 14px 20px; background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 10px; color: #34D399; font-size: 14px; font-weight: 700;">
                    ✅ SMTP Status: Connected & Verified
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
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: 'TaskSphere - Sample Test Email',
      html: htmlContent
    });
    console.log(`[EMAIL SERVICE] Test email sent successfully to recipient (Message ID: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error('[EMAIL SERVICE ERROR] Test email failed:', err.message || err);
    throw err;
  }
}

/**
 * Sends a 6-digit password reset verification code (OTP) email.
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit verification code
 * @returns {Promise<boolean>} True if email dispatched successfully, false otherwise
 */
export async function sendPasswordResetOTP(email, otp) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || (user ? `TaskSphere <${user}>` : process.env.EMAIL_USER);

  if (!user || !pass) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send password reset OTP: EMAIL_USER or EMAIL_PASS is missing in environment.`);
    return false;
  }

  const transporter = createTransporter();

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
    console.log(`[EMAIL SERVICE] Dispatching password reset OTP via Gmail SMTP (Port 465 SSL)...`);
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: 'TaskSphere Password Reset Verification Code',
      html: htmlContent
    });

    console.log(`[EMAIL SERVICE] Password reset OTP email sent successfully (Message ID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send password reset OTP:`, err.message || err);
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
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || (user ? `TaskSphere <${user}>` : process.env.EMAIL_USER);

  if (!user || !pass) {
    console.warn(`[EMAIL SERVICE] Skipping email reminder to recipient (Missing EMAIL_USER or EMAIL_PASS).`);
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
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html: htmlContent
    });
    console.log(`[EMAIL SERVICE] Sent ${type} reminder to recipient for task "${taskData.title}" (Message ID: ${info.messageId})`);
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send reminder email:`, err.message || err);
  }
}

const EmailService = {
  createTransporter,
  sendTestEmail,
  sendPasswordResetOTP,
  sendTaskReminderEmail
};

export default EmailService;
