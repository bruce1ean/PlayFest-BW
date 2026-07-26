/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  memoryLocalCache, 
  collection, 
  addDoc, 
  getDocs, 
  getDocsFromServer,
  query, 
  doc, 
  setDoc,
  updateDoc,
  getDoc,
  getDocFromServer,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AttendeeRegistration, NewsletterSubscriber, AppAnalytics, ConceptComment } from '../types';
import { generateSeedData } from '../mockData';

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
      firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)'
    };
  }
  return firebaseConfig;
};

const resolvedConfig = getFirebaseConfig();

// 1. Initialize Firebase safely
const isPlaceholder = !resolvedConfig || !resolvedConfig.apiKey || resolvedConfig.apiKey.includes('placeholder') || resolvedConfig.apiKey === '';

let app;
let db: any = null;
let auth: any = null;
let useFirebase = false;

if (!isPlaceholder) {
  try {
    app = getApps().length === 0 ? initializeApp(resolvedConfig) : getApp();
    try {
      db = initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: true
      }, resolvedConfig.firestoreDatabaseId);
    } catch (initErr: any) {
      db = getFirestore(app, resolvedConfig.firestoreDatabaseId);
    }
    auth = getAuth(app);
    useFirebase = true;
    console.log('Firebase initialized. Using real cloud database.');
  } catch (error) {
    console.error('Error initializing real Firebase. Falling back to LocalStorage.', error);
    useFirebase = false;
  }
}

// 2. Local Storage Seed & Helper logic
const STORAGE_REGISTRATIONS_KEY = 'playfest_registrations';
const STORAGE_VENDORS_KEY = 'playfest_vendors';
const STORAGE_SUBSCRIBERS_KEY = 'playfest_subscribers';
const STORAGE_ANALYTICS_KEY = 'playfest_analytics';
const STORAGE_COMMENTS_KEY = 'playfest_comments';

const DEFAULT_COMMENTS: ConceptComment[] = [];

function getLocalData<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

function saveLocalData<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Seed local storage with high-fidelity realistic data on first load
function ensureSeededLocalData() {
  const resetDone = localStorage.getItem('playfest_zero_reset_v5');
  if (!resetDone) {
    saveLocalData(STORAGE_REGISTRATIONS_KEY, []);
    saveLocalData(STORAGE_VENDORS_KEY, []);
    saveLocalData(STORAGE_SUBSCRIBERS_KEY, []);
    saveLocalData(STORAGE_COMMENTS_KEY, []); // Clear comments
    
    // Seed initial clean zero-based analytics
    const initialAnalytics: AppAnalytics = {
      visitors: 0,
      clicks: {
        'btn-register-hero': 0,
        'btn-become-partner': 0,
        'btn-become-sponsor': 0,
        'btn-vendor-tab': 0,
        'btn-share-whatsapp': 0,
        'btn-share-facebook': 0
      },
      deviceTypes: { mobile: 0, desktop: 0, tablet: 0 },
      trafficSources: {
        'TikTok': 0,
        'Instagram': 0,
        'Facebook': 0,
        'WhatsApp': 0,
        'Friend': 0,
        'Other': 0
      }
    };
    saveLocalData(STORAGE_ANALYTICS_KEY, initialAnalytics);
    localStorage.setItem('playfest_zero_reset_v5', 'true');
    localStorage.removeItem('playfest_seeded_v1');
  }
}

// Initialize LocalStorage Seeds
ensureSeededLocalData();

// 3. Error handling helper from fire-integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Verification Check & Auto-Synchronization
let hasSynced = false;

