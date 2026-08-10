import dotenv from 'dotenv';
// Load environment variables at the very beginning
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { initializeApp as initFirebaseApp, getApps as getFirebaseApps, getApp as getFirebaseApp } from 'firebase/app';
import { getFirestore as getFirebaseFirestore, collection as firestoreCollection, getDocs as firestoreGetDocs, doc as firestoreDoc, setDoc as firestoreSetDoc, deleteDoc as firestoreDeleteDoc } from 'firebase/firestore';

const app = express();
const PORT = 3000;

// Initialize Server-Side Firestore using standard Firebase client SDK for reliable cross-device sync
let serverDb: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (firebaseConfig && firebaseConfig.projectId) {
      const fbApp = getFirebaseApps().length ? getFirebaseApp() : initFirebaseApp(firebaseConfig);
      serverDb = getFirebaseFirestore(fbApp, firebaseConfig.firestoreDatabaseId || '(default)');
      console.log('[Server Database] Firebase Firestore initialized on server using Web SDK.');
    }
  }
} catch (fbErr: any) {
  console.warn('[Server Database] Could not initialize Firebase on server:', fbErr.message || fbErr);
}

async function fetchFirestoreRegistrations(): Promise<any[]> {
  if (!serverDb) return [];
  try {
    const snap = await firestoreGetDocs(firestoreCollection(serverDb, 'registrations'));
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    console.log(`[Server Database] Successfully fetched ${list.length} registrations from Firestore.`);
    return list;
  } catch (err: any) {
    console.warn('[Server Database] Error fetching registrations from Firestore:', err.message || err);
    return [];
  }
}

async function saveFirestoreRegistration(reg: any): Promise<boolean> {
  if (!serverDb || !reg || !reg.id) return false;
  try {
    await firestoreSetDoc(firestoreDoc(serverDb, 'registrations', reg.id), reg);
    console.log(`[Server Database] Successfully saved registration ${reg.id} to Firestore.`);
    return true;
  } catch (err: any) {
    console.warn(`[Server Database] Error saving registration ${reg.id} to Firestore:`, err.message || err);
    return false;
  }
}

async function fetchFirestoreVendors(): Promise<any[]> {
  if (!serverDb) return [];
  try {
    const snap = await firestoreGetDocs(firestoreCollection(serverDb, 'vendors'));
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    console.log(`[Server Database] Successfully fetched ${list.length} vendors from Firestore.`);
    return list;
  } catch (err: any) {
    console.warn('[Server Database] Error fetching vendors from Firestore:', err.message || err);
    return [];
  }
}

async function saveFirestoreVendor(vendor: any): Promise<boolean> {
  if (!serverDb || !vendor || !vendor.id) return false;
  try {
    await firestoreSetDoc(firestoreDoc(serverDb, 'vendors', vendor.id), vendor);
    console.log(`[Server Database] Successfully saved vendor ${vendor.id} to Firestore.`);
    return true;
  } catch (err: any) {
    console.warn(`[Server Database] Error saving vendor ${vendor.id} to Firestore:`, err.message || err);
    return false;
  }
}

async function saveFirestoreSubscriber(sub: any): Promise<boolean> {
  if (!serverDb || !sub || !sub.id) return false;
  try {
    await firestoreSetDoc(firestoreDoc(serverDb, 'subscribers', sub.id), sub);
    console.log(`[Server Database] Successfully saved subscriber ${sub.id} to Firestore.`);
    return true;
  } catch (err: any) {
    console.warn(`[Server Database] Error saving subscriber ${sub.id} to Firestore:`, err.message || err);
    return false;
  }
}

async function saveFirestoreComment(comment: any): Promise<boolean> {
  if (!serverDb || !comment || !comment.id) return false;
  try {
    await firestoreSetDoc(firestoreDoc(serverDb, 'comments', comment.id), comment);
    console.log(`[Server Database] Successfully saved comment ${comment.id} to Firestore.`);
    return true;
  } catch (err: any) {
    console.warn(`[Server Database] Error saving comment ${comment.id} to Firestore:`, err.message || err);
    return false;
  }
}

async function clearFirestoreCollection(collectionName: string): Promise<boolean> {
  if (!serverDb) return false;
  try {
    const snap = await firestoreGetDocs(firestoreCollection(serverDb, collectionName));
    const promises: Promise<any>[] = [];
    snap.forEach((d) => {
      promises.push(firestoreDeleteDoc(firestoreDoc(serverDb, collectionName, d.id)));
    });
    await Promise.all(promises);
    console.log(`[Server Database] Successfully cleared collection ${collectionName} in Firestore.`);
    return true;
  } catch (err: any) {
    console.warn(`[Server Database] Error clearing collection ${collectionName} in Firestore:`, err.message || err);
    return false;
  }
}

