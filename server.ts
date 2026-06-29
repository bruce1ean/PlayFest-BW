import dotenv from 'dotenv';
// Load environment variables at the very beginning
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';

const app = express();
const PORT = 3000;

// Express parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Google Sheets Backup API Endpoint
app.post('/api/backup-registration', async (req, res) => {
  const payload = req.body;

  // Logging incoming backup payload
  console.log('[Backup System] Received backup request for registration:', payload?.id);

  // Quick validation of the registration payload
  if (!payload || !payload.id || !payload.fullName || !payload.email) {
    console.warn('[Backup System] Invalid payload received:', payload);
    return res.status(400).json({
      success: false,
      error: 'Missing required attendee registration fields.',
    });
  }

  // Extract config
  const webAppUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Attendees';

  // 1. Prioritize Google Sheets Apps Script Web App URL if configured
  if (webAppUrl) {
    try {
      console.log('[Backup System] WebApp URL configured. Saving registration via Apps Script Web App...');
      
      const ticketType = payload.ticketType || 'General Access RSVP';
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: payload.id,
          fullName: payload.fullName,
          email: payload.email,
          phoneNumber: payload.phoneNumber || '',
          ticketType,
          carRegistration: payload.carRegistration || 'N/A',
          createdAt: payload.createdAt || new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(`Google Sheets WebApp returned status ${response.status}: ${errorMsg}`);
      }

      let data: any;
      try {
        data = await response.json();
      } catch {
        data = { success: true };
      }

      if (data && data.success === false) {
        throw new Error(data.error || 'Apps Script backend returned an error.');
      }

      console.log('[Backup System] Successfully saved registration via Apps Script Web App:', payload.id);
      return res.status(200).json({
        success: true,
        message: 'Backup successfully written to Google Sheets via Apps Script Web App.',
      });
    } catch (err: any) {
      console.error('[Backup System] Failed to backup via Apps Script Web App:', err);
      return res.status(500).json({
        success: false,
        error: 'Google Sheets Web App error: ' + (err.message || err),
      });
    }
  }

  // 2. Fallback to Google Cloud Service Account method if configured
  if (!serviceAccountEmail || !rawPrivateKey || !spreadsheetId) {
    console.warn('[Backup System] Google Sheets configuration (either Web App URL or Service Account) is missing in environment variables.');
    return res.status(500).json({
      success: false,
      error: 'Google Sheets backup is not configured. Please set GOOGLE_SHEETS_WEBAPP_URL in your Vercel project environment variables.',
    });
  }

  try {
    // Correctly handle escaped newline characters in private key
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

    // Authenticate with Google API using JWT for Service Account
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const range = `${sheetName}!A:G`;

    // 1. Get existing rows to verify and enforce duplicate prevention
    let existingRows: any[][] = [];
    try {
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      existingRows = getResponse.data.values || [];
    } catch (getErr: any) {
      console.log(`[Backup System] Target sheet "${sheetName}" might be empty or uninitialized:`, getErr.message);
    }

    // Check for duplicates based on Registration ID (Column A)
    const regId = payload.id;
    const isDuplicate = existingRows.some(row => row[0] === regId);

    if (isDuplicate) {
      console.log(`[Backup System] Registration ID ${regId} is already present in Google Sheets. Skipping to prevent duplicates.`);
      return res.status(200).json({
        success: true,
        message: 'Duplicate record skipped.',
      });
    }

    // Rows format definition
    const rowData = [
      payload.id,
      payload.fullName,
      payload.email,
      payload.phoneNumber || '',
      payload.ticketType || 'General Access RSVP',
      payload.carRegistration || 'N/A',
      payload.createdAt || new Date().toISOString()
    ];

    // If the sheet has no rows (completely empty sheet), prepend headers
    if (existingRows.length === 0) {
      const headers = [
        'Registration ID',
        'Full Name',
        'Email',
        'Phone Number',
        'Ticket Type',
        'Car Registration (if applicable)',
        'Registration Timestamp'
      ];
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers, rowData],
        },
      });
      console.log('[Backup System] Sheet initialized with headers and successfully appended registration:', regId);
    } else {
      // Otherwise, just append the new data row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      });
      console.log('[Backup System] Successfully appended registration to Google Sheets:', regId);
    }

    return res.status(200).json({
      success: true,
      message: 'Backup successfully written to Google Sheets.',
    });

  } catch (error: any) {
    console.error('[Backup System] Failed to append registration to Google Sheets:', error);
    // Explicitly return a 500 but log error detail for diagnostics
    return res.status(500).json({
      success: false,
      error: 'Google Sheets API error: ' + (error.message || error),
    });
  }
});

// Serve health status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', backupSystemActive: !!(process.env.GOOGLE_SPREADSHEET_ID) });
});

// Configure Vite middleware / static files serving
async function setupRouting() {
  if (process.env.NODE_ENV !== 'production') {
    // Development Mode: Use Vite's Dev Server as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: Serve built static files from /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to port 3000 and 0.0.0.0
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Express full-stack listening on http://0.0.0.0:${PORT}`);
  });
}

setupRouting();
