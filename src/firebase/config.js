import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyD-sydxNzEBWknmj5ylnKms7R2QePiWV9Y",
  authDomain: "claroscuro-style-3a9da.firebaseapp.com",
  projectId: "claroscuro-style-3a9da",
  storageBucket: "claroscuro-style-3a9da.firebasestorage.app",
  messagingSenderId: "488308302439",
  appId: "1:488308302439:web:3165b16b93ee81dacdeac2",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)