// In-memory cache to prevent slow Google Sheets API reads and make stats instant
let registrationsCache: { registrations: any[]; timestamp: number } | null = null;
let vendorsCache: { vendors: any[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 15000; // 15 seconds cache TTL

function invalidateSheetsCache() {
  console.log('[Sheets Database] Invalidating registrations and vendors memory cache due to updates.');
  registrationsCache = null;
  vendorsCache = null;
}

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

// Helper to clean private key, replacing escaped newlines and stripping wrapping quotes
function cleanPrivateKey(rawKey: string | undefined): string {
  if (!rawKey) return '';
  let key = rawKey.replace(/\\n/g, '\n');
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  }
  return key;
}

// Google Sheets Primary Database API Endpoint
app.post('/api/backup-registration', async (req, res) => {
  const payload = req.body;
  invalidateSheetsCache();

  // Logging incoming backup payload
  console.log('[Database API] Received save request for registration:', payload?.id);

  // Quick validation of the registration payload
  if (!payload || !payload.id || !payload.fullName || !payload.email) {
    console.warn('[Database API] Invalid payload received:', payload);
    return res.status(400).json({
      success: false,
      error: 'Missing required attendee registration fields.',
    });
  }

  // Ensure record is saved in Firestore directly from server
  saveFirestoreRegistration(payload).catch(err => {
    console.warn('[Database API] Async server firestore write error:', err);
  });

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
          spreadsheetId,
          spreadsheet_id: spreadsheetId,
          sheetName,
          sheet_name: sheetName,
          ...payload,
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
    // Correctly handle escaped newline characters and wrapping quotes in private key
    const privateKey = cleanPrivateKey(rawPrivateKey);

    // Authenticate with Google API using JWT for Service Account
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const range = `${sheetName}!A:AE`;

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

    // Check for duplicates based on Registration ID (searches all cells of rows for regId)
    const regId = payload.id;
    const isDuplicate = existingRows.some(row => row.includes(regId));

    if (isDuplicate) {
      console.log(`[Sheets Database] Registration ID ${regId} is already present in Google Sheets. Skipping to prevent duplicates.`);
      return res.status(200).json({
        success: true,
        message: 'Duplicate record skipped.',
      });
    }

    // Comprehensive format with 31 columns mapping all registration data
    const rowData = [
      payload.fullName,
      payload.email,
      formattedPhoneNumber,
      payload.country || 'Botswana',
      payload.city || '',
      payload.ageGroup || '',
      payload.gender || '',
      payload.attendanceLikelihood || '',
      payload.groupSize || '',
      payload.travelDistance || '',
      payload.referralSource || '',
      payload.interests || '',
      payload.approximateSpend || '',
      payload.vipInterest || '',
      payload.merchInterest || '',
      payload.earlyTicketAccess || '',
      ticketType,
      carRegistration,
      payload.gamingPlatform || '',
      payload.gamingFavoriteGames || '',
      payload.gamingParticipateInTournaments || '',
      payload.gamingPreferredCategories || '',
      payload.vehicleMake || '',
      payload.vehicleModel || '',
      payload.vehicleYear || '',
      payload.vehicleBuildType || '',
      payload.vehicleModifications || '',
      payload.vehicleDisplayVehicle || '',
      payload.vehicleEnterCompetitions || '',
      payload.createdAt || new Date().toISOString(),
      payload.id
    ];

    // If the sheet has no rows (completely empty sheet), prepend headers
    if (existingRows.length === 0) {
      const headers = [
        'Full Name',
        'Email',
        'Phone Number',
        'Country',
        'City',
        'Age Group',
        'Gender',
        'Attendance Likelihood',
        'Group Size',
        'Travel Distance',
        'Referral Source',
        'Interests',
        'Approximate Spend',
        'VIP Interest',
        'Merch Interest',
        'Early Ticket Access',
        'Ticket Type',
        'Car Meet Registration',
        'Gaming Platform',
        'Favorite Games',
        'Gaming Tournaments',
        'Gaming Categories',
        'Vehicle Make',
        'Vehicle Model',
        'Vehicle Year',
        'Build Type',
        'Modifications',
        'Display Vehicle',
        'Enter Competitions',
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

// Bulk sync all Firestore registrations to Google Sheets
app.post('/api/sync-all-to-sheets', async (req, res) => {
  try {
    invalidateSheetsCache();
    const firestoreRegs = await fetchFirestoreRegistrations();
    if (firestoreRegs.length === 0) {
      return res.json({ success: true, count: 0, message: 'No registrations found in Firestore to sync.' });
    }

    const webAppUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
    const rawSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const spreadsheetId = cleanSpreadsheetId(rawSpreadsheetId);
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'Attendees';

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const payload of firestoreRegs) {
      if (!payload || !payload.id || !payload.fullName || !payload.email) continue;

      const ticketType = payload.ticketType || 'General Access RSVP';
      const carRegistration = payload.carRegistration || 'No';

      let formattedPhoneNumber = payload.phoneNumber || '';
      if (formattedPhoneNumber.startsWith('+') || formattedPhoneNumber.startsWith('=') || formattedPhoneNumber.startsWith('-')) {
        formattedPhoneNumber = `'` + formattedPhoneNumber;
      }

      if (webAppUrl && !webAppUrl.includes('docs.google.com/spreadsheets')) {
        try {
          const response = await fetch(webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              spreadsheetId,
              spreadsheet_id: spreadsheetId,
              sheetName,
              sheet_name: sheetName,
              ...payload,
              phoneNumber: formattedPhoneNumber,
              ticketType,
              carRegistration,
              createdAt: payload.createdAt || new Date().toISOString()
            }),
          });
          const text = await response.text();
          if (response.ok && !text.trim().startsWith('<')) {
            const parsed = JSON.parse(text);
            if (parsed.success !== false) {
              successCount++;
              continue;
            }
          }
          failCount++;
        } catch (err: any) {
          failCount++;
          errors.push(err.message || String(err));
        }
      } else if (serviceAccountEmail && rawPrivateKey && spreadsheetId) {
        try {
          const privateKey = cleanPrivateKey(rawPrivateKey);
          const auth = new google.auth.JWT({
            email: serviceAccountEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          });
          const sheets = google.sheets({ version: 'v4', auth });
          const range = `${sheetName}!A:AE`;

          let existingRows: any[][] = [];
          try {
            const getResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range });
            existingRows = getResponse.data.values || [];
          } catch {}

          const isDuplicate = existingRows.some(row => row.includes(payload.id));
          if (isDuplicate) {
            successCount++;
            continue;
          }

          const rowData = [
            payload.fullName,
            payload.email,
            formattedPhoneNumber,
            payload.country || 'Botswana',
            payload.city || '',
            payload.ageGroup || '',
            payload.gender || '',
            payload.attendanceLikelihood || '',
            payload.groupSize || '',
            payload.travelDistance || '',
            payload.referralSource || '',
            payload.interests || '',
            payload.approximateSpend || '',
            payload.vipInterest || '',
            payload.merchInterest || '',
            payload.earlyTicketAccess || '',
            ticketType,
            carRegistration,
            payload.gamingPlatform || '',
            payload.gamingFavoriteGames || '',
            payload.gamingParticipateInTournaments || '',
            payload.gamingPreferredCategories || '',
            payload.vehicleMake || '',
            payload.vehicleModel || '',
            payload.vehicleYear || '',
            payload.vehicleBuildType || '',
            payload.vehicleModifications || '',
            payload.vehicleDisplayVehicle || '',
            payload.vehicleEnterCompetitions || '',
            payload.createdAt || new Date().toISOString(),
            payload.id
          ];

          if (existingRows.length === 0) {
            const headers = [
              'Full Name', 'Email', 'Phone Number', 'Country', 'City', 'Age Group', 'Gender',
              'Attendance Likelihood', 'Group Size', 'Travel Distance', 'Referral Source',
              'Interests', 'Approximate Spend', 'VIP Interest', 'Merch Interest',
              'Early Ticket Access', 'Ticket Type', 'Car Meet Registration',
              'Gaming Platform', 'Favorite Games', 'Gaming Tournaments', 'Gaming Categories',
              'Vehicle Make', 'Vehicle Model', 'Vehicle Year', 'Build Type',
              'Modifications', 'Display Vehicle', 'Enter Competitions', 'Timestamp', 'Registration ID'
            ];
            await sheets.spreadsheets.values.append({
              spreadsheetId,
              range,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: [headers, rowData] }
            });
          } else {
            await sheets.spreadsheets.values.append({
              spreadsheetId,
              range,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: [rowData] }
            });
          }
          successCount++;
        } catch (err: any) {
          failCount++;
          errors.push(err.message || String(err));
        }
      } else {
        successCount++;
      }
    }

    return res.json({
      success: true,
      count: successCount,
      failed: failCount,
      message: `Successfully synchronized ${successCount} registrations to Google Sheets. Failed: ${failCount}.`
    });
  } catch (error: any) {
    console.error('[Sync Endpoint] Error:', error);
    return res.status(500).json({ success: false, error: error.message || String(error) });
  }
});

