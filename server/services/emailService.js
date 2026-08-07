/**
 * TaskSphere Email Service
 * Handles SMTP transporter initialization, credential validation,
 * sample test email dispatching, password reset OTP emails, and task reminder notifications.
 * 
 * Configured dynamically via environment variables (.env):
 * - EMAIL_HOST (e.g. smtp.gmail.com)
 * - EMAIL_PORT (e.g. 587 or 465)
 * - EMAIL_USER (e.g. your_email@gmail.com)
 * - EMAIL_PASS (e.g. your 16-character Gmail App Password)
 * - EMAIL_FROM (e.g. TaskSphere <your_email@gmail.com>)
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates that all required SMTP environment variables are present and not empty placeholders.
 * @throws {Error} if any required variable is missing or placeholder.
 */
export function validateSMTPConfig() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  const missing = [];
  if (!host) missing.push('EMAIL_HOST');
  if (!user) missing.push('EMAIL_USER');
  if (!pass) missing.push('EMAIL_PASS');

  if (missing.length > 0) {
    throw new Error(`Missing required SMTP environment variables: ${missing.join(', ')}`);
  }

  if (pass.includes('your_') || pass.includes('placeholder') || user.includes('your_email')) {
    throw new Error('SMTP credentials in .env are placeholder values. Please update EMAIL_USER and EMAIL_PASS with valid Gmail App Password.');
  }

  return { host, user, pass };
}

/**
 * Creates a Nodemailer transporter configured with environment variables.
 * @returns {Object} Nodemailer Transporter
 */
export function createTransporter() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

/**
 * Sends a sample test email to verify Nodemailer SMTP connection.
 * @param {string} toEmail - Recipient email address
 * @returns {Promise<Object>} Send info response from Nodemailer
 */
export async function sendTestEmail(toEmail) {
  validateSMTPConfig();

  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const from = process.env.EMAIL_FROM || `TaskSphere <${user}>`;
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
                  Congratulations! Your TaskSphere email notification system is successfully configured and connected via Gmail SMTP using Nodemailer.
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 16px 0;">
                  <div style="padding: 14px 20px; background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 10px; color: #34D399; font-size: 14px; font-weight: 700;">
                    ✅ SMTP Status: Connected & Verified
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); color: #737373; font-size: 12px; text-align: center;">
                  © TaskSphere • Executive Task Management System
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'TaskSphere - Sample Test Email',
    html: htmlContent
  });

  console.log(`[EMAIL SERVICE] Test email sent successfully to ${toEmail} (Message ID: ${info.messageId})`);
  return info;
}

/**
 * Sends a 6-digit password reset verification code (OTP) email.
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit verification code
 */
