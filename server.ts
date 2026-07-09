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

// Helper to clean Spreadsheet ID in case full URL is provided in GOOGLE_SPREADSHEET_ID
function cleanSpreadsheetId(idOrUrl: string | undefined): string | undefined {
  if (!idOrUrl) return undefined;
  if (idOrUrl.includes('docs.google.com/spreadsheets')) {
    const matches = idOrUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return matches ? matches[1] : idOrUrl;
  }
  return idOrUrl;
}

// Google Sheets Primary Database API Endpoint
app.post('/api/backup-registration', async (req, res) => {
  const payload = req.body;

  // Logging incoming backup payload
  console.log('[Sheets Database] Received save request for registration:', payload?.id);

  // Quick validation of the registration payload
  if (!payload || !payload.id || !payload.fullName || !payload.email) {
    console.warn('[Sheets Database] Invalid payload received:', payload);
    return res.status(400).json({
      success: false,
      error: 'Missing required attendee registration fields.',
    });
  }

  // Extract config
  const webAppUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const rawSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const spreadsheetId = cleanSpreadsheetId(rawSpreadsheetId);
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Attendees';

  const ticketType = payload.ticketType || 'General Access RSVP';
  const carRegistration = payload.carRegistration || 'No';

  // Format the phone number with a leading single quote (') if it starts with +, =, or - to prevent Google Sheets formula parse errors
  let formattedPhoneNumber = payload.phoneNumber || '';
  if (formattedPhoneNumber.startsWith('+') || formattedPhoneNumber.startsWith('=') || formattedPhoneNumber.startsWith('-')) {
    formattedPhoneNumber = `'` + formattedPhoneNumber;
  }

  // 1. Prioritize Google Sheets Apps Script Web App URL if configured
  if (webAppUrl) {
    try {
      if (webAppUrl.includes('docs.google.com/spreadsheets')) {
        throw new Error('You configured GOOGLE_SHEETS_WEBAPP_URL with a standard Google Sheet spreadsheet URL instead of a deployed Google Apps Script Web App /exec URL. Please deploy a Google Apps Script Web App, or remove this variable to use the Service Account or Simulation fallbacks.');
      }

      console.log('[Sheets Database] WebApp URL configured. Saving registration via Apps Script Web App...');
      
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: payload.id,
          fullName: payload.fullName,
          email: payload.email,
          phoneNumber: formattedPhoneNumber,
          ticketType,
          carRegistration,
          createdAt: payload.createdAt || new Date().toISOString()
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Google Sheets WebApp returned status ${response.status}: ${responseText}`);
      }

      // Check if response is HTML instead of JSON (which happens when pointing to wrong URL or login required)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        throw new Error('Received an HTML page instead of JSON. This typically happens if the Web App URL is incorrect or if the Web App is not shared with "Anyone" (even anonymous).');
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr: any) {
        throw new Error(`Failed to parse Web App response as JSON: ${jsonErr.message}. Response prefix: ${responseText.substring(0, 100)}`);
      }

      if (data && data.success === false) {
        throw new Error(data.error || 'Apps Script backend returned an error.');
      }

      console.log('[Sheets Database] Successfully saved registration via Apps Script Web App:', payload.id);
      return res.status(200).json({
        success: true,
        message: 'Registration successfully written to Google Sheets via Apps Script.',
      });
    } catch (err: any) {
      console.warn('[Sheets Database] Failed to save via Apps Script Web App, attempting fallbacks:', err.message || err);
      // Fall through to other storage types gracefully instead of failing the HTTP request with a 500 status!
    }
  }

  // 2. Fallback to Google Cloud Service Account method if configured
  if (!serviceAccountEmail || !rawPrivateKey || !spreadsheetId) {
    console.log('[Sheets Database] Google Sheets configuration (either Web App URL or Service Account) is missing or has failed. Running in simulation mode.');
    return res.status(200).json({
      success: true,
      message: 'Google Sheets backup simulation succeeded. (Please configure GOOGLE_SPREADSHEET_ID and service account credentials to write to real sheets).',
      simulated: true
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

    // Get existing rows to verify and enforce duplicate prevention
    let existingRows: any[][] = [];
    try {
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      existingRows = getResponse.data.values || [];
    } catch (getErr: any) {
      console.log(`[Sheets Database] Target sheet "${sheetName}" might be empty or uninitialized:`, getErr.message);
    }

    // Check for duplicates based on Registration ID (can be Column G [index 6] or Column A [index 0] depending on older styles)
    const regId = payload.id;
    const isDuplicate = existingRows.some(row => row[6] === regId || row[0] === regId);

    if (isDuplicate) {
      console.log(`[Sheets Database] Registration ID ${regId} is already present in Google Sheets. Skipping to prevent duplicates.`);
      return res.status(200).json({
        success: true,
        message: 'Duplicate record skipped.',
      });
    }

    // New format: Full Name, Email, Phone Number, Ticket Type, Car Meet registration, Timestamp, unique Registration ID
    const rowData = [
      payload.fullName,
      payload.email,
      formattedPhoneNumber,
      ticketType,
      carRegistration,
      payload.createdAt || new Date().toISOString(),
      payload.id
    ];

    // If the sheet has no rows (completely empty sheet), prepend headers
    if (existingRows.length === 0) {
      const headers = [
        'Full Name',
        'Email',
        'Phone Number',
        'Ticket Type',
        'Car Meet Registration',
        'Timestamp',
        'Registration ID'
      ];
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers, rowData],
        },
      });
      console.log('[Sheets Database] Sheet initialized with headers and successfully appended registration:', regId);
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
      console.log('[Sheets Database] Successfully appended registration to Google Sheets:', regId);
    }

    return res.status(200).json({
      success: true,
      message: 'Registration successfully written to Google Sheets.',
    });

  } catch (error: any) {
    console.error('[Sheets Database] Failed to append registration to Google Sheets:', error);
    return res.status(500).json({
      success: false,
      error: 'Google Sheets API error: ' + (error.message || error),
    });
  }
});

// POST Reset Registrations from Google Sheets
app.post('/api/reset-registrations', async (req, res) => {
  console.log('[Sheets Database] Received request to reset all registrations.');

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const rawSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const spreadsheetId = cleanSpreadsheetId(rawSpreadsheetId);
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Attendees';

  if (!serviceAccountEmail || !rawPrivateKey || !spreadsheetId) {
    console.log('[Sheets Database] Service account config missing for reset-registrations.');
    return res.json({ success: true, message: 'Local reset successful (Sheets not configured).' });
  }

  try {
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Clear everything from row 2 onwards to preserve headers
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A2:Z10000`,
    });

    console.log('[Sheets Database] Successfully cleared Google Sheets registrations.');
    return res.json({ success: true, message: 'Google Sheets registrations reset successfully.' });
  } catch (error: any) {
    console.error('[Sheets Database] Failed to clear Google Sheets:', error);
    return res.status(500).json({
      success: false,
      error: 'Google Sheets API error: ' + (error.message || error),
    });
  }
});

