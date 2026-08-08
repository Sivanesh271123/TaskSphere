/**
 * TaskSphere Email Service — Gmail API HTTPS REST Integration (OAuth2)
 * Dispatches emails over standard HTTPS (Port 443) using Google OAuth2 credentials.
 * Bypasses cloud host SMTP port blocking (ports 25, 465, 587) with zero cost.
 */

import dotenv from 'dotenv';
import * as Brevo from '@getbrevo/brevo';

dotenv.config();

/**
 * Obtains a fresh OAuth2 access token from Google's OAuth2 token endpoint using a refresh token.
 * @returns {Promise<string>} OAuth2 Access Token
 */
export async function getAccessToken() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (
    !clientId || clientId.includes('your_') ||
    !clientSecret || clientSecret.includes('your_') ||
    !refreshToken || refreshToken.includes('your_')
  ) {
    console.error('[EMAIL SERVICE ERROR] Gmail OAuth2 environment variables are missing or unconfigured in .env (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN).');
    throw new Error('Gmail OAuth2 credentials are unconfigured in .env. Generate your refresh token at http://localhost:3000/oauth2login.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error_description || data.error || `HTTP ${response.status} obtaining access token`;
    console.error('[EMAIL SERVICE ERROR] Failed to acquire OAuth2 access token from Google.');
    throw new Error(`Google OAuth2 Token Error: ${errorMsg}`);
  }

  return data.access_token;
}

/**
 * Constructs a Base64URL-encoded RFC 2822 MIME raw email payload.
 * @param {Object} params - { to, from, subject, html }
 * @returns {string} Base64URL encoded string
 */
function buildRawMimeMessage({ to, from, subject, html }) {
  const recipientStr = Array.isArray(to) ? to.join(', ') : to;
  const mimeLines = [
    `From: ${from}`,
    `To: ${recipientStr}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html
  ];

  const rawMimeStr = mimeLines.join('\r\n');

  return Buffer.from(rawMimeStr, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Dispatches an email using the Gmail REST API over HTTPS (Port 443).
 * @param {Object} params - { to, subject, html, from }
 * @returns {Promise<Object>} Gmail API response ({ id, threadId })
 */
export async function sendEmailViaGmailAPI({ to, subject, html, from }) {
  const accessToken = await getAccessToken();

  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER || 'me';
  const defaultFrom = process.env.EMAIL_FROM || (process.env.GMAIL_USER ? `TaskSphere <${process.env.GMAIL_USER}>` : `TaskSphere <${gmailUser}>`);
  const fromAddress = from || defaultFrom;

  const rawMessage = buildRawMimeMessage({
    to,
    from: fromAddress,
    subject,
    html
  });

  const response = await fetch('https://gmail.googleapis.com/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: rawMessage
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error?.message || `Gmail API HTTP ${response.status}`;
    console.error(`[EMAIL SERVICE ERROR] Gmail API dispatch failed (${response.status}):`, errorMsg);
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Sends a sample test email to verify Gmail API HTTPS connection.
 * @param {string} toEmail - Recipient email address
 * @returns {Promise<Object>} Gmail API send result { id, threadId }
 */
export async function sendTestEmail(toEmail) {
  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const from = process.env.EMAIL_FROM || (gmailUser ? `TaskSphere <${gmailUser}>` : 'TaskSphere');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TaskSphere Gmail API Test Email</title>
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
                  <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF; text-align: center;">Gmail API HTTPS Test</h2>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 20px; color: #B3B3B3; font-size: 15px; line-height: 1.6; text-align: center;">
                  Congratulations! Your TaskSphere email notification system is successfully configured and connected via Gmail API (OAuth2 HTTPS REST over Port 443).
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 16px 0;">
                  <div style="padding: 14px 20px; background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 10px; color: #34D399; font-size: 14px; font-weight: 700;">
                    ✅ Gmail API Status: Connected & Verified (Port 443 HTTPS)
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
    console.log(`[EMAIL SERVICE] Dispatching test email via Gmail API HTTPS...`);
    const data = await sendEmailViaGmailAPI({
      from,
      to: toEmail,
      subject: 'TaskSphere - Sample Test Email (Gmail API)',
      html: htmlContent
    });
    console.log(`[EMAIL SERVICE] Test email dispatched successfully (Gmail API Message ID: ${data.id})`);
    return data;
  } catch (err) {
    console.error('[EMAIL SERVICE ERROR] Test email failed:', err.message || err);
    throw err;
  }
}

/**
 * Sends a 6-digit password reset verification code (OTP) email via Gmail API HTTPS.
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit verification code
 * @returns {Promise<boolean>} True if email dispatched successfully, false otherwise
 */
export async function sendPasswordResetOTP(email, otp) {
  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const from = process.env.EMAIL_FROM || (gmailUser ? `TaskSphere <${gmailUser}>` : 'TaskSphere');

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
    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL || process.env.GMAIL_USER || 'sivanesh.e.m@gmail.com';

    if (brevoApiKey && !brevoApiKey.includes('your_')) {
      console.log(`[EMAIL SERVICE] Dispatching password reset OTP email via Brevo Transactional Email API to ${email}...`);
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'TaskSphere Security', email: senderEmail },
          to: [{ email: email }],
          replyTo: { email: senderEmail },
          subject: 'TaskSphere Password Reset Verification Code ⚡',
          htmlContent: htmlContent
        })
      });

      const brevoData = await brevoResponse.json();
      if (brevoResponse.ok) {
        console.log(`[EMAIL SERVICE] Password reset OTP email sent successfully via Brevo API (Message ID: ${brevoData.messageId})`);
        return true;
      }
      console.error(`[EMAIL SERVICE ERROR] Brevo API HTTP ${brevoResponse.status}:`, brevoData);
    }

    // Check if Gmail API OAuth2 credentials are configured
    const gmailClientId = process.env.GMAIL_CLIENT_ID;
    if (gmailClientId && !gmailClientId.includes('your_')) {
      console.log(`[EMAIL SERVICE] Dispatching password reset OTP email via Gmail API HTTPS...`);
      const data = await sendEmailViaGmailAPI({
        from,
        to: email,
        subject: 'TaskSphere Password Reset Verification Code',
        html: htmlContent
      });

      console.log(`[EMAIL SERVICE] Password reset OTP email sent successfully (Gmail API Message ID: ${data.id})`);
      return true;
    }

    // Development / Local Testing Fallback: Log OTP to console when API keys are not set yet
    console.log(`\n===========================================================`);
    console.log(`🔑 [DEV MODE] OTP Generated for ${email}: ${otp}`);
    console.log(`📌 To send real emails, set a valid BREVO_API_KEY in .env`);
    console.log(`===========================================================\n`);
    return true;
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send password reset OTP:`, err.message || err);
    return false;
  }
}

