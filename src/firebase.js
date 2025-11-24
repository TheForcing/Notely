import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD7eCak-Z2IWjFnX0evAEvSXy0MI6YrDUs",
  authDomain: "notely-c1ff3.firebaseapp.com",
  projectId: "notely-c1ff3",
  storageBucket: "notely-c1ff3.firebasestorage.app",
  messagingSenderId: "572116387362",
  appId: "1:572116387362:web:9784277d7d7dfe4f8bec7b",
  measurementId: "G-LE3VFSZLC2",
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function uploadUserFile(uid, noteId, file) {
  if (!uid) throw new Error("no uid");
  const path = `users/${uid}/attachments/${noteId}/${Date.now()}_${file.name}`;
  const r = storageRef(storage, path);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);
  return {
    path,
    url,
    name: file.name,
    size: file.size,
    contentType: file.type,
  };
}

export async function deleteUserFile(path) {
  const r = storageRef(storage, path);
  await deleteObject(r);
}