// GET Registrations from Google Sheets (or fallback)
app.get('/api/registrations', async (req, res) => {
  const webAppUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const rawSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const spreadsheetId = cleanSpreadsheetId(rawSpreadsheetId);
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Attendees';

  // 1. Prioritize Google Sheets Apps Script Web App URL if configured
  if (webAppUrl) {
    try {
      if (webAppUrl.includes('docs.google.com/spreadsheets')) {
        console.log('[Sheets Database] Note: GOOGLE_SHEETS_WEBAPP_URL contains a standard sheet URL instead of a web app /exec URL.');
      } else {
        console.log('[Sheets Database] WebApp URL configured. Fetching registrations via Apps Script Web App...');
        const response = await fetch(webAppUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        if (response.ok) {
          const responseText = await response.text();
          
          if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            console.log('[Sheets Database] Web App response is in HTML format. Falling back to alternative storage.');
          } else {
            let data: any;
            try {
              data = JSON.parse(responseText);
            } catch (jsonErr: any) {
              console.log('[Sheets Database] Response parsing parsed with issues. Falling back to alternative storage.');
            }

            if (data && data.success && Array.isArray(data.registrations)) {
              console.log(`[Sheets Database] Successfully fetched ${data.registrations.length} registrations via Apps Script Web App.`);
              return res.json({
                success: true,
                registrations: data.registrations,
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.log('[Sheets Database] Web App fetch bypassed. Falling back to alternative storage.');
    }
  }

  if (!serviceAccountEmail || !rawPrivateKey || !spreadsheetId) {
    console.log('[Sheets Database] Service account config missing for GET registrations. Returning empty list or local simulated backup.');
    return res.json({ success: true, registrations: [] });
  }

  try {
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const range = `${sheetName}!A:G`;

    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = getResponse.data.values || [];
    if (rows.length <= 1) {
      return res.json({ success: true, registrations: [] });
    }

    const headers = rows[0];
    const emailIndex = headers.indexOf('Email');
    const fullNameIndex = headers.indexOf('Full Name');
    const phoneIndex = headers.indexOf('Phone Number');
    const ticketIndex = headers.indexOf('Ticket Type');
    const carIndex = headers.indexOf('Car Meet Registration');
    const timestampIndex = headers.indexOf('Timestamp');
    const idIndex = headers.indexOf('Registration ID');

    const registrations = rows.slice(1).map((row, i) => {
      // Decode row based on found indexes, fallback to traditional order if needed
      const id = idIndex !== -1 ? row[idIndex] : (row[6] || `reg_sheets_${i}`);
      const fullName = fullNameIndex !== -1 ? row[fullNameIndex] : (row[0] || 'Unknown Attendee');
      const email = emailIndex !== -1 ? row[emailIndex] : (row[1] || 'no-email@example.com');
      const phoneNumber = phoneIndex !== -1 ? row[phoneIndex] : (row[2] || '');
      const ticketType = ticketIndex !== -1 ? row[ticketIndex] : (row[3] || 'General Access');
      const carRegistration = carIndex !== -1 ? row[carIndex] : (row[4] || 'No');
      const createdAt = timestampIndex !== -1 ? row[timestampIndex] : (row[5] || new Date().toISOString());

      const isCarMeetRegistered = carRegistration && !carRegistration.toLowerCase().includes('no');

      return {
        id,
        fullName,
        email,
        phoneNumber,
        city: 'Gaborone',
        ageGroup: '25-34',
        attendanceLikelihood: 'Definitely',
        groupSize: 'Just Me',
        travelDistance: 'Within my city',
        referralSource: 'Other',
        interests: isCarMeetRegistered ? ['car_meet'] : [],
        approximateSpend: 'P200–P500',
        vipInterest: ticketType.toLowerCase().includes('vip') ? 'Yes' : 'No',
        merchInterest: 'No',
        earlyTicketAccess: 'No',
        createdAt,
        carDetails: isCarMeetRegistered ? {
          vehicleMake: 'Custom Build',
          vehicleModel: carRegistration,
          year: 'N/A',
          buildType: 'Custom',
          modifications: 'Details saved on Google Sheet',
          displayVehicle: 'Yes',
          enterCompetitions: 'No'
        } : undefined
      };
    });

    return res.json({
      success: true,
      registrations,
    });
  } catch (error: any) {
    console.error('[Sheets Database] Failed to query registrations from Google Sheets:', error);
    // Return standard success but empty array so it doesn't crash admin UI, but logs errors.
    return res.json({
      success: true,
      registrations: [],
      error: error.message || error
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