async function syncLocalToFirebase() {
  if (!useFirebase || !db || hasSynced) return;
  hasSynced = true;
  try {
    console.log('Starting high-fidelity local-to-cloud synchronization...');

    // 1. Sync registrations
    const localRegs = getLocalData<AttendeeRegistration[]>(STORAGE_REGISTRATIONS_KEY, []);
    if (localRegs.length > 0) {
      const qSnap = await getDocs(collection(db, 'registrations'));
      const firebaseIds = new Set(qSnap.docs.map(docSnap => docSnap.id));
      for (const reg of localRegs) {
        if (!firebaseIds.has(reg.id)) {
          await setDoc(doc(db, 'registrations', reg.id), reg);
          console.log('Synced registration to Firestore:', reg.id);
        }
      }
    }

    // 2. Sync subscribers
    const localSubs = getLocalData<NewsletterSubscriber[]>(STORAGE_SUBSCRIBERS_KEY, []);
    if (localSubs.length > 0) {
      const qSnap = await getDocs(collection(db, 'subscribers'));
      const firebaseIds = new Set(qSnap.docs.map(docSnap => docSnap.id));
      for (const s of localSubs) {
        if (!firebaseIds.has(s.id)) {
          await setDoc(doc(db, 'subscribers', s.id), s);
          console.log('Synced newsletter subscriber to Firestore:', s.id);
        }
      }
    }

    // 3. Sync comments
    const localComments = getLocalData<ConceptComment[]>(STORAGE_COMMENTS_KEY, []);
    if (localComments.length > 0) {
      const qSnap = await getDocs(collection(db, 'comments'));
      const firebaseIds = new Set(qSnap.docs.map(docSnap => docSnap.id));
      for (const c of localComments) {
        if (!firebaseIds.has(c.id)) {
          await setDoc(doc(db, 'comments', c.id), c);
          console.log('Synced concept review to Firestore:', c.id);
        }
      }
    }
    
    console.log('Local-to-cloud synchronization completed successfully.');
  } catch (error) {
    console.error('Error in syncLocalToFirebase:', error);
  }
}

async function testConnection() {
  if (!useFirebase || !db) return;
  try {
    // registrations has allow read: if true, so reading a dummy document there is allowed and won't throw permission errors!
    await getDocFromServer(doc(db, 'registrations', 'test_connection'));
    console.log('Tested Firestore server connection: OK');
    await syncLocalToFirebase();
  } catch (error) {
    console.warn('Firestore connection test bypassed or offline:', error);
    try {
      await syncLocalToFirebase();
    } catch (syncErr) {
      console.warn('Sync fallback failed:', syncErr);
    }
  }
}
testConnection();

// Helper to invoke the server-side Google Sheet system synchronously (falling back gracefully on errors)
async function saveToGoogleSheets(newReg: AttendeeRegistration) {
  try {
    // Determine the backup ticket type based on registration properties
    let ticketType = 'General Entry & Prize Draw';
    if (newReg.vipInterest === 'Yes' || newReg.vipInterest === 'Maybe') {
      ticketType = 'VIP Giveaway Entry & Priority Waitlist';
    } else if (newReg.earlyTicketAccess === 'Yes') {
      ticketType = 'Early Notification & Giveaway Entry';
    }

    // Determine car details formatting if applicable
    let carRegistration = 'No';
    if (newReg.carDetails) {
      const { year, vehicleMake, vehicleModel, buildType } = newReg.carDetails;
      carRegistration = `Yes (${year} ${vehicleMake} ${vehicleModel} - ${buildType})`;
    } else if (newReg.interests && newReg.interests.includes('car_meet')) {
      carRegistration = 'Yes (Interested)';
    }

    const backupPayload = {
      id: newReg.id,
      fullName: newReg.fullName,
      email: newReg.email,
      phoneNumber: newReg.phoneNumber,
      ticketType,
      carRegistration,
      createdAt: newReg.createdAt
    };

    const response = await fetch('/api/backup-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backupPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMessage = `Server error ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        errorMessage = parsed.error || parsed.message || errorMessage;
      } catch {
        if (errText && !errText.trim().startsWith('<')) {
          errorMessage = errText;
        } else {
          errorMessage = `Endpoint returned status ${response.status} (possibly not configured or running in a static-only environment)`;
        }
      }
      console.warn('[Storage/Google Sheets] Backup endpoint returned non-ok status:', errorMessage);
      return;
    }
    console.log('[Storage/Google Sheets] Registration successfully backed up to Google Sheets:', newReg.id);
  } catch (error: any) {
    console.warn('[Storage/Google Sheets] Failed to connect to Google Sheets backup endpoint:', error.message || error);
  }
}

