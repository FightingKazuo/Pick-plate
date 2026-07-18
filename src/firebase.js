import { initializeApp } from 'firebase/app'
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'

// ========================================================
// ① Firebase コンソール > プロジェクト設定 > アプリ追加 で
//    取得した値をここに貼り付けてください
// ========================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// ルームデータの参照
export const roomRef = (roomCode) => doc(db, 'rooms', roomCode)

// ルームデータを保存
export const saveRoom = async (roomCode, data) => {
  await setDoc(roomRef(roomCode), data, { merge: true })
}

// ルームの存在確認
export const checkRoom = async (roomCode) => {
  const snap = await getDoc(roomRef(roomCode))
  return snap.exists()
}

// リアルタイム購読
export const subscribeRoom = (roomCode, callback) => {
  return onSnapshot(roomRef(roomCode), (snap) => {
    if (snap.exists()) callback(snap.data())
  })
}
