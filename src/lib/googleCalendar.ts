/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Resolve Firebase Config from environment variables or local JSON config
const getFirebaseConfig = () => {
  const metaEnv = (import.meta as any).env || {};
  if (
    metaEnv.VITE_FIREBASE_API_KEY &&
    metaEnv.VITE_FIREBASE_PROJECT_ID
  ) {
    return {
      apiKey: metaEnv.VITE_FIREBASE_API_KEY,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: metaEnv.VITE_FIREBASE_APP_ID || '',
      measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || '',
      firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || '(default)'
    };
  }
  return firebaseConfig;
};

const resolvedConfig = getFirebaseConfig();

// Initialize Firebase safely for Calendar OAuth
const isPlaceholder = !resolvedConfig || !resolvedConfig.apiKey || resolvedConfig.apiKey.includes('placeholder') || resolvedConfig.apiKey === '';

let app;
let auth: any = null;

if (!isPlaceholder) {
  try {
    app = getApps().length === 0 ? initializeApp(resolvedConfig) : getApp();
    auth = getAuth(app);
  } catch (error) {
    console.error('Error initializing Auth for Google Calendar', error);
  }
}

const provider = new GoogleAuthProvider();
// Request Calendar and Gmail scopes
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Initiate Google sign in
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (!auth) {
    throw new Error('Google Authentication is not pre-configured via Firebase API values.');
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve valid access token from Google identity provider.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logout = async () => {
  if (auth) {
    await auth.signOut();
  }
  cachedAccessToken = null;
};

// Call Google Calendar API to add PlayFest 2026 event
export const addPlayFestEventToCalendar = async (accessToken: string, ticketDetails: { name: string; serial: string }) => {
  const eventBody = {
    summary: 'PlayFest 2026 Botswana 🇧🇼',
    description: `🎮 Gaborone's premier festival of gaming, custom stance cars, and live music!\n\nWaitlist Seat Confirmed:\nAttendee Name: ${ticketDetails.name}\nRSVP Serial No: ${ticketDetails.serial}\nStatus: Verified Priority RSVPs\n\nShow your serial pass at the entrance gate. Prepare for an unforgettable weekend!\nWebsite: https://playfest2026.bw`,
    location: 'Gaborone, Botswana',
    start: {
      dateTime: '2026-11-20T10:00:00',
      timeZone: 'Africa/Gaborone'
    },
    end: {
      dateTime: '2026-11-22T22:00:00',
      timeZone: 'Africa/Gaborone'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 120 }   // 2 hours before
      ]
    },
    colorId: '6' // Tangerine / Pink Accent
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Calendar request failed: ${errText || response.statusText}`);
  }

  return await response.json();
};

// Retrieve authenticating user's Gmail profile details
export const getGmailProfile = async (accessToken: string) => {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to retrieve Gmail profile: ${errText || response.statusText}`);
  }
  return await response.json();
};

// Send an HTML format email using user's real Gmail account
export const sendPlayFestEmailWithGmail = async (
  accessToken: string,
  recipientEmail: string,
  subject: string,
  htmlMessage: string
) => {
  const toBase64Url = (str: string) => {
    const utf8Bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return window.btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const emailContent = [
    `To: ${recipientEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlMessage
  ].join('\r\n');

  const raw = toBase64Url(emailContent);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gmail send failed: ${errText || response.statusText}`);
  }

  return await response.json();
};
