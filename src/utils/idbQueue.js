// src/utils/idbQueue.js
/**
 * Minimal IndexedDB helper for file queue.
 * DB: 'notely-db', store: 'fileQueue', keyPath: 'id'
 * Record: { id, noteId, name, type, size, blob, status, createdAt, attempts }
 */

export function openDB() {
  return new Promise((resolve, reject) => {
    const rq = indexedDB.open("notely-db", 1);
    rq.onupgradeneeded = () => {
      const db = rq.result;
      if (!db.objectStoreNames.contains("fileQueue")) {
        const store = db.createObjectStore("fileQueue", { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => reject(rq.error);
  });
}

export async function addFileToQueue({ id, noteId, name, type, size, blob }) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fileQueue", "readwrite");
    const store = tx.objectStore("fileQueue");
    const rec = {
      id,
      noteId,
      name,
      type,
      size,
      blob,
      status: "pending",
      createdAt: Date.now(),
      attempts: 0,
    };
    const req = store.add(rec);
    req.onsuccess = () => resolve(rec);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingFiles(limit = 100) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fileQueue", "readonly");
    const store = tx.objectStore("fileQueue");
    if (!store.indexNames.contains("status")) return resolve([]);
    const idx = store.index("status");
    const req = idx.openCursor("pending");
    const out = [];
    req.onsuccess = (e) => {
      const cur = e.target.result;
      if (cur && out.length < limit) {
        out.push(cur.value);
        cur.continue();
      } else {
        resolve(out);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function removeFileFromQueue(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fileQueue", "readwrite");
    const store = tx.objectStore("fileQueue");
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function markFileStatus(id, status) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fileQueue", "readwrite");
    const store = tx.objectStore("fileQueue");
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const rec = getReq.result;
      if (!rec) return resolve(null);
      rec.status = status;
      if (status === "error") rec.attempts = (rec.attempts || 0) + 1;
      const putReq = store.put(rec);
      putReq.onsuccess = () => resolve(rec);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}
