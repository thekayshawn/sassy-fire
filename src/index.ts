import { strings, BoolBacks } from "@sassy-js/utils";
import { FirebaseApp, initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import {
  User,
  Auth,
  signOut,
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

// Initialization.
let firebaseApp: FirebaseApp;
let firestoreDb: Firestore;
let firestoreAuth: Auth;
const firestoreAuthProvider = new GoogleAuthProvider();

/**
 * Sets up the Firebase client.
 *
 * @param config Firebase config.
 *
 * @returns void
 *
 * @example
 * ```ts
 * setupFirebase({
 *  appId: '...',
 *  apiKey: '...',
 *  projectId: '...',
 *  authDomain: '...',
 *  measurementId: '...',
 *  storageBucket: '...',
 *  messagingSenderId: '...',
 * })
 * ```
 */
export function setupFirebase(config: {
  appId?: string;
  apiKey?: string;
  projectId?: string;
  authDomain?: string;
  measurementId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}) {
  // Initialize Firebase.
  firebaseApp = initializeApp(config);

  // Get the Firestore database and auth.
  firestoreDb = getFirestore(firebaseApp);
  firestoreAuth = getAuth(firebaseApp);

  // Return the Firestore essentials.
  return {
    firebaseApp,
    firestoreDb,
    firestoreAuth,
    firestoreAuthProvider,
  };
}

function throwFirebaseSetupError() {
  throw new Error(
    "SassyFireError: You must call setupFirebase() before using any other functions."
  );
}

function isFirebaseSetup() {
  return firebaseApp && firestoreDb && firestoreAuth;
}

/**
 * Logs in a user with Google's pre-built popup.
 *
 * @param onSuccess Callback for when the user is successfully logged in.
 * @param onFailure Callback for when the user fails to log in.
 *
 * @returns void
 *
 * @example
 * ```ts
 * loginWithGoogle({
 *  onSuccess: (user) => {
 *   console.log(user)
 *  },
 *  onFailure: (error) => {
 *   console.error(error)
 *  }
 * })
 * ```
 */
export function loginWithGoogle({ onSuccess, onFailure }: BoolBacks<User>) {
  if (!isFirebaseSetup()) throwFirebaseSetupError();

  signInWithPopup(firestoreAuth, firestoreAuthProvider)
    .then((result) => {
      const credentials = GoogleAuthProvider.credentialFromResult(result);

      if (!credentials) throw new Error(strings.DEFAULT_ERROR_MESSAGE);

      onSuccess(result.user);
    })
    .catch((error) => {
      console.error(error);

      onFailure({
        error,
        message: strings.DEFAULT_ERROR_MESSAGE,
      });
    });
}

export function logout({ onSuccess, onFailure }: BoolBacks<unknown>) {
  if (!isFirebaseSetup()) throwFirebaseSetupError();

  signOut(firestoreAuth)
    .then(() => onSuccess(undefined))
    .catch((reason) => {
      console.error(reason);

      onFailure({
        error: reason,
        message: strings.DEFAULT_ERROR_MESSAGE,
      });
    });
}
