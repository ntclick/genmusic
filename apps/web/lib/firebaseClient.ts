'use client'

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDYwYdU8W5ncQlkG_w3O88PqilK9c5t8E0',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'phonezoo-8941e.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'phonezoo-8941e',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'phonezoo-8941e.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '205560700984',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:205560700984:web:b6b8060e5e9843b79706cd',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-FHBX0GKRCF',
}

export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(firebaseApp)
export const firebaseDb = getFirestore(firebaseApp)
