/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, setDoc, getDoc, getDocs, getDocsFromServer, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AttendeeRegistration, NewsletterSubscriber, AppAnalytics, ConceptComment } from '../types';

const STORAGE_REGISTRATIONS_KEY = 'playfest_registrations';
const STORAGE_SUBSCRIBERS_KEY = 'playfest_subscribers';
const STORAGE_ANALYTICS_KEY = 'playfest_analytics';
const STORAGE_COMMENTS_KEY = 'playfest_comments';

function getLocalData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
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
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeededLocalData() {
  if (typeof window === 'undefined') return;
  const resetDone = localStorage.getItem('playfest_zero_reset_v5');
  if (!resetDone) {
    saveLocalData(STORAGE_REGISTRATIONS_KEY, []);
    saveLocalData(STORAGE_SUBSCRIBERS_KEY, []);
    saveLocalData(STORAGE_COMMENTS_KEY, []);
    
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
  }
}

if (typeof window !== 'undefined') {
  ensureSeededLocalData();
}

async function saveToGoogleSheets(newReg: AttendeeRegistration) {
  try {
    let ticketType = 'General Entry & Prize Draw';
    if (newReg.vipInterest === 'Yes' || newReg.vipInterest === 'Maybe') {
      ticketType = 'VIP Giveaway Entry & Priority Waitlist';
    } else if (newReg.earlyTicketAccess === 'Yes') {
      ticketType = 'Early Notification & Giveaway Entry';
    }

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
      country: newReg.country || 'Botswana',
      city: newReg.city || '',
      ageGroup: newReg.ageGroup || '',
      gender: newReg.gender || '',
      attendanceLikelihood: newReg.attendanceLikelihood || '',
      groupSize: newReg.groupSize || '',
      travelDistance: newReg.travelDistance || '',
      referralSource: newReg.referralSource || '',
      interests: Array.isArray(newReg.interests) ? newReg.interests.join(', ') : '',
      approximateSpend: newReg.approximateSpend || '',
      vipInterest: newReg.vipInterest || '',
      merchInterest: newReg.merchInterest || '',
      earlyTicketAccess: newReg.earlyTicketAccess || '',
      ticketType,
      carRegistration,
      gamingPlatform: newReg.gamingDetails?.platform || '',
      gamingFavoriteGames: newReg.gamingDetails?.favoriteGames || '',
      gamingParticipateInTournaments: newReg.gamingDetails?.participateInTournaments || '',
      gamingPreferredCategories: Array.isArray(newReg.gamingDetails?.preferredCategories) ? newReg.gamingDetails.preferredCategories.join(', ') : '',
      vehicleMake: newReg.carDetails?.vehicleMake || '',
      vehicleModel: newReg.carDetails?.vehicleModel || '',
      vehicleYear: newReg.carDetails?.year || '',
      vehicleBuildType: newReg.carDetails?.buildType || '',
      vehicleModifications: newReg.carDetails?.modifications || '',
      vehicleDisplayVehicle: newReg.carDetails?.displayVehicle || '',
      vehicleEnterCompetitions: newReg.carDetails?.enterCompetitions || '',
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
      console.warn('[Storage/Google Sheets] Backup endpoint returned non-ok status');
    } else {
      console.log('[Storage/Google Sheets] Registration backed up to Google Sheets successfully');
    }
  } catch (error: any) {
    console.warn('[Storage/Google Sheets] Failed to connect to Google Sheets backup endpoint:', error.message || error);
  }
}

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