export async function sendTaskReminderEmail(to, subject, taskData, type) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const senderEmail = process.env.SENDER_EMAIL || (gmailUser ? `TaskSphere <${gmailUser}>` : 'sivanesh.e.m@gmail.com');
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  
  let headerColor = '#3b82f6';
  let typeLabel = 'Upcoming Task Reminder';
  
  if (type === '30min') {
    headerColor = '#f97316';
    typeLabel = '⏰ Task Due in 30 Minutes';
  } else if (type === 'overdue') {
    headerColor = '#ef4444';
    typeLabel = '🚨 Task Overdue Notice';
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TaskSphere Reminder</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #0e0e10; color: #ffffff; }
        .card { max-width: 520px; margin: 0 auto; background: #17171b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { background: ${headerColor}; padding: 24px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
        .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
        .body { padding: 30px; text-align: center; }
        .task-title { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; }
        .task-details { background: rgba(255,255,255,0.05); border-radius: 10px; padding: 16px; font-size: 14px; color: #b3b3b3; margin-bottom: 24px; text-align: left; }
        .btn { display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; }
        .footer { font-size: 12px; color: #666; text-align: center; padding: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>⚡ TaskSphere</h1>
          <p>${typeLabel}</p>
        </div>
        <div class="body">
          <div class="task-title">${taskData.title || 'Untitled Task'}</div>
          <div class="task-details">
            📅 <strong>Due Date:</strong> ${taskData.dueDate || 'Today'}<br>
            ⏰ <strong>Due Time:</strong> ${taskData.dueTime || 'Not set'}<br>
            📌 <strong>Priority:</strong> ${taskData.priority || 'Medium'}
          </div>
          <a href="${appUrl}" class="btn">Open TaskSphere Dashboard</a>
        </div>
        <div class="footer">&copy; TaskSphere Productivity Workspace</div>
      </div>
    </body>
    </html>
  `;

  if (brevoApiKey && !brevoApiKey.includes('your_')) {
    try {
      console.log(`[EMAIL SERVICE] Dispatching ${type} task reminder email to ${to} via Brevo API...`);
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'TaskSphere Reminders', email: 'sivanesh.e.m@gmail.com' },
          to: [{ email: to }],
          replyTo: { email: 'sivanesh.e.m@gmail.com' },
          subject: subject,
          htmlContent: htmlContent
        })
      });

      const brevoData = await brevoResponse.json();
      if (brevoResponse.ok) {
        console.log(`[EMAIL SERVICE] ${type} task reminder email sent via Brevo API (Message ID: ${brevoData.messageId})`);
        return true;
      }
      console.error(`[EMAIL SERVICE ERROR] Brevo API HTTP ${brevoResponse.status}:`, brevoData);
    } catch (err) {
      console.error(`[EMAIL SERVICE ERROR] Brevo dispatch error:`, err.message || err);
    }
  }

  // Fallback to Gmail API if configured
  const gmailClientId = process.env.GMAIL_CLIENT_ID;
  if (gmailClientId && !gmailClientId.includes('your_')) {
    try {
      const data = await sendEmailViaGmailAPI({
        from: senderEmail,
        to,
        subject,
        html: htmlContent
      });
      console.log(`[EMAIL SERVICE] Sent ${type} reminder for task "${taskData.title}" (Gmail API Message ID: ${data.id})`);
      return true;
    } catch (err) {
      console.error(`[EMAIL SERVICE ERROR] Failed to send reminder email via Gmail:`, err.message || err);
      return false;
    }
  }

  console.log(`\n===========================================================`);
  console.log(`🔔 [REMINDER DEV MODE] ${typeLabel} for ${to}: "${taskData.title}"`);
  console.log(`===========================================================\n`);
  return true;
}

const EmailService = {
  getAccessToken,
  sendEmailViaGmailAPI,
  sendTestEmail,
  sendPasswordResetOTP,
  sendTaskReminderEmail
};

export default EmailService;
