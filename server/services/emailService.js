/**
 * TaskSphere Email Service — Gmail API HTTPS REST Integration (OAuth2)
 * Dispatches emails over standard HTTPS (Port 443) using Google OAuth2 credentials.
 * Bypasses cloud host SMTP port blocking (ports 25, 465, 587) with zero cost.
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Obtains a fresh OAuth2 access token from Google's OAuth2 token endpoint using a refresh token.
 * @returns {Promise<string>} OAuth2 Access Token
 */
export async function getAccessToken() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('[EMAIL SERVICE ERROR] Missing required Gmail OAuth2 environment variables (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN).');
    throw new Error('Gmail OAuth2 credentials are incomplete in environment configuration.');
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
    console.log(`[EMAIL SERVICE] Dispatching password reset OTP email via Gmail API HTTPS...`);
    const data = await sendEmailViaGmailAPI({
      from,
      to: email,
      subject: 'TaskSphere Password Reset Verification Code',
      html: htmlContent
    });

    console.log(`[EMAIL SERVICE] Password reset OTP email sent successfully (Gmail API Message ID: ${data.id})`);
    return true;
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send password reset OTP:`, err.message || err);
    return false;
  }
}

/**
 * Sends a stylized HTML email task reminder via Gmail API HTTPS.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {Object} taskData - Task details object
 * @param {string} type - Reminder type ('30min', '1day', 'overdue')
 * @returns {Promise<boolean>}
 */
export async function sendTaskReminderEmail(to, subject, taskData, type) {
  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const from = process.env.EMAIL_FROM || (gmailUser ? `TaskSphere <${gmailUser}>` : 'TaskSphere');
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
    const data = await sendEmailViaGmailAPI({
      from,
      to,
      subject,
      html: htmlContent
    });
    console.log(`[EMAIL SERVICE] Sent ${type} reminder for task "${taskData.title}" (Gmail API Message ID: ${data.id})`);
    return true;
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send reminder email:`, err.message || err);
    return false;
  }
}

const EmailService = {
  getAccessToken,
  sendEmailViaGmailAPI,
  sendTestEmail,
  sendPasswordResetOTP,
  sendTaskReminderEmail
};

export default EmailService;