let hasSynced = false;
async function syncLocalToFirebase() {
  if (!db || hasSynced) return;
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

if (db) {
  syncLocalToFirebase().catch(err => {
    console.warn('Sync fallback failed:', err);
  });
}

export const storage = {
  isRealFirebase(): boolean {
    return Boolean(db);
  },

  getAuth() {
    return auth;
  },

  getDb() {
    return db;
  },

  async getRegistrations(bypassCache = false): Promise<AttendeeRegistration[]> {
    const local = getLocalData<AttendeeRegistration[]>(STORAGE_REGISTRATIONS_KEY, []);
    const blendedMap = new Map<string, AttendeeRegistration>();

    const getKey = (r: AttendeeRegistration) => {
      if (r.id && !r.id.startsWith('reg_sheets_') && r.id !== 'Male' && r.id !== 'Female') {
        return r.id;
      }
      return r.email ? `email:${r.email.toLowerCase().trim()}` : (r.id || `reg_${Math.random()}`);
    };

    // 1. Add LocalStorage records
    for (const item of local) {
      if (item && (item.fullName || item.email)) {
        blendedMap.set(getKey(item), item);
      }
    }

    // 2. Add Google Sheets API records
    try {
      const response = await fetch(`/api/registrations${bypassCache ? '?bypassCache=true' : ''}`);
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data && data.success && Array.isArray(data.registrations)) {
            const sheetRegs = data.registrations as AttendeeRegistration[];
            for (const rawItem of sheetRegs) {
              if (rawItem && (rawItem.fullName || rawItem.email)) {
                const isCarReg = rawItem.carRegistration && !String(rawItem.carRegistration).toLowerCase().includes('no');
                const normalizedItem: AttendeeRegistration = {
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
          }
        }
      }
    } catch (error) {
      console.log('Error fetching registrations from Google Sheets API, falling back to LocalStorage:', error);
    }

    // 3. Add Firebase Firestore records
    if (db) {
      try {
        const querySnapshot = bypassCache
          ? await getDocsFromServer(collection(db, 'registrations'))
          : await getDocs(collection(db, 'registrations'));
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as AttendeeRegistration;
          const item = { id: docSnap.id, ...data };
          if (item && (item.fullName || item.email)) {
            const key = getKey(item);
            const existing = blendedMap.get(key);
            if (existing) {
              blendedMap.set(key, { ...existing, ...item });
            } else {
              blendedMap.set(key, item);
            }
          }
        });
      } catch (error) {
        console.warn('Error fetching registrations from Firebase, falling back to LocalStorage:', error);
      }
    }

    const blended = Array.from(blendedMap.values());
    return blended.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },

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

    // SAVE to Firebase if enabled
    if (db) {
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

  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    const local = getLocalData<NewsletterSubscriber[]>(STORAGE_SUBSCRIBERS_KEY, []);
    const blended = [...local];

    if (db) {
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

    if (db) {
      setDoc(doc(db, 'subscribers', newSub.id), newSub)
        .then(() => {
          console.log('Firebase subscription saved successfully:', newSub.id);
        })
        .catch((error) => {
          console.error('Firestore Error saving subscription:', error);
        });
    }

    // Backup to server-side proxy
    fetch('/api/backup-subscriber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub)
    }).catch(err => console.warn('Subscriber server backup failed:', err));

    // Send confirmation email
    sendConfirmationEmail('subscriber', newSub).catch(err => {
      console.warn('Confirmation email error:', err);
    });

    return newSub;
  },

  async getAnalytics(): Promise<AppAnalytics> {
    if (db) {
      try {
        const docRef = doc(db, 'analytics', 'dashboard');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as AppAnalytics;
        } else {
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

  async trackClick(buttonId: string): Promise<void> {
    const local = getLocalData<AppAnalytics>(STORAGE_ANALYTICS_KEY, {
      visitors: 0,
      clicks: {},
      deviceTypes: { mobile: 0, desktop: 0, tablet: 0 },
      trafficSources: {}
    });
    
    local.clicks[buttonId] = (local.clicks[buttonId] || 0) + 1;
    saveLocalData(STORAGE_ANALYTICS_KEY, local);

    if (db) {
      try {
        const docRef = doc(db, 'analytics', 'dashboard');
        await updateDoc(docRef, {
          [`clicks.${buttonId}`]: (local.clicks[buttonId] || 0)
        });
      } catch {
        // Soft fail
      }
    }
  },

  async trackVisit(): Promise<void> {
    if (typeof window === 'undefined') return;
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

    if (db) {
      try {
        const docRef = doc(db, 'analytics', 'dashboard');
        await setDoc(docRef, local);
      } catch {
        // Soft fail
      }
    }
  },

  async getConceptComments(): Promise<ConceptComment[]> {
    const local = getLocalData<ConceptComment[]>(STORAGE_COMMENTS_KEY, []);
    const blended = [...local];

    if (db) {
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

  async saveConceptComment(comment: Omit<ConceptComment, 'id' | 'createdAt'>): Promise<ConceptComment> {
    const newComment: ConceptComment = {
      ...comment,
      id: `comm_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    const local = getLocalData<ConceptComment[]>(STORAGE_COMMENTS_KEY, []);
    local.push(newComment);
    saveLocalData(STORAGE_COMMENTS_KEY, local);

    if (db) {
      setDoc(doc(db, 'comments', newComment.id), newComment)
        .then(() => {
          console.log('Firebase brand/concept comment saved successfully:', newComment.id);
        })
        .catch((error) => {
          console.error('Firestore Error saving comment:', error);
        });
    }

    // Backup to server-side Firestore proxy
    fetch('/api/backup-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComment)
    }).catch(err => console.warn('Comment server backup failed:', err));

    return newComment;
  },

  async saveFallbackCredential(email: string, password: string): Promise<void> {
    const key = 'playfest_fallback_credentials';
    const local = getLocalData<Record<string, string>>(key, {});
    local[email.trim().toLowerCase()] = password;
    saveLocalData(key, local);

    if (db) {
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

    if (db) {
      try {
        const docRef = doc(db, 'credentials', email.trim().toLowerCase());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data()?.password === password) {
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

  async resetRegistrations(): Promise<void> {
    saveLocalData(STORAGE_REGISTRATIONS_KEY, []);
    saveLocalData(STORAGE_SUBSCRIBERS_KEY, []);
    saveLocalData(STORAGE_COMMENTS_KEY, []);

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

    if (db) {
      const collections = ['registrations', 'subscribers', 'comments'];
      for (const colName of collections) {
        try {
          const qSnap = await getDocs(collection(db, colName));
          const deletePromises = qSnap.docs.map((docSnap) => deleteDoc(doc(db, colName, docSnap.id)));
          await Promise.all(deletePromises);
          console.log(`[Storage] Successfully cleared ${colName} in Firestore.`);
        } catch (err) {
          console.error(`[Storage] Failed to clear ${colName} in Firestore:`, err);
        }
      }
    }
  }
};
