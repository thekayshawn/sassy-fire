import strings from './strings'
import { initializeApp } from 'firebase/app'
import { BoolBacks, Channel, Message, NewMessage, SassyUser } from './types'
import {
  doc,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  collection,
  getFirestore,
  onSnapshot,
  Unsubscribe,
  addDoc,
  orderBy,
  getDoc,
} from 'firebase/firestore'
import {
  User,
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth'
import {
  isChannel,
  isMessage,
  parseChannelsFromDocs,
  parseMessagesFromDocs,
} from './utils'
import { getChannelUserFromUser } from './userConverter'

const firebaseConfig = {
  appId: import.meta.env.VITE_APP_ID,
  apiKey: import.meta.env.VITE_API_KEY,
  projectId: import.meta.env.VITE_PROJECT_ID,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const authProvider = new GoogleAuthProvider()
let unsubscribe: Unsubscribe

// Auth
export function loginWithGoogle({
  onFailure,
}: {
  onFailure: BoolBacks<SassyUser['data']>['onFailure']
}) {
  signInWithPopup(auth, authProvider)
    .then((result) => {
      const credentials = GoogleAuthProvider.credentialFromResult(result)

      if (!credentials) throw new Error(strings.DEFAULT_ERROR)
    })
    .catch((error) => {
      console.error(error)
      onFailure(strings.DEFAULT_ERROR)
    })
}

export function logout({
  onFailure,
}: {
  onFailure: BoolBacks<any>['onFailure']
}) {
  signOut(auth).catch((reason) => {
    console.error(reason)
    onFailure(strings.DEFAULT_ERROR)
  })
}

// Channels
export function addUserToGlobalChannel({
  user,
  onSuccess,
  onFailure,
}: { user: User } & BoolBacks<any>) {
  const globalChannelDoc = doc(db, 'channels', 'global')

  // Get the global channel.
  getDoc(globalChannelDoc).then((docSnapshot) => {
    const globalChannel: unknown = docSnapshot.data()

    // Type guard.
    if (isChannel(globalChannel)) {
      // If the user already exists.
      if (globalChannel.users[user.uid]) {
        onSuccess(true)
        return
      }

      // Otherwise, add the user.
      updateDoc(globalChannelDoc, {
        [`users.${user.uid}`]: getChannelUserFromUser(user),
      })
        .then(onSuccess)
        .catch((error) => {
          console.error(error)
          onFailure(strings.DEFAULT_ERROR)
        })

      return
    }

    console.error("TypeScriptError: doc isn't of type Channel")
    onFailure(strings.DEFAULT_ERROR)
  })
}

/**
 * Get the channels associated with a user.
 */
export function getUserChannels({
  user,
  onSuccess,
  onFailure,
}: { user: User } & BoolBacks<Channel[]>) {
  const channelsCollection = collection(db, 'channels')

  // Select channels where `users.uid` isn't empty.
  // In other words, channels with the current user in their users.
  const queryRef = query(
    channelsCollection,
    where(`users.${user.uid}`, '!=', '')
  )

  getDocs(queryRef)
    .then((docs) =>
      parseChannelsFromDocs({
        docs,
        onSuccess,
        onFailure,
      })
    )
    .catch((error) => {
      console.error(error)
      onFailure(strings.DEFAULT_ERROR)
    })
}

/**
 * Get messages of a channel.
 */
export function getChannelMessages({
  channel,
  onSuccess,
  onFailure,
}: {
  channel: Channel
} & BoolBacks<Message[]>) {
  const messagesCollection = collection(db, 'channels', channel.id, 'messages')

  getDocs(query(messagesCollection))
    .then((docs) =>
      parseMessagesFromDocs({
        docs,
        onSuccess,
        onFailure,
      })
    )
    .catch((error) => {
      console.error(error)
      onFailure(strings.DEFAULT_ERROR)
    })
}

/**
 * Add a message to a channel's message collection.
 */
export function sendMessageToChannel({
  channel,
  message,
  onSuccess,
  onFailure,
}: BoolBacks<any> & {
  message: NewMessage
  channel: Channel
}) {
  const messagesCollection = collection(db, 'channels', channel.id, 'messages')

  addDoc(messagesCollection, message)
    .then(onSuccess)
    .catch((error) => {
      console.error(error)
      onFailure(strings.DEFAULT_ERROR)
    })
}

/**
 * Subscribes to a channel for real-time updates.
 */
export function subscribeUserToChannel({
  user,
  channel,
  onSuccess,
  onFailure,
}: {
  user: User
  channel: Channel
} & BoolBacks<Message[]>) {
  const messagesCollection = collection(db, 'channels', channel.id, 'messages')

  const messagesQuery = query(
    messagesCollection,
    orderBy('createdAt'),
    where('createdAt', '>=', channel.users[user.uid].addedAt)
  )

  // Instantiate the listener on the messages collection.
  unsubscribe = onSnapshot(messagesQuery, (docs) => {
    parseMessagesFromDocs({
      docs,
      onSuccess,
      onFailure,
    })
  })
}

/**
 * Unsubscribes from a subscribed channel. Since multi-channel subscription
 * isn't yet supported, the default subscribed channel is unsubscribed from.
 */
export function unsubscribeFromChannel() {
  unsubscribe()
}
