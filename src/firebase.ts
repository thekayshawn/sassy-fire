import { strings, BoolBacks, HttpServiceError } from "@sassy-js/utils";
import { FirebaseApp, initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import {
  User,
  Auth,
  signOut,
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInAnonymously,
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

      onFailure(decodeFireError(error));
    });
}

/**
 * Logs in a user with email and password.
 *
 * @param email User's email.
 * @param password User's password.
 * @param onSuccess Callback for when the user is successfully logged in.
 * @param onFailure Callback for when the user fails to log in.
 *
 * @returns void
 *
 * @example
 * ```ts
 * loginWithEmail({
 *  email: '...',
 *  password: '...',
 *  onSuccess: (user) => {
 *   console.log(user)
 *  },
 *  onFailure: (error) => {
 *   console.error(error)
 *  }
 * })
 */
export function loginWithEmail({
  email,
  password,
  onSuccess,
  onFailure,
}: {
  email: string;
  password: string;
} & BoolBacks<User>) {
  if (!isFirebaseSetup()) throwFirebaseSetupError();

  signInWithEmailAndPassword(firestoreAuth, email, password)
    .then((userCredential) => {
      onSuccess(userCredential.user);
    })
    .catch((error) => {
      console.error(error);

      onFailure(decodeFireError(error));
    });
}

export function loginAnonymously({ onSuccess, onFailure }: BoolBacks<User>) {
  if (!isFirebaseSetup()) throwFirebaseSetupError();

  signInAnonymously(firestoreAuth)
    .then((userCredential) => {
      onSuccess(userCredential.user);
    })
    .catch((error) => {
      console.error(error);

      onFailure(decodeFireError(error));
    });
}

export function logout({ onSuccess, onFailure }: BoolBacks<unknown>) {
  if (!isFirebaseSetup()) throwFirebaseSetupError();

  signOut(firestoreAuth)
    .then(() => onSuccess(undefined))
    .catch((error) => {
      console.error(error);

      onFailure(decodeFireError(error));
    });
}

export function observeUser({
  onLogin,
  onLogout,
}: {
  onLogin: (user: User) => unknown;
  onLogout: () => unknown;
}) {
  if (!isFirebaseSetup()) throwFirebaseSetupError();

  onAuthStateChanged(firestoreAuth, (user) => {
    // Logged in.
    if (user) {
      onLogin(user);
      return;
    }

    // Logged out.
    onLogout();
  });
}

export function decodeFireError(error: {
  code?: string;
  message?: string;
}): HttpServiceError {
  if (!error)
    return {
      error: "unknown",
      message: strings.DEFAULT_ERROR_MESSAGE,
    };

  const { code, message } = error;

  if (!code || !message)
    return {
      error: "unknown",
      message: strings.DEFAULT_ERROR_MESSAGE,
    };

  switch (code) {
    case "auth/invalid-email":
      return {
        error: code,
        message: "Invalid email address.",
      };
    case "auth/user-disabled":
      return {
        error: code,
        message: "This user has been disabled.",
      };
    case "auth/user-not-found":
      return {
        error: code,
        message: "This user does not exist.",
      };
    case "auth/wrong-password":
      return {
        error: code,
        message: "Incorrect password.",
      };
    default:
      return {
        error: code,
        message: strings.DEFAULT_ERROR_MESSAGE,
      };
  }
}