export async function sendPasswordResetOTP(email, otp) {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || (user ? `TaskSphere <${user}>` : 'TaskSphere <no-reply@tasksphere.io>');

  const isPlaceholder = !pass || pass.includes('your_') || pass.includes('placeholder') || !user || user.includes('example');

  if (isPlaceholder || !host) {
    console.log(`\n  ==============================================================`);
    console.log(`  🔑 [DEVELOPMENT OTP VERIFICATION CODE]`);
    console.log(`  Target Email: ${email}`);
    console.log(`  Verification Code: ${otp}`);
    console.log(`  Note: To send actual emails, set valid SMTP credentials in .env`);
    console.log(`  ==============================================================\n`);
    return true;
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
              
              <!-- Brand Header -->
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <div style="display: inline-block; padding: 10px 16px; border-radius: 12px; background: rgba(244, 197, 66, 0.1); border: 1px solid rgba(244, 197, 66, 0.3);">
                    <span style="font-size: 20px; font-weight: 800; color: #F4C542; letter-spacing: -0.5px;">⚡ TaskSphere</span>
                  </div>
                </td>
              </tr>

              <!-- Heading -->
              <tr>
                <td style="padding-bottom: 16px;">
                  <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF; text-align: center;">Password Reset Verification</h2>
                </td>
              </tr>

              <!-- Greeting & Context -->
              <tr>
                <td style="padding-bottom: 20px; color: #B3B3B3; font-size: 15px; line-height: 1.6; text-align: center;">
                  Hello,<br>
                  We received a request to reset the password for your TaskSphere account. Use the 6-digit verification code below to proceed:
                </td>
              </tr>

              <!-- OTP Code Display Badge -->
              <tr>
                <td align="center" style="padding: 16px 0 24px;">
                  <div style="display: inline-block; padding: 14px 28px; background: #141418; border: 2px solid #F4C542; border-radius: 12px; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #F4C542; font-family: monospace;">
                    ${otp}
                  </div>
                </td>
              </tr>

              <!-- Expiry & Ignore Notice -->
              <tr>
                <td style="padding-bottom: 20px; color: #B3B3B3; font-size: 14px; line-height: 1.5; text-align: center;">
                  ⏱️ <strong>This code expires in 10 minutes.</strong><br>
                  If you didn't request this password reset, ignore this email.
                </td>
              </tr>

              <!-- Security Notice -->
              <tr>
                <td style="padding: 14px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; color: #EF4444; font-size: 13px; text-align: center; font-weight: 600;">
                  🔒 <strong>Security Notice:</strong> Never share this verification code.
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.08); margin-top: 24px; color: #737373; font-size: 12px; text-align: center;">
                  © TaskSphere
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
    await transporter.sendMail({
      from,
      to: email,
      subject: 'TaskSphere Password Reset Verification Code',
      html: htmlContent
    });
    console.log(`[EMAIL SERVICE] Sent password reset OTP email to ${email}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send password reset OTP to ${email}:`, err.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n  🔑 [DEV FALLBACK OTP CODE]: ${otp} (Recipient: ${email})\n`);
      return true;
    }
    throw err;
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
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || (user ? `TaskSphere <${user}>` : 'TaskSphere <no-reply@tasksphere.io>');

  const isPlaceholder = !pass || pass.includes('your_') || pass.includes('placeholder') || !user || user.includes('example');
  if (isPlaceholder || !host) {
    console.warn(`[EMAIL SERVICE] Skipping email reminder to ${to} (Missing/Placeholder SMTP Config).`);
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
        
        ${taskData.description ? `<p style="color: #4b5563; line-height: 1.5; margin-bottom: 20px;">${taskData.description}</p>` : ''}
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #6b7280; font-size: 14px; width: 40%;"><strong>Category:</strong></td>
              <td style="padding: 5px 0; color: #111827; font-size: 14px;">
                <span style="display: inline-block; padding: 2px 8px; background-color: #e5e7eb; border-radius: 12px; font-size: 12px;">${taskData.category || 'None'}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #6b7280; font-size: 14px;"><strong>Priority:</strong></td>
              <td style="padding: 5px 0; color: #111827; font-size: 14px;">${taskData.priority || 'Medium'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #6b7280; font-size: 14px;"><strong>Due Date:</strong></td>
              <td style="padding: 5px 0; color: #111827; font-size: 14px;">${taskData.dueDate || 'No Date'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #6b7280; font-size: 14px;"><strong>Due Time:</strong></td>
              <td style="padding: 5px 0; color: #111827; font-size: 14px;">${taskData.dueTime || 'No Time'}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${appUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">Open in TaskSphere</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>You received this email because you have an upcoming task in TaskSphere.</p>
      </div>
    </div>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from,
      to,
      subject,
      html: htmlContent
    });
    console.log(`[EMAIL SERVICE] Sent ${type} reminder to ${to} for task "${taskData.title}"`);
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send email to ${to}:`, err.message);
  }
}

const EmailService = {
  validateSMTPConfig,
  createTransporter,
  sendTestEmail,
  sendPasswordResetOTP,
  sendTaskReminderEmail
};

export default EmailService;
