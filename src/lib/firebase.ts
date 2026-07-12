// src/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// ---------------------------------------------------------------------------
// Initialise Firebase (guard against hot-reload double-init in Vite dev mode)
// ---------------------------------------------------------------------------
const app: FirebaseApp  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth        = getAuth(app);
const db: Firestore     = getFirestore(app);

export { app, auth, db };

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Register a new user with email + password.
 *
 * @param email    - The user's email address.
 * @param password - The user's chosen password (min 6 chars enforced by Firebase).
 * @returns        The Firebase UserCredential for the newly created account.
 *
 * @throws {FirebaseError} e.g. auth/email-already-in-use, auth/weak-password
 *
 * @example
 * const { user } = await registerUser('ada@playfest.bw', 's3cr3tP@ss');
 * console.log('New UID:', user.uid);
 */
export async function registerUser(
  email: string,
  password: string,
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential;
}

/**
 * Sign in an existing user with email + password.
 *
 * @param email    - The user's email address.
 * @param password - The user's password.
 * @returns        The Firebase UserCredential for the authenticated session.
 *
 * @throws {FirebaseError} e.g. auth/user-not-found, auth/wrong-password
 *
 * @example
 * const { user } = await loginUser('ada@playfest.bw', 's3cr3tP@ss');
 * console.log('Logged in as:', user.email);
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<UserCredential> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential;
}

/**
 * Sign out the currently authenticated user.
 *
 * @example
 * await logoutUser();
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}