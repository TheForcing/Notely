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

export default function useNotes() {
  const [notes, setNotes] = useState(() => loadJSON(STORAGE_KEY, []));
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id || null);
  const [queueFiles, setQueueFiles] = useState([]); // from IndexedDB
  const [queueProgress, setQueueProgress] = useState({}); // {id: pct}
  const userRef = useRef(null);
  const unsubSnapshotRef = useRef(null);
  const processingRef = useRef(false);
  const MAX_ATTEMPTS = 5;

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

  // load all queue items into memory for UI
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

  // enqueue file into IndexedDB
  const enqueueFile = useCallback(
    async (noteId, file) => {
      const id =
        Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
      await addFileToQueue({
        id,
        noteId,
        name: file.name,
        type: file.type,
        size: file.size,
        blob: file,
      });
      // update local queue UI
      await refreshQueue();
      // optional placeholder in notes
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

  // process queue with exponential backoff on errors
  const processFileQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const user = userRef.current;
      if (!user || !navigator.onLine) return;
      // get pending and error items that still are below max attempts
      const pending = await getPendingFiles(100);
      for (const p of pending) {
        try {
          // skip if too many attempts
          if ((p.attempts || 0) >= MAX_ATTEMPTS) {
            await markFileStatus(p.id, "failed");
            continue;
          }
          await markFileStatus(p.id, "processing");
          // reset progress
          setQueueProgress((prev) => ({ ...prev, [p.id]: 0 }));
          const { finished } = startUploadUserFile(
            user.uid,
            p.noteId,
            p.blob,
            (pct) => {
              setQueueProgress((prev) => ({ ...prev, [p.id]: pct }));
            }
          );
          const meta = await finished;
          await addAttachmentMeta(p.noteId, meta);
          await removeFileFromQueue(p.id);
          // refresh queue view & remove progress
          setQueueProgress((prev) => {
            const c = { ...prev };
            delete c[p.id];
            return c;
          });
          await refreshQueue();
        } catch (e) {
          console.error("file queue upload failed", p.id, e);
          await markFileStatus(p.id, "error");
          // exponential backoff: wait based on attempts before next overall loop
          const rec = await (async () => {
            const dbRes = await getAllFiles();
            return dbRes.find((r) => r.id === p.id);
          })();
          const attempts = rec && rec.attempts ? rec.attempts : p.attempts || 0;
          const delay = Math.min(30000, Math.pow(2, attempts) * 1000); // cap 30s
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    } catch (e) {
      console.error("processFileQueue", e);
    }
    processingRef.current = false;
  }, [addAttachmentMeta, refreshQueue]);

  // manual retry of a specific queued item
  const retryQueuedFile = useCallback(
    async (id) => {
      try {
        await markFileStatus(id, "pending");
        await refreshQueue();
        // try processing immediately
        processFileQueue();
      } catch (e) {
        console.warn("retryQueuedFile", e);
      }
    },
    [processFileQueue, refreshQueue]
  );

  // remove queued file (user wants to discard)
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

  // expose
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
  };
}
