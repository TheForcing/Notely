// src/hooks/useNotes.js
import { useEffect, useState, useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { startUploadUserFile } from "../firebase";
import {
  addFileToQueue,
  getPendingFiles,
  removeFileFromQueue,
  markFileStatus,
  getAllFiles,
  setFilePriority,
} from "../utils/idbQueue";

const STORAGE_KEY = "notely_notes_v2";
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function saveJSON(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch (e) {}
}

const CHANNEL_NAME = "notely-file-queue";

export default function useNotes() {
  const [notes, setNotes] = useState(() => loadJSON(STORAGE_KEY, []));
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id || null);
  const [queueFiles, setQueueFiles] = useState([]);
  const [queueProgress, setQueueProgress] = useState({}); // { id: { pct, bytesTransferred, totalBytes, speedBytesPerSec, etaSec } }
  const [globalAvgSpeed, setGlobalAvgSpeed] = useState(0); // bytes/sec observed across uploads (EMA)
  const userRef = useRef(null);
  const unsubSnapshotRef = useRef(null);
  const processingRef = useRef(false);
  const MAX_ATTEMPTS = 5;
  const bcRef = useRef(null);

  useEffect(() => saveJSON(STORAGE_KEY, notes), [notes]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      userRef.current = u;
      if (u) {
        attachFirestoreListener(u.uid);
        refreshQueue();
        processFileQueue();
      } else {
        detachFirestoreListener();
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const onOnline = () => {
      if (userRef.current) processFileQueue();
      refreshQueue();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  useEffect(() => {
    try {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (ev) => {
        if (ev?.data?.type === "queue-updated") {
          refreshQueue();
        }
      };
      bcRef.current = bc;
      return () => {
        bc.close();
        bcRef.current = null;
      };
    } catch (e) {
      console.warn("BroadcastChannel not available", e);
    }
  }, []);

  const refreshQueue = useCallback(async () => {
    try {
      const all = await getAllFiles();
      setQueueFiles(all);
    } catch (e) {
      console.warn("refreshQueue failed", e);
    }
  }, []);

  const attachFirestoreListener = (uid) => {
    try {
      const q = query(
        collection(db, "users", uid, "notes"),
        orderBy("updatedAt", "desc")
      );
      if (unsubSnapshotRef.current) unsubSnapshotRef.current();
      unsubSnapshotRef.current = onSnapshot(q, (snap) => {
        const cloud = snap.docs.map((d) => d.data());
        setNotes((prev) => {
          const map = new Map(prev.map((n) => [n.id, n]));
          cloud.forEach((c) => {
            const local = map.get(c.id);
            if (!local) map.set(c.id, c);
            else if ((c.updatedAt || 0) > (local.updatedAt || 0))
              map.set(c.id, c);
          });
          return Array.from(map.values()).sort(
            (a, b) =>
              (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
              (b.updatedAt || 0) - (a.updatedAt || 0)
          );
        });
      });
    } catch (e) {
      console.error("attach listener", e);
    }
  };
  const detachFirestoreListener = () => {
    if (unsubSnapshotRef.current) {
      unsubSnapshotRef.current();
      unsubSnapshotRef.current = null;
    }
  };

  const createNote = useCallback(async () => {
    const newNote = {
      id: nanoid(),
      title: "Untitled",
      body: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      pinned: false,
      attachments: [],
    };
    setNotes((prev) => [newNote, ...prev]);
    const user = userRef.current;
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "notes", newNote.id), newNote);
      } catch (e) {
        console.warn("create remote failed", e);
      }
    }
    return newNote;
  }, []);

  const updateNote = useCallback(async (id, patch) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
      )
    );
    const user = userRef.current;
    const toWrite = { id, ...patch, updatedAt: Date.now() };
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "notes", id), toWrite);
      } catch (e) {
        console.warn("update remote failed", e);
      }
    }
  }, []);

  const deleteNote = useCallback(async (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    const user = userRef.current;
    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "notes", id));
      } catch (e) {
        console.warn("delete remote failed", e);
      }
    }
  }, []);

  const addAttachmentMeta = useCallback(
    async (noteId, meta) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                attachments: [...(n.attachments || []), meta],
                updatedAt: Date.now(),
              }
            : n
        )
      );
      const user = userRef.current;
      if (user) {
        try {
          await setDoc(
            doc(db, "users", user.uid, "notes", noteId),
            notes.find((n) => n.id === noteId)
          );
        } catch (e) {
          console.warn("addAttachmentMeta: remote update failed", e);
        }
      }
    },
    [notes]
  );

  const enqueueFile = useCallback(
    async (noteId, file, priority = 0) => {
      const id =
        Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
      await addFileToQueue({
        id,
        noteId,
        name: file.name,
        type: file.type,
        size: file.size,
        blob: file,
        priority,
      });
      await refreshQueue();
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                attachments: [
                  ...(n.attachments || []),
                  { name: file.name, pending: true, id },
                ],
              }
            : n
        )
      );
      return id;
    },
    [refreshQueue]
  );

  // process queue with speed & ETA tracking
  const processFileQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const user = userRef.current;
      if (!user || !navigator.onLine) return;
      const pending = await getPendingFiles(100); // already ordered by priority
      for (const p of pending) {
        try {
          if ((p.attempts || 0) >= MAX_ATTEMPTS) {
            await markFileStatus(p.id, "failed");
            continue;
          }
          await markFileStatus(p.id, "processing");

          // prepare per-file speed estimation
          let lastTime = Date.now();
          let lastBytes = 0;
          // set initial progress
          setQueueProgress((prev) => ({
            ...prev,
            [p.id]: {
              pct: 0,
              bytesTransferred: 0,
              totalBytes: p.size || 0,
              speedBytesPerSec: 0,
              etaSec: null,
            },
          }));

          const { finished } = startUploadUserFile(
            user.uid,
            p.noteId,
            p.blob,
            (info) => {
              // info: { pct, bytesTransferred, totalBytes }
              const now = Date.now();
              const dt = Math.max(1, now - lastTime) / 1000; // seconds
              const bytes = info.bytesTransferred || 0;
              const delta = bytes - lastBytes;
              const instantSpeed = delta > 0 ? delta / dt : 0; // bytes/sec
              lastTime = now;
              lastBytes = bytes;

              // update global average speed (EMA)
              setGlobalAvgSpeed((prev) => {
                const alpha = 0.25;
                const next =
                  prev <= 0
                    ? instantSpeed
                    : alpha * instantSpeed + (1 - alpha) * prev;
                return next;
              });

              // estimate ETA
              const totalBytes = info.totalBytes || p.size || 0;
              const remaining = Math.max(0, totalBytes - bytes);
              // choose speed: prefer instantSpeed, fallback to globalAvgSpeed
              const speed =
                instantSpeed > 50
                  ? instantSpeed
                  : globalAvgSpeed > 0
                  ? globalAvgSpeed
                  : instantSpeed;
              const etaSec = speed > 0 ? Math.ceil(remaining / speed) : null;

              setQueueProgress((prev) => ({
                ...prev,
                [p.id]: {
                  pct: info.pct,
                  bytesTransferred: bytes,
                  totalBytes,
                  speedBytesPerSec: speed,
                  etaSec,
                },
              }));
            }
          );

          const meta = await finished;
          // on success: remove from queue & attach
          await addAttachmentMeta(p.noteId, meta);
          await removeFileFromQueue(p.id);
          setQueueProgress((prev) => {
            const c = { ...prev };
            delete c[p.id];
            return c;
          });
          await refreshQueue();
        } catch (e) {
          console.error("file queue upload failed", p.id, e);
          await markFileStatus(p.id, "error");
          // backoff
          const all = await getAllFiles();
          const rec = all.find((r) => r.id === p.id) || p;
          const attempts = rec.attempts || 0;
          const delay = Math.min(30000, Math.pow(2, attempts) * 1000);
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    } catch (e) {
      console.error("processFileQueue", e);
    }
    processingRef.current = false;
  }, [addAttachmentMeta, refreshQueue, globalAvgSpeed]);

  // estimate ETA helper for items not yet started
  const estimateEtaForPending = useCallback(
    (item) => {
      const size = item.size || 0;
      const speed = globalAvgSpeed || 50; // fallback minimal speed (bytes/sec)
      if (!size || !speed) return null;
      return Math.ceil(size / speed);
    },
    [globalAvgSpeed]
  );

  // reorderQueue (for drag & drop): assign new priorities
  const reorderQueue = useCallback(
    async (orderedIds) => {
      try {
        const max = orderedIds.length;
        for (let i = 0; i < orderedIds.length; i++) {
          const id = orderedIds[i];
          const priority = max - i;
          await setFilePriority(id, priority);
        }
        await refreshQueue();
      } catch (e) {
        console.warn("reorderQueue failed", e);
      }
    },
    [refreshQueue]
  );

  // move up/down, retry, remove (unchanged)
  const moveQueuedFileUp = useCallback(
    async (id) => {
      try {
        const all = await getAllFiles();
        const item = all.find((x) => x.id === id);
        if (!item) return;
        const maxPriority = Math.max(0, ...all.map((x) => x.priority || 0));
        const newPriority =
          (item.priority || 0) >= maxPriority
            ? (item.priority || 0) + 1
            : (item.priority || 0) + 1;
        await setFilePriority(id, newPriority);
        await refreshQueue();
      } catch (e) {
        console.warn("moveQueuedFileUp", e);
      }
    },
    [refreshQueue]
  );

  const moveQueuedFileDown = useCallback(
    async (id) => {
      try {
        const newPriority =
          (await getAllFiles()).find((x) => x.id === id)?.priority - 1 || -1;
        await setFilePriority(id, newPriority);
        await refreshQueue();
      } catch (e) {
        console.warn("moveQueuedFileDown", e);
      }
    },
    [refreshQueue]
  );

  const retryQueuedFile = useCallback(
    async (id) => {
      try {
        await markFileStatus(id, "pending");
        await refreshQueue();
        processFileQueue();
      } catch (e) {
        console.warn("retryQueuedFile", e);
      }
    },
    [processFileQueue, refreshQueue]
  );

  const removeQueuedFile = useCallback(
    async (id) => {
      try {
        await removeFileFromQueue(id);
        await refreshQueue();
      } catch (e) {
        console.warn("removeQueuedFile", e);
      }
    },
    [refreshQueue]
  );

  return {
    notes,
    rawNotes: notes,
    createNote,
    updateNote,
    deleteNote,
    addAttachmentMeta,
    enqueueFile,
    activeNoteId,
    setActiveNoteId,
    processFileQueue,
    queueFiles,
    queueProgress,
    refreshQueue,
    retryQueuedFile,
    removeQueuedFile,
    moveQueuedFileUp,
    moveQueuedFileDown,
    reorderQueue,
    estimateEtaForPending,
    globalAvgSpeed,
  };
}