// Helper to send a confirmation email via backend
async function sendConfirmationEmail(type: 'attendee' | 'subscriber', data: any) {
  try {
    const response = await fetch('/api/send-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });
    if (!response.ok) {
      console.warn('[Email Confirmation] Server returned status:', response.status);
    } else {
      console.log('[Email Confirmation] Successfully triggered confirmation email for', type);
    }
  } catch (error: any) {
    console.warn('[Email Confirmation] Failed to connect to server email endpoint:', error.message || error);
  }
}

// 5. Exposed Unified Database API
export const storage = {
  isRealFirebase(): boolean {
    return useFirebase;
  },

  getAuth() {
    return auth;
  },

  getDb() {
    return db;
  },

  // GET Registrations
  async getRegistrations(bypassCache = false): Promise<AttendeeRegistration[]> {
    const local = getLocalData<AttendeeRegistration[]>(STORAGE_REGISTRATIONS_KEY, []);
    let blended = [...local];

    try {
      const response = await fetch(`/api/registrations${bypassCache ? '?bypassCache=true' : ''}`);
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data && data.success && Array.isArray(data.registrations)) {
            const sheetRegs = data.registrations as AttendeeRegistration[];
            
            // Merge sheetRegs with local storage, ensuring we prioritize sheet records and avoid duplicates
            const sheetIds = new Set(sheetRegs.map(r => r.id));
            const localOnly = local.filter(l => !sheetIds.has(l.id));
            blended = [...sheetRegs, ...localOnly];
          }
        } else {
          console.log('[Storage] Fetch registrations response was not JSON:', contentType);
        }
      }
    } catch (error) {
      console.log('Error fetching registrations from Google Sheets API, falling back to LocalStorage:', error);
    }

    if (useFirebase && db) {
      try {
        const querySnapshot = bypassCache
          ? await getDocsFromServer(collection(db, 'registrations'))
          : await getDocs(collection(db, 'registrations'));
        const firebaseList: AttendeeRegistration[] = [];
        querySnapshot.forEach((docSnap) => {
          firebaseList.push({ id: docSnap.id, ...docSnap.data() } as AttendeeRegistration);
        });
        
        const ids = new Set(blended.map(r => r.id));
        firebaseList.forEach(item => {
          if (!ids.has(item.id)) {
            blended.push(item);
          }
        });
      } catch (error) {
        console.warn('Error fetching registrations from Firebase, falling back to LocalStorage:', error);
      }
    }
    return blended.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // SAVE Registration
  async saveRegistration(reg: Omit<AttendeeRegistration, 'id' | 'createdAt'>): Promise<AttendeeRegistration> {
    const newReg: AttendeeRegistration = {
      ...reg,
      id: `reg_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    // SAVE Locally first
    const local = getLocalData<AttendeeRegistration[]>(STORAGE_REGISTRATIONS_KEY, []);
    local.push(newReg);
    saveLocalData(STORAGE_REGISTRATIONS_KEY, local);

    // SAVE to Firebase if enabled (non-blocking to prevent UI hangs on offline/network/iframe glitches)
    if (useFirebase && db) {
      setDoc(doc(db, 'registrations', newReg.id), newReg)
        .then(() => {
          console.log('Firebase registration saved successfully:', newReg.id);
        })
        .catch((error) => {
          console.error('Firestore Error saving registration:', error);
        });
    }

    // Backup to Google Sheets asynchronously
    saveToGoogleSheets(newReg).catch(err => {
      console.warn('Google Sheets backup error:', err);
    });

    // Send confirmation email asynchronously
    sendConfirmationEmail('attendee', newReg).catch(err => {
      console.warn('Confirmation email error:', err);
    });

    return newReg;
  },

  // GET Newsletter Subscribers
  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    const local = getLocalData<NewsletterSubscriber[]>(STORAGE_SUBSCRIBERS_KEY, []);
    let blended = [...local];

    if (useFirebase && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'subscribers'));
        const firebaseList: NewsletterSubscriber[] = [];
        querySnapshot.forEach((docSnap) => {
          firebaseList.push({ id: docSnap.id, ...docSnap.data() } as NewsletterSubscriber);
        });
        
        const ids = new Set(local.map(s => s.id));
        firebaseList.forEach(item => {
          if (!ids.has(item.id)) {
            blended.push(item);
          }
        });
      } catch (error) {
        console.warn('Error fetching subscribers from Firebase, falling back to LocalStorage:', error);
      }
    }
    return blended.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // SUBSCRIBE to Newsletter
  async subscribeNewsletter(email: string): Promise<NewsletterSubscriber> {
    const newSub: NewsletterSubscriber = {
      id: `sub_${Math.random().toString(36).substring(2, 9)}`,
      email,
      createdAt: new Date().toISOString()
    };

    const local = getLocalData<NewsletterSubscriber[]>(STORAGE_SUBSCRIBERS_KEY, []);
    if (!local.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      local.push(newSub);
      saveLocalData(STORAGE_SUBSCRIBERS_KEY, local);
    }

    if (useFirebase && db) {
      // Fire-and-forget: do not await the Firestore write to prevent UI block when auth is disabled or offline
      setDoc(doc(db, 'subscribers', newSub.id), newSub)
        .then(() => {
          console.log('Firebase subscription saved successfully:', newSub.id);
        })
        .catch((error) => {
          console.error('Firestore Error saving subscription, fallback to local retention:', error);
        });
    }

    // Trigger asynchronous email confirmation
    sendConfirmationEmail('subscriber', newSub);

    return newSub;
  },

  // GET Analytics
  async getAnalytics(): Promise<AppAnalytics> {
    if (useFirebase && db) {
      try {
        const docRef = doc(db, 'analytics', 'dashboard');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as AppAnalytics;
        } else {
          // Initialize in Firebase if not exists and return local base config
          const initial = getLocalData<AppAnalytics>(STORAGE_ANALYTICS_KEY, {
            visitors: 0,
            clicks: {},
            deviceTypes: { mobile: 0, desktop: 0, tablet: 0 },
            trafficSources: {}
          });
          await setDoc(docRef, initial);
          return initial;
        }
      } catch (error) {
        console.warn('Error fetching analytics from Firebase, falling back to LocalStorage:', error);
      }
    }
    return getLocalData<AppAnalytics>(STORAGE_ANALYTICS_KEY, {
      visitors: 0,
      clicks: {},
      deviceTypes: { mobile: 0, desktop: 0, tablet: 0 },
      trafficSources: {}
    });
  },

  // TRACK Clicks on landing page buttons
  async trackClick(buttonId: string): Promise<void> {
    const local = getLocalData<AppAnalytics>(STORAGE_ANALYTICS_KEY, {
      visitors: 0,
      clicks: {},
      deviceTypes: { mobile: 0, desktop: 0, tablet: 0 },
      trafficSources: {}
    });
    
    local.clicks[buttonId] = (local.clicks[buttonId] || 0) + 1;
    saveLocalData(STORAGE_ANALYTICS_KEY, local);

    if (useFirebase && db) {
      try {
        const docRef = doc(db, 'analytics', 'dashboard');
        await updateDoc(docRef, {
          [`clicks.${buttonId}`]: (local.clicks[buttonId] || 0)
        });
      } catch {
        // Soft fail to allow seamless experience
      }
    }
  },

  // TRACK Visitors count and device sizes
  async trackVisit(): Promise<void> {
    const local = getLocalData<AppAnalytics>(STORAGE_ANALYTICS_KEY, {
      visitors: 0,
      clicks: {},
      deviceTypes: { mobile: 0, desktop: 0, tablet: 0 },
      trafficSources: {}
    });

    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    local.visitors += 1;
    if (isMobile) {
      local.deviceTypes.mobile += 1;
    } else if (isTablet) {
      local.deviceTypes.tablet += 1;
    } else {
      local.deviceTypes.desktop += 1;
    }

    saveLocalData(STORAGE_ANALYTICS_KEY, local);

    if (useFirebase && db) {
      try {
        const docRef = doc(db, 'analytics', 'dashboard');
        await setDoc(docRef, local);
      } catch {
        // Soft fail
      }
    }
  },

  // GET Concept Reviews / Comments
  async getConceptComments(): Promise<ConceptComment[]> {
    const local = getLocalData<ConceptComment[]>(STORAGE_COMMENTS_KEY, DEFAULT_COMMENTS);
    let blended = [...local];

    if (useFirebase && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'comments'));
        const firebaseList: ConceptComment[] = [];
        querySnapshot.forEach((docSnap) => {
          firebaseList.push({ id: docSnap.id, ...docSnap.data() } as ConceptComment);
        });
        
        const ids = new Set(local.map(c => c.id));
        firebaseList.forEach(item => {
          if (!ids.has(item.id)) {
            blended.push(item);
          }
        });
      } catch (error) {
        console.warn('Error fetching concept comments from Firebase, falling back to LocalStorage:', error);
      }
    }
    return blended.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // SAVE Custom Concept Review / Comment
  async saveConceptComment(comment: Omit<ConceptComment, 'id' | 'createdAt'>): Promise<ConceptComment> {
    const newComment: ConceptComment = {
      ...comment,
      id: `comm_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    // ALWAYS save locally first
    const local = getLocalData<ConceptComment[]>(STORAGE_COMMENTS_KEY, DEFAULT_COMMENTS);
    local.push(newComment);
    saveLocalData(STORAGE_COMMENTS_KEY, local);

    if (useFirebase && db) {
      // Fire-and-forget: do not await the Firestore write to prevent UI block when auth is disabled or offline
      setDoc(doc(db, 'comments', newComment.id), newComment)
        .then(() => {
          console.log('Firebase brand/concept comment saved successfully:', newComment.id);
        })
        .catch((error) => {
          console.error('Firestore Error saving comment, fallback to local retention:', error);
        });
    }

    return newComment;
  },

  // Fallback Credentials Helpers for when Firebase Auth is disabled in Starter tier sandbox
  async saveFallbackCredential(email: string, password: string): Promise<void> {
    const key = 'playfest_fallback_credentials';
    const local = getLocalData<Record<string, string>>(key, {});
    local[email.trim().toLowerCase()] = password;
    saveLocalData(key, local);

    if (useFirebase && db) {
      // Fire-and-forget: do not await the Firestore write to prevent UI block when auth is disabled, offline, or rule-restricted
      setDoc(doc(db, 'credentials', email.trim().toLowerCase()), {
        email: email.trim().toLowerCase(),
        password: password,
        createdAt: new Date().toISOString()
      })
      .then(() => {
        console.log('Fallback credential mirrored successfully to Firestore.');
      })
      .catch((e) => {
        console.warn('Could not mirror fallback credentials to Firestore:', e);
      });
    }
  },

  async verifyFallbackCredential(email: string, password: string): Promise<boolean> {
    const key = 'playfest_fallback_credentials';
    const local = getLocalData<Record<string, string>>(key, {});
    const storedPassword = local[email.trim().toLowerCase()];
    
    if (storedPassword && storedPassword === password) {
      return true;
    }

    // Double check in Firestore
    if (useFirebase && db) {
      try {
        const docRef = doc(db, 'credentials', email.trim().toLowerCase());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().password === password) {
          // Update local cache
          local[email.trim().toLowerCase()] = password;
          saveLocalData(key, local);
          return true;
        }
      } catch (e) {
        console.warn('Could not verify credentials against Firestore:', e);
      }
    }

    return false;
  },

  // RESET All Registrations (LocalStorage + Google Sheets + Firestore)
  async resetRegistrations(): Promise<void> {
    // 1. Clear locally
    saveLocalData(STORAGE_REGISTRATIONS_KEY, []);

    // 2. Clear Google Sheets via API
    try {
      const response = await fetch('/api/reset-registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        console.warn('[Storage] Server reset registrations endpoint returned non-ok status');
      }
    } catch (err) {
      console.error('[Storage] Error calling reset-registrations API:', err);
    }

    // 3. Clear Firestore collection if active
    if (useFirebase && db) {
      try {
        const qSnap = await getDocs(collection(db, 'registrations'));
        const deletePromises = qSnap.docs.map((docSnap) => deleteDoc(doc(db, 'registrations', docSnap.id)));
        await Promise.all(deletePromises);
        console.log('[Storage] Successfully cleared registrations in Firestore.');
      } catch (err) {
        console.error('[Storage] Failed to clear registrations in Firestore:', err);
      }
    }
  }
};
