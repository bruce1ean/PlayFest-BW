/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore,
  memoryLocalCache, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  doc, 
  setDoc,
  updateDoc,
  getDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AttendeeRegistration, VendorApplication, NewsletterSubscriber, AppAnalytics, ConceptComment } from '../types';
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
      firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || '(default)'
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
    db = initializeFirestore(app, {
      localCache: memoryLocalCache()
    }, resolvedConfig.firestoreDatabaseId);
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

    // 2. Sync vendors
    const localVendors = getLocalData<VendorApplication[]>(STORAGE_VENDORS_KEY, []);
    if (localVendors.length > 0) {
      const qSnap = await getDocs(collection(db, 'vendors'));
      const firebaseIds = new Set(qSnap.docs.map(docSnap => docSnap.id));
      for (const v of localVendors) {
        if (!firebaseIds.has(v.id)) {
          await setDoc(doc(db, 'vendors', v.id), v);
          console.log('Synced vendor application to Firestore:', v.id);
        }
      }
    }

    // 3. Sync subscribers
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

    // 4. Sync comments
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
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Tested Firestore server connection: OK');
    await syncLocalToFirebase();
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline. Falling back to local replication.");
    }
  }
}
testConnection();

// Helper to invoke the server-side Google Sheet system synchronously (throwing on errors)
async function saveToGoogleSheets(newReg: AttendeeRegistration) {
  // Determine the backup ticket type based on registration properties
  let ticketType = 'General Entry & Prize Draw';
  if (newReg.vipInterest === 'Yes' || newReg.vipInterest === 'Maybe') {
    ticketType = 'VIP Giveaway Entry & Priority Waitlist';
  } else if (newReg.earlyTicketAccess === 'Yes') {
    ticketType = 'Early Notification & Giveaway Entry';
  }

  // Determine car details formatting if applicable
  let carRegistration = 'N/A';
  if (newReg.carDetails) {
    const { year, vehicleMake, vehicleModel, buildType } = newReg.carDetails;
    carRegistration = `${year} ${vehicleMake} ${vehicleModel} (${buildType})`;
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
      if (errText) errorMessage = errText;
    }
    throw new Error(errorMessage);
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
  async getRegistrations(): Promise<AttendeeRegistration[]> {
    const local = getLocalData<AttendeeRegistration[]>(STORAGE_REGISTRATIONS_KEY, []);
    let blended = [...local];

    if (useFirebase && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'registrations'));
        const firebaseList: AttendeeRegistration[] = [];
        querySnapshot.forEach((docSnap) => {
          firebaseList.push({ id: docSnap.id, ...docSnap.data() } as AttendeeRegistration);
        });
        
        // Merge without duplicates by id
        const ids = new Set(local.map(r => r.id));
        firebaseList.forEach(item => {
          if (!ids.has(item.id)) {
            blended.push(item);
          }
        });
      } catch (error) {
        console.warn('Error fetching registrations from Firebase (using local backup):', error);
      }
    }
    
    // Sort newest first
    return blended.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // SAVE Registration
  async saveRegistration(reg: Omit<AttendeeRegistration, 'id' | 'createdAt'>): Promise<AttendeeRegistration> {
    const newReg: AttendeeRegistration = {
      ...reg,
      id: `reg_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    // 1. Save to Google Sheets first (as the primary backend database!)
    try {
      await saveToGoogleSheets(newReg);
      console.log('Saved to Google Sheets successfully:', newReg.id);
    } catch (error: any) {
      console.error('Failed to save to Google Sheets:', error);
      throw new Error(error.message || 'Failed to save registration to Google Sheets database. Check your environment configuration.');
    }

    // 2. Save to LocalStorage to guarantee data preservation and offline speed
    const local = getLocalData<AttendeeRegistration[]>(STORAGE_REGISTRATIONS_KEY, []);
    local.push(newReg);
    saveLocalData(STORAGE_REGISTRATIONS_KEY, local);

    // 3. Optional: mirror to Firestore if active (for easy future migration!)
    if (useFirebase && db) {
      try {
        await setDoc(doc(db, 'registrations', newReg.id), newReg);
        console.log('Firebase registration mirrored successfully to registrations collection:', newReg.id);
      } catch (error) {
        console.warn('Firestore mirroring failed, but Google Sheets was successful:', error);
      }
    }

    return newReg;
  },

  // GET Vendors
  async getVendorApplications(): Promise<VendorApplication[]> {
    const local = getLocalData<VendorApplication[]>(STORAGE_VENDORS_KEY, []);
    let blended = [...local];

    if (useFirebase && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'vendors'));
        const firebaseList: VendorApplication[] = [];
        querySnapshot.forEach((docSnap) => {
          firebaseList.push({ id: docSnap.id, ...docSnap.data() } as VendorApplication);
        });
        
        const ids = new Set(local.map(v => v.id));
        firebaseList.forEach(item => {
          if (!ids.has(item.id)) {
            blended.push(item);
          }
        });
      } catch (error) {
        console.warn('Error fetching vendor applications from Firebase:', error);
      }
    }
    return blended.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // SAVE Vendor Application
  async saveVendorApplication(vendor: Omit<VendorApplication, 'id' | 'createdAt'>): Promise<VendorApplication> {
    const newVendor: VendorApplication = {
      ...vendor,
      id: `vendor_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    // ALWAYS save locally first
    const local = getLocalData<VendorApplication[]>(STORAGE_VENDORS_KEY, []);
    local.push(newVendor);
    saveLocalData(STORAGE_VENDORS_KEY, local);

    if (useFirebase && db) {
      try {
        await setDoc(doc(db, 'vendors', newVendor.id), newVendor);
        console.log('Firebase vendor application saved successfully:', newVendor.id);
      } catch (error) {
        console.error('Firestore Error saving vendor, fallback to local retention:', error);
      }
    }

    return newVendor;
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
        console.warn('Error fetching subscribers from Firebase:', error);
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
      try {
        await setDoc(doc(db, 'subscribers', newSub.id), newSub);
        console.log('Firebase subscription saved successfully:', newSub.id);
      } catch (error) {
        console.error('Firestore Error saving subscription, fallback to local retention:', error);
      }
    }

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
        handleFirestoreError(error, OperationType.GET, 'analytics/dashboard');
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
        console.warn('Error fetching concept comments from Firebase:', error);
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
      try {
        await setDoc(doc(db, 'comments', newComment.id), newComment);
        console.log('Firebase brand/concept comment saved successfully:', newComment.id);
      } catch (error) {
        console.error('Firestore Error saving comment, fallback to local retention:', error);
      }
    }

    return newComment;
  }
};
