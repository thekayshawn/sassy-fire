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
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateEmail,
  updatePassword,
  deleteUser as deleteFireUser,
  ActionCodeSettings,
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

/**
 * Registers a user with email and password.
 *
 * @param email User's email.
 * @param password User's password.
 * @param onSuccess Callback for when the user successfully registers.
 * @param onFailure Callback for when the user fails to register.
 *
 * @returns void
 *
 * @example
 * ```ts
 * registerWithEmail({
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
export function registerWithEmail({
  email,
  password,
  onSuccess,
  onFailure,
}: {
  email: string;
  password: string;
} & BoolBacks<User>) {
  if (!isFirebaseSetup()) throwFirebaseSetupError();

  createUserWithEmailAndPassword(firestoreAuth, email, password)
    .then((userCredential) => {
      onSuccess(userCredential.user);
    })
    .catch((error) => {
      console.error(error);
      onFailure(decodeFireError(error));
    });
}

/**
 * Sends a verification email to the user.
 *
 * @param email User's email.
 * @param onSuccess Callback for when the email is successfully sent.
 * @param onFailure Callback for when the email fails to send.
 * @param type Type of email to send.
 *
 * @returns void
 *
 * @example
 * ```ts
 * sendFireMail({
 *  email: '...',
 *  type: 'verification',
 *  onSuccess: () => {
 *    console.log('Email sent!')
 *  },
 *  onFailure: (error) => {
 *    console.error(error)
 *  }
 * })
 * ```
 */
export function sendMail({
  email,
  onSuccess,
  onFailure,
  type = "verification",
  ...actionCodeSettings
}: ActionCodeSettings &
  BoolBacks<unknown> & {
    email: string;
    redirectTo?: string;
    type: "verification" | "password-reset";
  }) {
  if (!isFirebaseSetup()) throwFirebaseSetupError();

  if (type === "verification" && firestoreAuth.currentUser) {
    sendEmailVerification(firestoreAuth.currentUser, actionCodeSettings)
      .then(onSuccess)
      .catch((error) => {
        console.error(error);
        onFailure(decodeFireError(error));
      });
    return;
  }

  if (type === "password-reset") {
    sendPasswordResetEmail(firestoreAuth, email, actionCodeSettings)
      .then(onSuccess)
      .catch((error) => {
        console.error(error);
        onFailure(decodeFireError(error));
      });
  }
}

/**
 * Updates the user's email and/or password.
 *
 * @param email User's email.
 * @param password User's password.
 * @param onSuccess Callback for when the user's credentials are successfully updated.
 * @param onFailure Callback for when the user's credentials fail to update.
 *
 * @returns void
 *
 * @example
 * ```ts
 * setCredentials({
 *  email: '...',
 *  password: '...',
 *  onSuccess: () => {
 *    console.log('Credentials updated!')
 *  },
 *  onFailure: (error) => {
 *    console.error(error)
 *  }
 * })
 * ```
 */
export function setCredentials({
  email,
  password,
  onSuccess,
  onFailure,
}: BoolBacks<unknown> & {
  email?: string;
  password?: string;
}) {
  if (!isFirebaseSetup()) throwFirebaseSetupError();
  const user = firestoreAuth.currentUser;

  // At least one of the two must be provided.
  if (!email && !password) throw new Error(strings.DEFAULT_ERROR_MESSAGE);

  // Must be logged in.
  if (!user) throw new Error(strings.DEFAULT_ERROR_MESSAGE);

  const onCatch = (error: any) => {
    console.error(error);
    onFailure(decodeFireError(error));
  };

  // Update both.
  if (email && password) {
    const emailPromise = updateEmail(user, email);
    const passwordPromise = updatePassword(user, password);

    Promise.all([emailPromise, passwordPromise]).then(onSuccess).catch(onCatch);
    return;
  }

  // Update one.
  if (email) {
    updateEmail(user, email).then(onSuccess).catch(onCatch);
  }

  // Update the other.
  if (password) {
    updatePassword(user, password).then(onSuccess).catch(onCatch);
  }
}

/**
 * Deletes the user's account.
 *
 * @param onSuccess Callback for when the user's account is successfully deleted.
 * @param onFailure Callback for when the user's account fails to delete.
 *
 * @returns void
 *
 * @example
 * ```ts
 * deleteUser({
 *  onSuccess: () => {
 *    console.log('User deleted!')
 *  },
 *  onFailure: (error) => {
 *    console.error(error)
 *  }
 * })
 * ```
 */
export function deleteUser({ onSuccess, onFailure }: BoolBacks<unknown>) {
  if (!isFirebaseSetup()) throwFirebaseSetupError();

  if (!firestoreAuth.currentUser)
    throw new Error(strings.DEFAULT_ERROR_MESSAGE);

  deleteFireUser(firestoreAuth.currentUser)
    .then(onSuccess)
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
    case "auth/email-already-in-use":
      return {
        error: code,
        message: "This email is already in use.",
      };
    case "auth/popup-blocked":
      return {
        error: code,
        message: "Please allow popups to continue.",
      };
    default:
      return {
        error: code,
        message: strings.DEFAULT_ERROR_MESSAGE,
      };
  }
}
