/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
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
import { AttendeeRegistration, VendorApplication, NewsletterSubscriber, AppAnalytics } from '../types';
import { generateSeedData } from '../mockData';

// 1. Initialize Firebase safely
const isPlaceholder = !firebaseConfig || firebaseConfig.apiKey.includes('placeholder') || firebaseConfig.apiKey === '';

let app;
let db: any = null;
let auth: any = null;
let useFirebase = false;

if (!isPlaceholder) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
  const resetDone = localStorage.getItem('playfest_zero_reset_v4');
  if (!resetDone) {
    saveLocalData(STORAGE_REGISTRATIONS_KEY, []);
    saveLocalData(STORAGE_VENDORS_KEY, []);
    saveLocalData(STORAGE_SUBSCRIBERS_KEY, []);
    
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
    localStorage.setItem('playfest_zero_reset_v4', 'true');
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

// 4. Verification Check
async function testConnection() {
  if (!useFirebase || !db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Tested Firestore server connection: OK');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline. Falling back to local replication.");
    }
  }
}
testConnection();

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
    if (useFirebase && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'registrations'));
        const list: AttendeeRegistration[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as AttendeeRegistration);
        });
        // Sort newest first
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'registrations');
      }
    }
    // Storage Fallback
    const local = getLocalData<AttendeeRegistration[]>(STORAGE_REGISTRATIONS_KEY, []);
    return local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // SAVE Registration
  async saveRegistration(reg: Omit<AttendeeRegistration, 'id' | 'createdAt'>): Promise<AttendeeRegistration> {
    const newReg: AttendeeRegistration = {
      ...reg,
      id: `reg_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    if (useFirebase && db) {
      try {
        await setDoc(doc(db, 'registrations', newReg.id), newReg);
        // Also update local copy for seamless blended storage
        const local = getLocalData<AttendeeRegistration[]>(STORAGE_REGISTRATIONS_KEY, []);
        local.push(newReg);
        saveLocalData(STORAGE_REGISTRATIONS_KEY, local);
        return newReg;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `registrations/${newReg.id}`);
      }
    }

    // Local Storage save
    const local = getLocalData<AttendeeRegistration[]>(STORAGE_REGISTRATIONS_KEY, []);
    local.push(newReg);
    saveLocalData(STORAGE_REGISTRATIONS_KEY, local);
    return newReg;
  },

  // GET Vendors
  async getVendorApplications(): Promise<VendorApplication[]> {
    if (useFirebase && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'vendors'));
        const list: VendorApplication[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as VendorApplication);
        });
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'vendors');
      }
    }
    const local = getLocalData<VendorApplication[]>(STORAGE_VENDORS_KEY, []);
    return local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // SAVE Vendor Application
  async saveVendorApplication(vendor: Omit<VendorApplication, 'id' | 'createdAt'>): Promise<VendorApplication> {
    const newVendor: VendorApplication = {
      ...vendor,
      id: `vendor_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    if (useFirebase && db) {
      try {
        await setDoc(doc(db, 'vendors', newVendor.id), newVendor);
        const local = getLocalData<VendorApplication[]>(STORAGE_VENDORS_KEY, []);
        local.push(newVendor);
        saveLocalData(STORAGE_VENDORS_KEY, local);
        return newVendor;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `vendors/${newVendor.id}`);
      }
    }

    const local = getLocalData<VendorApplication[]>(STORAGE_VENDORS_KEY, []);
    local.push(newVendor);
    saveLocalData(STORAGE_VENDORS_KEY, local);
    return newVendor;
  },

  // GET Newsletter Subscribers
  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    if (useFirebase && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'subscribers'));
        const list: NewsletterSubscriber[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as NewsletterSubscriber);
        });
        return list;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'subscribers');
      }
    }
    return getLocalData<NewsletterSubscriber[]>(STORAGE_SUBSCRIBERS_KEY, []);
  },

  // SUBSCRIBE to Newsletter
  async subscribeNewsletter(email: string): Promise<NewsletterSubscriber> {
    const newSub: NewsletterSubscriber = {
      id: `sub_${Math.random().toString(36).substring(2, 9)}`,
      email,
      createdAt: new Date().toISOString()
    };

    if (useFirebase && db) {
      try {
        await setDoc(doc(db, 'subscribers', newSub.id), newSub);
        const local = getLocalData<NewsletterSubscriber[]>(STORAGE_SUBSCRIBERS_KEY, []);
        local.push(newSub);
        saveLocalData(STORAGE_SUBSCRIBERS_KEY, local);
        return newSub;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `subscribers/${newSub.id}`);
      }
    }

    const local = getLocalData<NewsletterSubscriber[]>(STORAGE_SUBSCRIBERS_KEY, []);
    local.push(newSub);
    saveLocalData(STORAGE_SUBSCRIBERS_KEY, local);
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
  }
};
