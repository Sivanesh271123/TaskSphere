/**
 * TaskSphere Local Gmail OAuth2 Setup Helper
 * Generates Google OAuth authorization URL and handles the /oauth2callback endpoint
 * to exchange authorization codes for refresh tokens during local setup.
 */

import dotenv from 'dotenv';

dotenv.config();

const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

/**
 * Returns the Google OAuth2 authorization URL.
 * @returns {string|null} OAuth URL or null if client ID is missing
 */
export function getAuthUrl() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  if (!clientId || clientId.includes('your_google_client_id_here')) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: GMAIL_SCOPE,
    access_type: 'offline',
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Registers local OAuth helper endpoints on the Express app.
 * @param {import('express').Express} app 
 */
export function registerOAuthHelperRoutes(app) {
  // Route to initiate Google OAuth Login
  app.get('/oauth2login', (req, res) => {
    const authUrl = getAuthUrl();
    if (!authUrl) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Gmail OAuth Configuration Error</title></head>
        <body style="background-color: #0E0E10; color: #FFFFFF; font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #EF4444;">⚠️ GMAIL_CLIENT_ID is Missing</h2>
          <p>Please add your <code>GMAIL_CLIENT_ID</code> and <code>GMAIL_CLIENT_SECRET</code> to your local <code>.env</code> file before initiating OAuth authorization.</p>
        </body>
        </html>
      `);
    }
    res.redirect(authUrl);
  });

  // Callback route matching http://localhost:3000/oauth2callback
  app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    const error = req.query.error;

    if (error) {
      console.error('[GMAIL OAUTH ERROR] Authorization denied or error occurred:', error);
      return res.status(400).send(`<h2>❌ Google OAuth Error: ${error}</h2>`);
    }

    if (!code) {
      return res.status(400).send('<h2>⚠️ Missing authorization code parameter.</h2>');
    }

    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).send('<h2>❌ GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET is missing in environment.</h2>');
    }

    try {
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: String(code),
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
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
        const errorDetail = data.error_description || data.error || 'Failed to exchange authorization code';
        console.error('[GMAIL OAUTH ERROR] Code exchange failed:', errorDetail);
        return res.status(400).send(`<h2>❌ Code exchange failed: ${errorDetail}</h2>`);
      }

      const refreshToken = data.refresh_token;

      if (refreshToken) {
        console.log('\n================================================================================');
        console.log('🔑 [GMAIL OAUTH REFRESH TOKEN GENERATED SUCCESSFULLY]');
        console.log('Copy the Refresh Token value below and add it to your local .env and Render Dashboard:\n');
        console.log(`GMAIL_REFRESH_TOKEN=${refreshToken}`);
        console.log('================================================================================\n');

        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Gmail OAuth Success</title>
            <style>
              body { background-color: #0E0E10; color: #FFFFFF; font-family: 'Segoe UI', system-ui, sans-serif; text-align: center; padding: 60px 20px; }
              .card { max-width: 540px; margin: 0 auto; background: #17171B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 36px 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
              .badge { display: inline-block; padding: 8px 16px; background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 10px; color: #34D399; font-weight: bold; margin-bottom: 20px; }
              h1 { font-size: 22px; margin-bottom: 12px; }
              p { color: #B3B3B3; font-size: 15px; line-height: 1.6; }
              code { background: #141418; color: #F4C542; padding: 4px 8px; border-radius: 6px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">✅ OAuth Authorization Complete</div>
              <h1>Gmail Refresh Token Generated</h1>
              <p>Check your <strong>local terminal console</strong> output where your <code>GMAIL_REFRESH_TOKEN</code> has been printed.</p>
              <p style="margin-top: 20px; font-size: 14px; color: #888;">Copy the token from your terminal and save it in your <code>.env</code> file and Render Dashboard environment variables.</p>
            </div>
          </body>
          </html>
        `);
      } else {
        console.warn('[GMAIL OAUTH WARNING] No refresh token returned in token response.');
        return res.send(`
          <h2>⚠️ No Refresh Token Returned</h2>
          <p>Google did not return a refresh token (this happens if this app was previously authorized).</p>
          <p>To force a fresh refresh token, visit <a href="/oauth2login">/oauth2login</a> again or revoke app access at <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a>.</p>
        `);
      }
    } catch (err) {
      console.error('[GMAIL OAUTH EXCEPTION]', err);
      return res.status(500).send(`<h2>❌ Internal error during OAuth exchange: ${err.message}</h2>`);
    }
  });
}
