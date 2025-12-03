// src/utils/idbQueue.js
/**
 * IndexedDB helper for file queue with priority and BroadcastChannel sync.
 * DB: 'notely-db', store: 'fileQueue', keyPath: 'id'
 * Record: { id, noteId, name, type, size, blob, status, createdAt, attempts, priority }
 */

const CHANNEL_NAME = "notely-file-queue";

function broadcastQueueChange(detail = {}) {
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage({ type: "queue-updated", detail, ts: Date.now() });
    bc.close();
  } catch (e) {
    // BroadcastChannel not available in some environments (older browsers)
    console.warn("BroadcastChannel unavailable", e);
  }
}

export function openDB() {
  return new Promise((resolve, reject) => {
    const rq = indexedDB.open("notely-db", 1);
    rq.onupgradeneeded = () => {
      const db = rq.result;
      if (!db.objectStoreNames.contains("fileQueue")) {
        const store = db.createObjectStore("fileQueue", { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("priority", "priority", { unique: false });
      }
    };
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => reject(rq.error);
  });
}

export async function addFileToQueue({
  id,
  noteId,
  name,
  type,
  size,
  blob,
  priority = 0,
}) {
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
      priority,
    };
    const req = store.add(rec);
    req.onsuccess = () => {
      broadcastQueueChange({ action: "add", id: rec.id });
      resolve(rec);
    };
    req.onerror = () => reject(req.error);
  });
}

// Returns pending files sorted by priority desc then createdAt asc
export async function getPendingFiles(limit = 100) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fileQueue", "readonly");
    const store = tx.objectStore("fileQueue");
    const idx = store.index("status");
    const req = idx.openCursor("pending");
    const out = [];
    req.onsuccess = (e) => {
      const cur = e.target.result;
      if (cur && out.length < 1000) {
        out.push(cur.value);
        cur.continue();
      } else {
        // sort by priority desc, createdAt asc
        out.sort(
          (a, b) =>
            (b.priority || 0) - (a.priority || 0) ||
            (a.createdAt || 0) - (b.createdAt || 0)
        );
        resolve(out.slice(0, limit));
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAllFiles() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fileQueue", "readonly");
    const store = tx.objectStore("fileQueue");
    const req = store.getAll();
    req.onsuccess = () => {
      const res = req.result || [];
      // sort for UI (priority desc, createdAt asc)
      res.sort(
        (a, b) =>
          (b.priority || 0) - (a.priority || 0) ||
          (a.createdAt || 0) - (b.createdAt || 0)
      );
      resolve(res);
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
    req.onsuccess = () => {
      broadcastQueueChange({ action: "remove", id });
      resolve(true);
    };
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
      putReq.onsuccess = () => {
        broadcastQueueChange({ action: "update", id, status });
        resolve(rec);
      };
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function setFilePriority(id, priority) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fileQueue", "readwrite");
    const store = tx.objectStore("fileQueue");
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const rec = getReq.result;
      if (!rec) return resolve(null);
      rec.priority = priority;
      const putReq = store.put(rec);
      putReq.onsuccess = () => {
        broadcastQueueChange({ action: "priority", id, priority });
        resolve(rec);
      };
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}