// Google Sheets Vendors Backup API Endpoint
app.post('/api/backup-vendor', async (req, res) => {
  const payload = req.body;
  invalidateSheetsCache();

  // Logging incoming backup payload
  console.log('[Sheets Database] Received save request for vendor:', payload?.id);

  // Quick validation of the vendor payload
  if (!payload || !payload.id || !payload.businessName || !payload.email) {
    console.warn('[Sheets Database] Invalid payload received:', payload);
    return res.status(400).json({
      success: false,
      error: 'Missing required vendor registration fields.',
    });
  }

  // Ensure record is saved in Firestore directly from server
  saveFirestoreVendor(payload).catch(err => {
    console.warn('[Database API] Async server firestore write error for vendor:', err);
  });

  // Extract config
  const webAppUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const rawSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const spreadsheetId = cleanSpreadsheetId(rawSpreadsheetId);
  const sheetName = process.env.GOOGLE_SHEET_VENDORS_NAME || 'Vendors';

  // Format the contact number with a leading single quote (') if it starts with +, =, or - to prevent Google Sheets formula parse errors
  let formattedContactNumber = payload.contactNumber || '';
  if (formattedContactNumber.startsWith('+') || formattedContactNumber.startsWith('=') || formattedContactNumber.startsWith('-')) {
    formattedContactNumber = `'` + formattedContactNumber;
  }

  // 1. Prioritize Google Sheets Apps Script Web App URL if configured
  if (webAppUrl) {
    try {
      if (webAppUrl.includes('docs.google.com/spreadsheets')) {
        throw new Error('You configured GOOGLE_SHEETS_WEBAPP_URL with a standard Google Sheet spreadsheet URL instead of a deployed Google Apps Script Web App /exec URL.');
      }

      console.log('[Sheets Database] WebApp URL configured. Saving vendor via Apps Script Web App...');
      
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          contactNumber: formattedContactNumber,
          isVendor: true,
          sheetName,
          sheet_name: sheetName,
          spreadsheetId,
          spreadsheet_id: spreadsheetId
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Google Sheets WebApp returned status ${response.status}: ${responseText}`);
      }

      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        throw new Error('Received an HTML page instead of JSON.');
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr: any) {
        throw new Error(`Failed to parse Web App response as JSON: ${jsonErr.message}.`);
      }

      if (data && data.success === false) {
        throw new Error(data.error || 'Apps Script backend returned an error.');
      }

      console.log('[Sheets Database] Successfully saved vendor via Apps Script Web App:', payload.id);
      return res.status(200).json({
        success: true,
        message: 'Vendor successfully written to Google Sheets via Apps Script.',
      });
    } catch (err: any) {
      console.warn('[Sheets Database] Failed to save vendor via Apps Script Web App, attempting fallbacks:', err.message || err);
    }
  }

  // 2. Fallback to Google Cloud Service Account method if configured
  if (!serviceAccountEmail || !rawPrivateKey || !spreadsheetId) {
    console.log('[Sheets Database] Google Sheets configuration (either Web App URL or Service Account) is missing or has failed. Running in simulation mode.');
    return res.status(200).json({
      success: true,
      message: 'Google Sheets vendor backup simulation succeeded. (Please configure GOOGLE_SPREADSHEET_ID and service account credentials to write to real sheets).',
      simulated: true
    });
  }

  try {
    const privateKey = cleanPrivateKey(rawPrivateKey);

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const range = `${sheetName}!A:L`;

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

    const vendorId = payload.id;
    const isDuplicate = existingRows.some(row => row[11] === vendorId || row[0] === vendorId);

    if (isDuplicate) {
      console.log(`[Sheets Database] Vendor ID ${vendorId} is already present in Google Sheets. Skipping to prevent duplicates.`);
      return res.status(200).json({
        success: true,
        message: 'Duplicate record skipped.',
      });
    }

    const rowData = [
      payload.businessName,
      payload.contactPerson,
      formattedContactNumber,
      payload.email,
      payload.category,
      payload.productsOrServices,
      payload.socialMediaLinks,
      payload.stallSize,
      payload.electricityRequired,
      payload.additionalRequests || '',
      payload.createdAt || new Date().toISOString(),
      payload.id
    ];

    if (existingRows.length === 0) {
      const headers = [
        'Business Name',
        'Contact Person',
        'Contact Number',
        'Email',
        'Category',
        'Products / Services',
        'Social Media Links',
        'Stall Size',
        'Electricity Required',
        'Additional Requests',
        'Timestamp',
        'Vendor ID'
      ];
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers, rowData],
        },
      });
      console.log('[Sheets Database] Sheet initialized with headers and successfully appended vendor:', vendorId);
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      });
      console.log('[Sheets Database] Successfully appended vendor to Google Sheets:', vendorId);
    }

    return res.status(200).json({
      success: true,
      message: 'Vendor successfully written to Google Sheets.',
    });

  } catch (error: any) {
    console.error('[Sheets Database] Failed to append vendor to Google Sheets:', error);
    return res.status(500).json({
      success: false,
      error: 'Google Sheets API error: ' + (error.message || error),
    });
  }
});

// POST Backup Newsletter Subscriber to Firestore
app.post('/api/backup-subscriber', async (req, res) => {
  const payload = req.body;
  if (!payload || !payload.id || !payload.email) {
    return res.status(400).json({ success: false, error: 'Invalid subscriber payload.' });
  }
  const saved = await saveFirestoreSubscriber(payload);
  return res.json({ success: saved });
});

// POST Backup Comment to Firestore
app.post('/api/backup-comment', async (req, res) => {
  const payload = req.body;
  if (!payload || !payload.id || !payload.fullName || !payload.text) {
    return res.status(400).json({ success: false, error: 'Invalid comment payload.' });
  }
  const saved = await saveFirestoreComment(payload);
  return res.json({ success: saved });
});

// ---------------------------------------------------------------------------
// SMTP Transporter and Email Notification Service
// ---------------------------------------------------------------------------
let mailTransporter: any = null;

function getMailTransporter() {
  if (mailTransporter !== null) return mailTransporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[Email Notification] SMTP_USER or SMTP_PASS not set. Operating in Simulation Mode (emails will be logged to server console).');
    mailTransporter = 'SIMULATION';
    return 'SIMULATION';
  }

  try {
    mailTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
    console.log('[Email Notification] SMTP Transporter successfully initialized for:', user);
  } catch (err: any) {
    console.error('[Email Notification] Failed to initialize SMTP Transporter:', err.message || err);
    mailTransporter = 'SIMULATION';
  }

  return mailTransporter;
}

// POST Send Confirmation Email
app.post('/api/send-confirmation', async (req, res) => {
  const { type, data } = req.body;

  if (!type || !data || !data.email) {
    return res.status(400).json({
      success: false,
      error: 'Missing type, data, or target email address.',
    });
  }

  const targetEmail = data.email.trim();
  const fromHeader = process.env.SMTP_FROM || 'PlayFest Botswana <noreply@playfest2026.bw>';
  const transporterInstance = getMailTransporter();

  let subject = '';
  let htmlContent = '';

  if (type === 'attendee') {
    // Determine the backup ticket type based on registration properties
    let ticketType = 'General Entry & Prize Draw';
    if (data.vipInterest === 'Yes' || data.vipInterest === 'Maybe') {
      ticketType = 'VIP Giveaway Entry & Priority Waitlist';
    } else if (data.earlyTicketAccess === 'Yes') {
      ticketType = 'Early Notification & Giveaway Entry';
    }

    const interests = data.interests || ['General Interest'];
    const formattedInterests = interests.map((i: string) => {
      if (i === 'car_meet') return 'Custom Car Meet & Show';
      if (i === 'gaming') return 'Gaming Arena & Esports';
      if (i === 'live_music') return 'Electronic Soundwaves';
      if (i === 'merch_shop') return 'Pop-Culture Merch & Apparel';
      return i;
    });

    subject = '🎟️ PlayFest 2026 Confirmation: You\'re on the priority list!';
    htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0c071e; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #120c2d; border-radius: 12px; overflow: hidden; border: 1px solid rgba(236,72,153,0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 26px; letter-spacing: 2px; text-transform: uppercase; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .ticket-card { background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px; padding: 20px; margin: 20px 0; }
    .ticket-card h2 { margin-top: 0; color: #ec4899; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
    .ticket-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
    .ticket-label { color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: bold; }
    .ticket-value { color: #f8fafc; font-size: 14px; font-weight: bold; text-align: right; }
    .tag { display: inline-block; background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.3); color: #c084fc; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: bold; margin-left: 5px; }
    .footer { background-color: #060214; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); }
    .footer a { color: #ec4899; text-decoration: none; }
    .cta-btn { display: inline-block; background: #ec4899; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 6px; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PlayFest 2026</h1>
      <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Priority Queue Confirmed</p>
    </div>
    <div class="content">
      <p>Hello <strong>${data.fullName}</strong>,</p>
      <p>Your registration for <strong>PlayFest 2026 Gaborone</strong> has been successfully received and added to our priority invite list!</p>
      
      <p>PlayFest is Botswana's premier gaming, automotive tuning, electronic soundwaves, and lifestyle collision event. We're extremely excited to have you join us for this landmark staging.</p>
      
      <div class="ticket-card">
        <h2>RSVP PASS DETAILS</h2>
        <div class="ticket-row">
          <div class="ticket-label">Registration ID</div>
          <div class="ticket-value" style="font-family: monospace; color: #06b6d4;">${data.id}</div>
        </div>
        <div class="ticket-row">
          <div class="ticket-label">Access Category</div>
          <div class="ticket-value">${ticketType}</div>
        </div>
        <div class="ticket-row">
          <div class="ticket-label">Phone Number</div>
          <div class="ticket-value">${data.phoneNumber}</div>
        </div>
        <div class="ticket-row">
          <div class="ticket-label">Age Group</div>
          <div class="ticket-value">${data.ageGroup}</div>
        </div>
        <div class="ticket-row">
          <div class="ticket-label">Interests</div>
          <div class="ticket-value">
            ${formattedInterests.map((interest: string) => `<span class="tag">${interest}</span>`).join('')}
          </div>
        </div>
        ${data.carDetails ? `
        <div class="ticket-row" style="margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px;">
          <div class="ticket-label">Vehicle Entry</div>
          <div class="ticket-value" style="color: #06b6d4;">${data.carDetails.year} ${data.carDetails.vehicleMake} ${data.carDetails.vehicleModel} (${data.carDetails.buildType})</div>
        </div>
        ` : ''}
        ${data.gamingDetails ? `
        <div class="ticket-row" style="margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px;">
          <div class="ticket-label">Gaming Profile</div>
          <div class="ticket-value" style="color: #c084fc;">Platform: ${data.gamingDetails.platform} | Favs: ${data.gamingDetails.favoriteGames}</div>
        </div>
        ` : ''}
      </div>

      <p style="margin-top: 25px;"><strong>What happens next?</strong></p>
      <ul>
        <li>Keep an eye on this inbox. We will email you with your early ticket booking access code and official ticket pricing releases.</li>
        <li>Follow us on Instagram <a href="https://www.instagram.com/playfestbw" style="color: #ec4899; text-decoration: none;">@playfestbw</a> to stay updated in real-time.</li>
        <li>Get your team ready. Gaming tournament registrations and vehicle display slots will open shortly!</li>
      </ul>

      <center style="margin-top: 25px;">
        <a href="https://www.instagram.com/playfestbw" class="cta-btn">Follow our Instagram Feed</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2026 PlayFest Botswana. Gaborone, Botswana.</p>
      <p>Need support? Contact us at <a href="mailto:info@playfest2026.bw">info@playfest2026.bw</a></p>
    </div>
  </div>
</body>
</html>
`;
  } else if (type === 'vendor') {
    subject = '🎪 PlayFest 2026: Vendor Application Received!';
    htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0c071e; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #120c2d; border-radius: 12px; overflow: hidden; border: 1px solid rgba(6,182,212,0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 26px; letter-spacing: 2px; text-transform: uppercase; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .application-card { background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px; padding: 20px; margin: 20px 0; }
    .application-card h2 { margin-top: 0; color: #06b6d4; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
    .app-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
    .app-label { color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: bold; }
    .app-value { color: #f8fafc; font-size: 14px; font-weight: bold; text-align: right; }
    .footer { background-color: #060214; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); }
    .footer a { color: #06b6d4; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PlayFest 2026</h1>
      <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Vendor Curation Application</p>
    </div>
    <div class="content">
      <p>Hello <strong>${data.contactPerson}</strong>,</p>
      <p>Thank you for submitting your vendor interest application for <strong>PlayFest 2026 Gaborone</strong>. We have received your details, and our curation committee is reviewing them!</p>
      
      <p>PlayFest attracts thousands of passionate automotive, gaming, and pop-culture enthusiasts. We curate our vendor stalls meticulously to ensure a high-impact, high-converting experience for your business and a thrilling experience for attendees.</p>
      
      <div class="application-card">
        <h2>APPLICATION DETAILS</h2>
        <div class="app-row">
          <div class="app-label">Application ID</div>
          <div class="app-value" style="font-family: monospace; color: #06b6d4;">${data.id}</div>
        </div>
        <div class="app-row">
          <div class="app-label">Business Name</div>
          <div class="app-value" style="color: #ec4899;">${data.businessName}</div>
        </div>
        <div class="app-row">
          <div class="app-label">Stall Category</div>
          <div class="app-value">${data.category}</div>
        </div>
        <div class="app-row">
          <div class="app-label">Stall Size</div>
          <div class="app-value">${data.stallSize}</div>
        </div>
        <div class="app-row">
          <div class="app-label">Power Required</div>
          <div class="app-value">${data.electricityRequired}</div>
        </div>
        <div class="app-row">
          <div class="app-label">Contact Number</div>
          <div class="app-value">${data.contactNumber}</div>
        </div>
      </div>

      <p><strong>What are the next steps?</strong></p>
      <ul>
        <li>Our vendor coordination team reviews all applications. We will contact you at <strong>${targetEmail}</strong> or <strong>${data.contactNumber}</strong> within 3-5 business days to confirm curation approval.</li>
        <li>Once approved, you will receive information regarding stall pricing, deposit requirements, setup schedules, and electrical allocation guidelines.</li>
      </ul>

      <p style="font-style: italic; color: #94a3b8; font-size: 13px; margin-top: 20px;">Please do not send any payments until you receive our official invoice with approval from an @playfest2026.bw email address.</p>
    </div>
    <div class="footer">
      <p>© 2026 PlayFest Botswana. Gaborone, Botswana.</p>
      <p>Need support? Contact us at <a href="mailto:info@playfest2026.bw">info@playfest2026.bw</a></p>
    </div>
  </div>
</body>
</html>
`;
  } else if (type === 'subscriber') {
    subject = '✨ Welcome to the PlayFest 2026 Priority Feed!';
    htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0c071e; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #120c2d; border-radius: 12px; overflow: hidden; border: 1px solid rgba(139,92,246,0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 26px; letter-spacing: 2px; text-transform: uppercase; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .feature-badge { display: inline-block; background: rgba(236,72,153,0.15); border: 1px solid rgba(236,72,153,0.3); color: #f472b6; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; }
    .footer { background-color: #060214; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); }
    .footer a { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PlayFest 2026</h1>
      <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Priority Feed Access</p>
    </div>
    <div class="content">
      <center><span class="feature-badge">Active Subscription Confirmed</span></center>
      <p>Hello,</p>
      <p>You have successfully joined the <strong>PlayFest 2026 Botswana Priority Feed</strong>!</p>
      
      <p>By subscribing to our priority queue, you will receive exclusive, first-in-line alerts for:</p>
      <ul>
        <li>⚡ Official Ticket Release & Presale codes (save up to 40%)</li>
        <li>🚗 Elite Custom Car Display and Dyno category slot application openings</li>
        <li>🎮 Esports arena registration & tournament brackets</li>
        <li>🎵 Special Headliner announcements and electronic soundwave schedule releases</li>
      </ul>

      <p>We are dedicated to building a premium, high-octane celebration of gaming, custom cars, and underground pop-culture. Expect 100% hype and 0% spam.</p>

      <p style="margin-top: 25px;">See you on the inside!</p>
    </div>
    <div class="footer">
      <p>© 2026 PlayFest Botswana. Gaborone, Botswana.</p>
      <p>Need support or wish to unsubscribe? Contact us at <a href="mailto:info@playfest2026.bw">info@playfest2026.bw</a></p>
    </div>
  </div>
</body>
</html>
`;
  } else {
    return res.status(400).json({
      success: false,
      error: 'Unsupported registration type.',
    });
  }

  // Handle send operation
  if (transporterInstance === 'SIMULATION') {
    console.log('\n=============================================================');
    console.log('📬  [EMAIL SIMULATION] Confirmation email generated successfully!');
    console.log(`TYPE:     ${type.toUpperCase()}`);
    console.log(`TO:       ${targetEmail}`);
    console.log(`FROM:     ${fromHeader}`);
    console.log(`SUBJECT:  ${subject}`);
    console.log('-------------------------------------------------------------');
    console.log('HTML CONTENT PREVIEW (First 250 chars):');
    console.log(htmlContent.replace(/<[^>]*>/g, '').trim().substring(0, 250) + '...');
    console.log('=============================================================\n');

    // Admin alert simulation
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@playfest2026.bw';
    console.log('\n=============================================================');
    console.log('🔔  [EMAIL SIMULATION] Admin alert notification generated successfully!');
    console.log(`TO ADMIN: ${adminEmail}`);
    console.log(`SUBJECT:  🔔 New ${type === 'attendee' ? 'Attendee Registered' : 'Newsletter Subscriber'} Alert`);
    console.log('=============================================================\n');

    return res.status(200).json({
      success: true,
      message: 'Email confirmation simulation succeeded.',
      simulated: true,
    });
  }

  let userEmailSuccess = false;
  let adminEmailSuccess = false;
  let userError = null;
  let adminError = null;

  // 1. Send confirmation email to the user
  try {
    await transporterInstance.sendMail({
      from: fromHeader,
      to: targetEmail,
      subject: subject,
      html: htmlContent,
    });
    userEmailSuccess = true;
    console.log(`[Email System] Successfully sent ${type} confirmation email to:`, targetEmail);
  } catch (error: any) {
    userError = error.message || error;
    console.error(`[Email System] Failed to send email to ${targetEmail} via SMTP:`, userError);
  }

  // 2. Send notification alert to the administrator
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (adminEmail && adminEmail.trim()) {
    try {
      let adminSubject = '';
      let adminHtml = '';

      if (type === 'attendee') {
        adminSubject = `🔔 New Attendee Registered: ${data.fullName}`;
        adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 20px; background-color: #f4f4f7; }
    .card { border: 1px solid #e1e1e6; border-radius: 8px; padding: 24px; max-width: 600px; background-color: #ffffff; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h2 { color: #8b5cf6; margin-top: 0; font-size: 20px; border-bottom: 2px solid #f4f4f7; padding-bottom: 12px; }
    p { font-size: 14px; color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    td { padding: 10px; border-bottom: 1px solid #f4f4f7; font-size: 14px; }
    .label { font-weight: bold; width: 35%; color: #666; }
    .value { color: #111; }
  </style>
</head>
<body>
  <div class="card">
    <h2>🎉 New PlayFest 2026 Registration!</h2>
    <p>A new attendee has successfully registered. Here are the attendee details:</p>
    <table>
      <tr>
        <td class="label">Full Name</td>
        <td class="value">${data.fullName}</td>
      </tr>
      <tr>
        <td class="label">Email Address</td>
        <td class="value"><a href="mailto:${data.email}">${data.email}</a></td>
      </tr>
      <tr>
        <td class="label">Phone Number</td>
        <td class="value">${data.phoneNumber || 'N/A'}</td>
      </tr>
      <tr>
        <td class="label">Country / City</td>
        <td class="value">${data.country || 'Botswana'} / ${data.city || 'N/A'}</td>
      </tr>
      <tr>
        <td class="label">Age Group</td>
        <td class="value">${data.ageGroup || 'N/A'}</td>
      </tr>
      <tr>
        <td class="label">Ticket RSVP Type</td>
        <td class="value">${data.vipInterest === 'Yes' ? 'VIP Giveaway Entry & Priority Waitlist' : 'General Entry'}</td>
      </tr>
      <tr>
        <td class="label">Interests</td>
        <td class="value">${Array.isArray(data.interests) ? data.interests.join(', ') : 'General Interest'}</td>
      </tr>
    </table>
    <p style="font-size: 11px; color: #94a3b8; margin-top: 25px; text-align: center; border-top: 1px solid #f4f4f7; padding-top: 15px;">
      Sent automatically by PlayFest Platform.
    </p>
  </div>
</body>
</html>
        `;
      } else if (type === 'subscriber') {
        adminSubject = `📧 New Newsletter Subscriber: ${data.email}`;
        adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 20px; background-color: #f4f4f7; }
    .card { border: 1px solid #e1e1e6; border-radius: 8px; padding: 24px; max-width: 600px; background-color: #ffffff; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h2 { color: #ec4899; margin-top: 0; font-size: 20px; border-bottom: 2px solid #f4f4f7; padding-bottom: 12px; }
    p { font-size: 14px; color: #555; }
  </style>
</head>
<body>
  <div class="card">
    <h2>📧 New Newsletter Subscriber!</h2>
    <p>A new visitor has subscribed to the PlayFest 2026 newsletter:</p>
    <p style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-weight: bold; border: 1px solid #e2e8f0; font-size: 15px;">
      Email: <a href="mailto:${data.email}">${data.email}</a>
    </p>
    <p style="font-size: 11px; color: #94a3b8; margin-top: 25px; text-align: center; border-top: 1px solid #f4f4f7; padding-top: 15px;">
      Sent automatically by PlayFest Platform.
    </p>
  </div>
</body>
</html>
        `;
      }

      await transporterInstance.sendMail({
        from: fromHeader,
        to: adminEmail.trim(),
        subject: adminSubject,
        html: adminHtml,
      });
      adminEmailSuccess = true;
      console.log(`[Email System] Successfully sent admin notification email to:`, adminEmail);
    } catch (error: any) {
      adminError = error.message || error;
      console.error(`[Email System] Failed to send admin notification to ${adminEmail} via SMTP:`, adminError);
    }
  }

  // Combine and respond
  if (userEmailSuccess) {
    return res.status(200).json({
      success: true,
      message: adminEmailSuccess 
        ? 'Email confirmation and admin notification successfully sent via SMTP.'
        : 'Email confirmation successfully sent via SMTP (admin alert failed).',
      adminNotificationSent: adminEmailSuccess,
      adminWarning: adminError ? 'Admin alert failed: ' + adminError : undefined
    });
  } else {
    return res.status(200).json({
      success: true,
      message: 'SMTP delivery failed for attendee registration.',
      warning: 'Could not deliver attendee confirmation email: ' + userError,
      adminNotificationSent: adminEmailSuccess,
      adminWarning: adminError ? 'Admin alert failed: ' + adminError : undefined
    });
  }
});

// POST Reset Registrations from Google Sheets

app.post('/api/reset-registrations', async (req, res) => {
  console.log('[Sheets Database] Received request to reset all registrations.');
  invalidateSheetsCache();

  // 1. Clear Firestore collections on the server
  let firestoreReset = false;
  if (serverDb) {
    try {
      const p1 = clearFirestoreCollection('registrations');
      const p2 = clearFirestoreCollection('vendors');
      const p3 = clearFirestoreCollection('subscribers');
      const p4 = clearFirestoreCollection('comments');
      await Promise.all([p1, p2, p3, p4]);
      firestoreReset = true;
      console.log('[Server Database] Cleared registrations, vendors, subscribers, and comments from Firestore.');
    } catch (fsErr: any) {
      console.warn('[Server Database] Failed to clear collections in Firestore:', fsErr.message || fsErr);
    }
  }

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const rawSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const spreadsheetId = cleanSpreadsheetId(rawSpreadsheetId);
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Attendees';

  if (!serviceAccountEmail || !rawPrivateKey || !spreadsheetId) {
    console.log('[Sheets Database] Service account config missing for reset-registrations.');
    return res.json({ 
      success: true, 
      message: firestoreReset 
        ? 'Database reset successful (Firestore cleared, Sheets not configured).' 
        : 'Database reset successful (Local cleared, Cloud/Sheets not configured).' 
    });
  }

  try {
    const privateKey = cleanPrivateKey(rawPrivateKey);
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

    // Also clear vendors sheet
    const vendorSheetName = process.env.GOOGLE_SHEET_VENDORS_NAME || 'Vendors';
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${vendorSheetName}!A2:Z10000`,
      });
    } catch (vErr: any) {
      console.log('[Sheets Database] Could not clear vendor sheet:', vErr.message);
    }

    console.log('[Sheets Database] Successfully cleared Google Sheets registrations and vendors.');
    return res.json({ 
      success: true, 
      message: 'Google Sheets and Firestore database reset successfully.' 
    });
  } catch (error: any) {
    console.error('[Sheets Database] Failed to clear Google Sheets:', error);
    return res.status(500).json({
      success: false,
      error: 'Google Sheets API error: ' + (error.message || error),
    });
  }
});

// GET Registrations from Firestore & Google Sheets
app.get('/api/registrations', async (req, res) => {
  const bypassCache = req.query.bypassCache === 'true';
  if (!bypassCache && registrationsCache && (Date.now() - registrationsCache.timestamp < CACHE_TTL_MS)) {
    console.log('[Database API] Returning cached merged registrations list.');
    return res.json({
      success: true,
      registrations: registrationsCache.registrations,
    });
  }

  const blendedMap = new Map<string, any>();
  const getKey = (r: any) => {
    if (r.id && !r.id.startsWith('reg_sheets_') && r.id !== 'Male' && r.id !== 'Female') {
      return r.id;
    }
    return r.email ? `email:${r.email.toLowerCase().trim()}` : (r.id || `reg_${Math.random()}`);
  };

  // 1. Fetch from Firestore (cloud database)
  const firestoreRegs = await fetchFirestoreRegistrations();
  for (const item of firestoreRegs) {
    if (item && (item.fullName || item.email)) {
      blendedMap.set(getKey(item), item);
    }
  }

  // 2. Fetch from Google Sheets Apps Script or Service Account
  let sheetsRegs: any[] = [];
  const webAppUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const rawSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const spreadsheetId = cleanSpreadsheetId(rawSpreadsheetId);
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Attendees';

  if (webAppUrl && !webAppUrl.includes('docs.google.com/spreadsheets')) {
    try {
      console.log('[Sheets Database] Fetching registrations via Apps Script Web App...');
      const fetchUrl = `${webAppUrl}${webAppUrl.includes('?') ? '&' : '?'}spreadsheetId=${encodeURIComponent(spreadsheetId || '')}&sheetName=${encodeURIComponent(sheetName)}`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const responseText = await response.text();
        if (!responseText.trim().startsWith('<!DOCTYPE') && !responseText.trim().startsWith('<html')) {
          let data: any;
          try {
            data = JSON.parse(responseText);
            if (data && data.success && Array.isArray(data.registrations)) {
              sheetsRegs = data.registrations;
              console.log(`[Sheets Database] Successfully fetched ${sheetsRegs.length} registrations via Apps Script Web App.`);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      console.log('[Sheets Database] Web App fetch bypassed. Falling back to alternative storage.');
    }
  }

  if (sheetsRegs.length === 0 && serviceAccountEmail && rawPrivateKey && spreadsheetId) {
    try {
      const privateKey = cleanPrivateKey(rawPrivateKey);
      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:AZ`,
      });

      const rows = getResponse.data.values || [];
      if (rows.length > 1) {
        const headers = rows[0] || [];
        const isLegacyFormat = !headers.includes('City') && !headers.includes('Country');

        sheetsRegs = rows.slice(1).map((row, i) => {
          let id = `reg_sheets_${i}_${Date.now()}`;
          let fullName = 'Attendee';
          let email = 'no-email@example.com';
          let phoneNumber = '';
          let country = 'Botswana';
          let city = 'Gaborone';
          let ageGroup = '25-34';
          let gender = 'Not specified';
          let attendanceLikelihood = 'Definitely';
          let groupSize = 'Just Me';
          let travelDistance = 'Within my city';
          let referralSource = 'Other';
          let interestsStr = '';
          let approximateSpend = 'P200–P500';
          let vipInterest = 'No';
          let merchInterest = 'No';
          let earlyTicketAccess = 'No';
          let ticketType = 'General Access';
          let carRegistration = 'No';
          let gamingPlatform = '';
          let favoriteGames = '';
          let participateInTournaments = '';
          let preferredCategoriesStr = '';
          let vehicleMake = '';
          let vehicleModel = '';
          let vehicleYear = '';
          let buildType = '';
          let modifications = '';
          let displayVehicle = '';
          let enterCompetitions = '';
          let createdAt = new Date().toISOString();

          if (isLegacyFormat || row.length <= 8) {
            fullName = row[0] || 'Attendee';
            email = row[1] || 'no-email@example.com';
            phoneNumber = row[2] || '';
            ticketType = row[3] || 'General Access';
            carRegistration = row[4] || 'No';
            createdAt = row[5] || new Date().toISOString();
            id = row[6] || `reg_sheets_${i}`;
            vipInterest = ticketType.toLowerCase().includes('vip') ? 'Yes' : 'No';
          } else {
            const getVal = (headerName: string, fallbackIdx: number, defaultVal: string = '') => {
              const idx = headers.indexOf(headerName);
              if (idx !== -1 && row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim() !== '') {
                return String(row[idx]).trim();
              }
              if (!headers.length && fallbackIdx >= 0 && fallbackIdx < row.length && row[fallbackIdx] !== undefined && row[fallbackIdx] !== null && String(row[fallbackIdx]).trim() !== '') {
                return String(row[fallbackIdx]).trim();
              }
              return defaultVal;
            };

            id = getVal('Registration ID', 30, `reg_sheets_${i}_${Date.now()}`);
            fullName = getVal('Full Name', 0, 'Attendee');
            email = getVal('Email', 1, 'no-email@example.com');
            phoneNumber = getVal('Phone Number', 2, '');
            country = getVal('Country', 3, 'Botswana');
            city = getVal('City', 4, 'Gaborone');
            ageGroup = getVal('Age Group', 5, '25-34');
            gender = getVal('Gender', 6, 'Not specified');
            attendanceLikelihood = getVal('Attendance Likelihood', 7, 'Definitely');
            groupSize = getVal('Group Size', 8, 'Just Me');
            travelDistance = getVal('Travel Distance', 9, 'Within my city');
            referralSource = getVal('Referral Source', 10, 'Other');
            interestsStr = getVal('Interests', 11, '');
            approximateSpend = getVal('Approximate Spend', 12, 'P200–P500');
            vipInterest = getVal('VIP Interest', 13, 'No');
            merchInterest = getVal('Merch Interest', 14, 'No');
            earlyTicketAccess = getVal('Early Ticket Access', 15, 'No');
            ticketType = getVal('Ticket Type', 16, 'General Access');
            carRegistration = getVal('Car Meet Registration', 17, 'No');
            gamingPlatform = getVal('Gaming Platform', 18, '');
            favoriteGames = getVal('Favorite Games', 19, '');
            participateInTournaments = getVal('Gaming Tournaments', 20, '');
            preferredCategoriesStr = getVal('Gaming Categories', 21, '');
            vehicleMake = getVal('Vehicle Make', 22, '');
            vehicleModel = getVal('Vehicle Model', 23, '');
            vehicleYear = getVal('Vehicle Year', 24, '');
            buildType = getVal('Build Type', 25, '');
            modifications = getVal('Modifications', 26, '');
            displayVehicle = getVal('Display Vehicle', 27, '');
            enterCompetitions = getVal('Enter Competitions', 28, '');
            createdAt = getVal('Timestamp', 29, new Date().toISOString());
          }

          let interests: string[] = [];
          if (interestsStr) {
            interests = interestsStr.split(',').map(s => s.trim()).filter(Boolean);
          }
          if (interests.length === 0) {
            if (carRegistration && !carRegistration.toLowerCase().includes('no')) {
              interests.push('car_meet');
            }
            if (gamingPlatform || favoriteGames) {
              interests.push('gaming');
            }
            if (interests.length === 0) {
              interests = ['general_access'];
            }
          }

          let carDetails = undefined;
          const isCarMeet = (carRegistration && !carRegistration.toLowerCase().includes('no')) || Boolean(vehicleMake || vehicleModel);
          if (isCarMeet) {
            carDetails = {
              vehicleMake: vehicleMake || 'Custom Build',
              vehicleModel: vehicleModel || carRegistration,
              year: vehicleYear || 'N/A',
              buildType: buildType || 'Custom',
              modifications: modifications || 'Showcase Build',
              displayVehicle: displayVehicle || 'Yes',
              enterCompetitions: enterCompetitions || 'No'
            };
          }

          let gamingDetails = undefined;
          if (gamingPlatform || favoriteGames || participateInTournaments) {
            gamingDetails = {
              platform: gamingPlatform || 'PC / Console',
              favoriteGames: favoriteGames || 'Esports',
              participateInTournaments: participateInTournaments || 'No',
              preferredCategories: preferredCategoriesStr ? preferredCategoriesStr.split(',').map(s => s.trim()) : []
            };
          }

          return {
            id,
            fullName,
            email,
            phoneNumber,
            country,
            city,
            ageGroup,
            gender,
            attendanceLikelihood,
            groupSize,
            travelDistance,
            referralSource,
            interests,
            approximateSpend,
            vipInterest,
            merchInterest,
            earlyTicketAccess,
            ticketType,
            carRegistration,
            createdAt,
            carDetails,
            gamingDetails
          };
        });
      }
    } catch (err: any) {
      console.warn('[Sheets Database] Error querying Google Sheets via Service Account:', err.message || err);
    }
  }

  // Merge Sheets records into Blended Map
  for (const rawItem of sheetsRegs) {
    if (rawItem && (rawItem.fullName || rawItem.email)) {
      const isCarReg = rawItem.carRegistration && !String(rawItem.carRegistration).toLowerCase().includes('no');
      const normalizedItem = {
        ...rawItem,
        city: rawItem.city || 'Gaborone',
        country: rawItem.country || 'Botswana',
        ageGroup: rawItem.ageGroup || '25-34',
        attendanceLikelihood: rawItem.attendanceLikelihood || 'Definitely',
        groupSize: rawItem.groupSize || 'Just Me',
        interests: (rawItem.interests && rawItem.interests.length > 0) ? rawItem.interests : (
          isCarReg ? ['car_meet'] : ['general_access']
        ),
        vipInterest: rawItem.vipInterest || (rawItem.ticketType?.toLowerCase().includes('vip') ? 'Yes' : 'No')
      };
      const key = getKey(normalizedItem);
      const existing = blendedMap.get(key);
      if (existing) {
        blendedMap.set(key, { ...existing, ...normalizedItem });
      } else {
        blendedMap.set(key, normalizedItem);
      }
    }
  }

  const allRegistrations = Array.from(blendedMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  registrationsCache = {
    registrations: allRegistrations,
    timestamp: Date.now()
  };

  return res.json({
    success: true,
    registrations: allRegistrations,
  });
});

// GET Vendors from Google Sheets (or fallback)
app.get('/api/vendors', async (req, res) => {
  const bypassCache = req.query.bypassCache === 'true';
  if (!bypassCache && vendorsCache && (Date.now() - vendorsCache.timestamp < CACHE_TTL_MS)) {
    console.log('[Sheets Database] Returning cached vendors list.');
    return res.json({
      success: true,
      vendors: vendorsCache.vendors,
    });
  }

  const blendedMap = new Map<string, any>();
  const getKey = (v: any) => {
    if (v.id && !v.id.startsWith('vendor_sheets_')) {
      return v.id;
    }
    return v.email ? `email:${v.email.toLowerCase().trim()}` : (v.id || `vendor_${Math.random()}`);
  };

  // 1. Fetch from Firestore (cloud database)
  const firestoreVendors = await fetchFirestoreVendors();
  for (const item of firestoreVendors) {
    if (item && (item.businessName || item.email)) {
      blendedMap.set(getKey(item), item);
    }
  }

  // 2. Fetch from Google Sheets
  let sheetsVendors: any[] = [];
  const webAppUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const rawSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const spreadsheetId = cleanSpreadsheetId(rawSpreadsheetId);
  const sheetName = process.env.GOOGLE_SHEET_VENDORS_NAME || 'Vendors';

  if (webAppUrl) {
    try {
      if (!webAppUrl.includes('docs.google.com/spreadsheets')) {
        console.log('[Sheets Database] WebApp URL configured. Fetching vendors via Apps Script Web App...');
        const fetchUrl = `${webAppUrl}${webAppUrl.includes('?') ? '&' : '?'}type=vendors&spreadsheetId=${encodeURIComponent(spreadsheetId || '')}&spreadsheet_id=${encodeURIComponent(spreadsheetId || '')}&sheetName=${encodeURIComponent(sheetName)}&sheet_name=${encodeURIComponent(sheetName)}`;
        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        if (response.ok) {
          const responseText = await response.text();
          if (!responseText.trim().startsWith('<!DOCTYPE') && !responseText.trim().startsWith('<html')) {
            let data: any;
            try {
              data = JSON.parse(responseText);
            } catch (jsonErr: any) {
              console.log('[Sheets Database] Response parsing parsed with issues.');
            }

            if (data && data.success && Array.isArray(data.vendors)) {
              console.log(`[Sheets Database] Successfully fetched ${data.vendors.length} vendors via Apps Script Web App.`);
              sheetsVendors = data.vendors;
            }
          }
        }
      }
    } catch (err: any) {
      console.log('[Sheets Database] Web App fetch bypassed for vendors.', err.message || err);
    }
  }

  if (serviceAccountEmail && rawPrivateKey && spreadsheetId) {
    try {
      const privateKey = cleanPrivateKey(rawPrivateKey);
      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const range = `${sheetName}!A:L`;

      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = getResponse.data.values || [];
      if (rows.length > 1) {
        const headers = rows[0];
        const bizNameIndex = headers.indexOf('Business Name');
        const contactIndex = headers.indexOf('Contact Person');
        const numberIndex = headers.indexOf('Contact Number');
        const emailIndex = headers.indexOf('Email');
        const categoryIndex = headers.indexOf('Category');
        const productsIndex = headers.indexOf('Products / Services');
        const socialIndex = headers.indexOf('Social Media Links');
        const sizeIndex = headers.indexOf('Stall Size');
        const electricityIndex = headers.indexOf('Electricity Required');
        const additionalIndex = headers.indexOf('Additional Requests');
        const timestampIndex = headers.indexOf('Timestamp');
        const idIndex = headers.indexOf('Vendor ID');

        sheetsVendors = rows.slice(1).map((row, i) => {
          return {
            id: idIndex !== -1 ? row[idIndex] : (row[11] || `vendor_sheets_${i}`),
            businessName: bizNameIndex !== -1 ? row[bizNameIndex] : (row[0] || ''),
            contactPerson: contactIndex !== -1 ? row[contactIndex] : (row[1] || ''),
            contactNumber: numberIndex !== -1 ? row[numberIndex] : (row[2] || ''),
            email: emailIndex !== -1 ? row[emailIndex] : (row[3] || ''),
            category: categoryIndex !== -1 ? row[categoryIndex] : (row[4] || 'Other'),
            productsOrServices: productsIndex !== -1 ? row[productsIndex] : (row[5] || ''),
            socialMediaLinks: socialIndex !== -1 ? row[socialIndex] : (row[6] || ''),
            stallSize: sizeIndex !== -1 ? row[sizeIndex] : (row[7] || 'Small (3m x 3m)'),
            electricityRequired: electricityIndex !== -1 ? row[electricityIndex] : (row[8] || 'No'),
            additionalRequests: additionalIndex !== -1 ? row[additionalIndex] : (row[9] || ''),
            createdAt: timestampIndex !== -1 ? row[timestampIndex] : (row[10] || new Date().toISOString()),
            country: 'Botswana'
          };
        });
      }
    } catch (error: any) {
      console.error('[Sheets Database] Failed to query vendors from Google Sheets:', error.message || error);
    }
  }

  // Merge Sheets records into Blended Map
  for (const rawItem of sheetsVendors) {
    if (rawItem && (rawItem.businessName || rawItem.email)) {
      const key = getKey(rawItem);
      const existing = blendedMap.get(key);
      if (existing) {
        blendedMap.set(key, { ...existing, ...rawItem });
      } else {
        blendedMap.set(key, rawItem);
      }
    }
  }

  const allVendors = Array.from(blendedMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  vendorsCache = {
    vendors: allVendors,
    timestamp: Date.now()
  };

  return res.json({
    success: true,
    vendors: allVendors,
  });
});

// GET Google Sheets diagnostics/telemetry status
app.get('/api/sheets-diagnostics', async (req, res) => {
  const webAppUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const rawSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const spreadsheetId = cleanSpreadsheetId(rawSpreadsheetId);
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Attendees';
  const vendorSheetName = process.env.GOOGLE_SHEET_VENDORS_NAME || 'Vendors';

  const diagnostics: any = {
    webAppUrlConfigured: !!webAppUrl,
    serviceAccountConfigured: !!(serviceAccountEmail && rawPrivateKey && spreadsheetId),
    spreadsheetId: spreadsheetId || null,
    sheetName,
    vendorSheetName,
    status: 'UNKNOWN',
    error: null,
    details: {}
  };

  if (webAppUrl) {
    diagnostics.status = 'USING_WEBAPP';
    if (webAppUrl.includes('docs.google.com/spreadsheets')) {
      diagnostics.status = 'ERROR';
      diagnostics.error = 'GOOGLE_SHEETS_WEBAPP_URL is set to a normal Google Sheets URL instead of a deployed Google Apps Script /exec Web App URL.';
    } else {
      try {
        const testUrl = `${webAppUrl}${webAppUrl.includes('?') ? '&' : '?'}spreadsheetId=${encodeURIComponent(spreadsheetId || '')}&spreadsheet_id=${encodeURIComponent(spreadsheetId || '')}&sheetName=${encodeURIComponent(sheetName)}&sheet_name=${encodeURIComponent(sheetName)}`;
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          diagnostics.status = 'ERROR';
          diagnostics.error = `Web App returned status ${response.status} when testing connection.`;
        } else {
          const text = await response.text();
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            diagnostics.status = 'ERROR';
            diagnostics.error = 'Web App returned an HTML page instead of JSON. Ensure your Google Apps Script is deployed with "Execute as: Me" and "Who has access: Anyone".';
          } else {
            const parsed = JSON.parse(text);
            if (parsed.success === false) {
              diagnostics.status = 'ERROR';
              diagnostics.error = parsed.error || 'Web App returned success: false';
            } else {
              diagnostics.details = {
                title: 'Google Apps Script Web App',
                tabs: [sheetName, vendorSheetName],
                message: 'Successfully reached Web App!',
                registrationsCount: parsed.registrations ? parsed.registrations.length : 0,
                vendorsCount: parsed.vendors ? parsed.vendors.length : 0
              };
            }
          }
        }
      } catch (err: any) {
        diagnostics.status = 'ERROR';
        diagnostics.error = `Could not reach Web App: ${err.message || err}`;
      }
    }
  } else if (serviceAccountEmail && rawPrivateKey && spreadsheetId) {
    try {
      const privateKey = cleanPrivateKey(rawPrivateKey);
      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });

      diagnostics.status = 'CONNECTED';
      diagnostics.details = {
        title: sheetMeta.data.properties?.title || 'Untitled Sheet',
        tabs: sheetMeta.data.sheets?.map(s => s.properties?.title || '') || []
      };

      const tabs = diagnostics.details.tabs;
      const attendeesExist = tabs.includes(sheetName);
      const vendorsExist = tabs.includes(vendorSheetName);

      if (!attendeesExist || !vendorsExist) {
        diagnostics.status = 'WARNING';
        const missing = [];
        if (!attendeesExist) missing.push(`"${sheetName}"`);
        if (!vendorsExist) missing.push(`"${vendorSheetName}"`);
        diagnostics.error = `Connected successfully, but missing required tab(s): ${missing.join(', ')}. Please rename your Google Sheet tabs or check your GOOGLE_SHEET_NAME / GOOGLE_SHEET_VENDORS_NAME variables.`;
      }
    } catch (err: any) {
      diagnostics.status = 'ERROR';
      diagnostics.error = err.message || String(err);
    }
  } else {
    diagnostics.status = 'SIMULATION_MODE';
    diagnostics.error = 'No Google Sheets variables are configured. Saving only to local cache and Firestore replication.';
  }

  return res.json(diagnostics);
});

// Serve health status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', backupSystemActive: !!(process.env.GOOGLE_SPREADSHEET_ID) });
});

// Serve custom favicon directly to prevent caching and path resolution issues in development
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/assets/images/playfest_favicon_1784490332136.jpg'));
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
