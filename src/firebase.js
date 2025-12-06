// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Start upload and return { task, finished }.
 * onProgress will be invoked with { pct, bytesTransferred, totalBytes }.
 */
export function startUploadUserFile(uid, noteId, file, onProgress) {
  if (!uid)
    return { task: null, finished: Promise.reject(new Error("no uid")) };
  const path = `users/${uid}/attachments/${noteId}/${Date.now()}_${file.name}`;
  const r = storageRef(storage, path);
  const task = uploadBytesResumable(r, file);

  const finished = new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const bytesTransferred = snapshot.bytesTransferred || 0;
        const totalBytes = snapshot.totalBytes || file.size || 0;
        const pct = totalBytes > 0 ? (bytesTransferred / totalBytes) * 100 : 0;
        if (onProgress) {
          onProgress({ pct: Math.round(pct), bytesTransferred, totalBytes });
        }
      },
      (error) => {
        console.error("upload error", error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(r);
          resolve({
            path,
            url,
            name: file.name,
            size: file.size,
            contentType: file.type,
          });
        } catch (e) {
          reject(e);
        }
      }
    );
  });

  return { task, finished };
}

export async function deleteUserFile(path) {
  if (!path) throw new Error("no path");
  const r = storageRef(storage, path);
  await deleteObject(r);
}
export default app;
