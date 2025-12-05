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
  const [queueProgress, setQueueProgress] = useState({});
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

  // BroadcastChannel 구독: 다른 탭에서의 큐 변경을 실시간으로 반영
  useEffect(() => {
    try {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (ev) => {
        if (ev?.data?.type === "queue-updated") {
          // 간단히 전체 큐 리프레시
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

  // process queue (uses priority ordering from getPendingFiles)
  const processFileQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const user = userRef.current;
      if (!user || !navigator.onLine) return;
      const pending = await getPendingFiles(100);
      for (const p of pending) {
        try {
          if ((p.attempts || 0) >= MAX_ATTEMPTS) {
            await markFileStatus(p.id, "failed");
            continue;
          }
          await markFileStatus(p.id, "processing");
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
          setQueueProgress((prev) => {
            const c = { ...prev };
            delete c[p.id];
            return c;
          });
          await refreshQueue();
        } catch (e) {
          console.error("file queue upload failed", p.id, e);
          await markFileStatus(p.id, "error");
          // backoff based on attempts
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
  }, [addAttachmentMeta, refreshQueue]);

  // move queued item priority up (increase) or down (decrease)
  const moveQueuedFileUp = useCallback(
    async (id) => {
      try {
        const all = await getAllFiles();
        const item = all.find((x) => x.id === id);
        if (!item) return;
        // increase priority by 1 (or set to max+1)
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
        const all = await getAllFiles();
        const item = all.find((x) => x.id === id);
        if (!item) return;
        // decrease priority by 1 (not less than -1000000)
        const newPriority = (item.priority || 0) - 1;
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
  const reorderQueue = useCallback(
    async (orderedIds) => {
      try {
        // orderedIds: [id1, id2, ...] — 맨 앞이 가장 높은 우선순위
        // assign descending priority (e.g. start from length -> 1)
        const max = orderedIds.length;
        for (let i = 0; i < orderedIds.length; i++) {
          const id = orderedIds[i];
          const priority = max - i; // 맨 앞(0)은 max, 뒤로 갈수록 작아짐
          await setFilePriority(id, priority);
        }
        // 우선순위 재할당 후 큐 갱신
        await refreshQueue();
      } catch (e) {
        console.warn("reorderQueue failed", e);
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
    reorderQueue, // <-- 추가
  };
}
