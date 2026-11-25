import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const CAMPAIGN_COLLECTION = 'campaigns';
export const CAMPAIGN_DOC_ID = 'dasam-baby-venkatesh';
export const MEMBERS_SUBCOLLECTION = 'members';
export const CAMPAIGN_TITLE_TELUGU = 'దాసం బేబీ వెంకటేష్';

const DEVICE_ID_KEY = 'social_proof_device_id_v1';
const DEVICE_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

function readDeviceIdFromCookie(): string | null {
  try {
    const match = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${DEVICE_ID_KEY}=`));
    if (!match) return null;
    const value = decodeURIComponent(match.split('=')[1] || '');
    return DEVICE_ID_REGEX.test(value) ? value : null;
  } catch {
    return null;
  }
}

function writeDeviceIdCookie(deviceId: string) {
  try {
    document.cookie = `${DEVICE_ID_KEY}=${encodeURIComponent(
      deviceId
    )}; path=/; max-age=315360000; SameSite=Lax`;
  } catch {
    // Ignore cookie errors in restricted contexts
  }
}

function createFreshDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `dev_${crypto.randomUUID().replace(/-/g, '')}`;
  }
  const randomPart = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `dev_${randomPart}`.slice(0, 40);
}

export function getOrCreateDeviceId(): string {
  try {
    const stored = window.localStorage.getItem(DEVICE_ID_KEY);
    if (stored && DEVICE_ID_REGEX.test(stored)) {
      writeDeviceIdCookie(stored);
      return stored;
    }
  } catch {
    // Fall back to cookie
  }

  const fromCookie = readDeviceIdFromCookie();
  if (fromCookie) {
    try {
      window.localStorage.setItem(DEVICE_ID_KEY, fromCookie);
    } catch {
      // Ignore storage errors
    }
    return fromCookie;
  }

  const fresh = createFreshDeviceId();
  try {
    window.localStorage.setItem(DEVICE_ID_KEY, fresh);
  } catch {
    // Ignore storage errors
  }
  writeDeviceIdCookie(fresh);
  return fresh;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
