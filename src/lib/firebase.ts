import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, FirestoreError } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Standard error logging for Firestore
export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: any, operationType: any, path: string | null = null): never {
  const authInfo = auth.currentUser ? {
    userId: auth.currentUser.uid,
    email: auth.currentUser.email,
    emailVerified: auth.currentUser.emailVerified,
    isAnonymous: auth.currentUser.isAnonymous,
    providerInfo: auth.currentUser.providerData
  } : 'Not Authenticated';

  const errorInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo
  };
  
  console.error("Firestore Error:", errorInfo);
  throw new Error(JSON.stringify(errorInfo));
}

// Connection test
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection verified");
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
        // This is expected if the test/connection doc doesn't exist or is locked
        console.log("Firestore connection reachable (Permission Denied as expected)");
    } else {
        console.error("Firestore connectivity issue:", error);
    }
  }
}

export type { FirebaseUser };
