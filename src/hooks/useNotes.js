// src/hooks/useNotes.js
import { useEffect, useState, useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import { db, auth } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const STORAGE_KEY = "notely_notes_v1";

export default function useNotes() {
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id || null);
  const [search, setSearch] = useState("");
  const userRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // save local on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {}
  }, [notes]);

  // listen to auth changes -> attach/detach firestore listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      userRef.current = user;
      if (user) {
        attachFirestoreListener(user.uid);
        // initial sync: upload local notes that are not in cloud or older
        await initialSyncToCloud(user.uid);
      } else {
        detachFirestoreListener();
      }
    });
    return () => unsubAuth();
  }, []);

  const attachFirestoreListener = (uid) => {
    try {
      const q = query(
        collection(db, "users", uid, "notes"),
        orderBy("updatedAt", "desc")
      );
      unsubscribeRef.current = onSnapshot(q, (snapshot) => {
        const cloud = snapshot.docs.map((d) => d.data());
        // merge cloud into local (by updatedAt)
        setNotes((prev) => {
          const map = new Map(prev.map((n) => [n.id, n]));
          cloud.forEach((c) => {
            const local = map.get(c.id);
            if (!local) map.set(c.id, c);
            else {
              // choose newest
              if ((c.updatedAt || 0) > (local.updatedAt || 0)) map.set(c.id, c);
            }
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
          );
          return merged;
        });
      });
    } catch (e) {
      console.error("attachFirestoreListener", e);
    }
  };

  const detachFirestoreListener = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  };

  const initialSyncToCloud = async (uid) => {
    try {
      // get cloud notes ids
      const snapshot = await getDocs(collection(db, "users", uid, "notes"));
      const cloudMap = new Map(snapshot.docs.map((d) => [d.id, d.data()]));
      // upload local notes that are missing or newer
      for (const local of notes) {
        const cloud = cloudMap.get(local.id);
        const docRef = doc(db, "users", uid, "notes", local.id);
        if (!cloud || (local.updatedAt || 0) > (cloud.updatedAt || 0)) {
          await setDoc(docRef, { ...local });
        }
      }
    } catch (e) {
      console.error("initialSyncToCloud", e);
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
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);

    // upload to cloud if logged in
    const user = userRef.current;
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "notes", newNote.id), newNote);
      } catch (e) {
        console.error(e);
      }
    }

    return newNote;
  }, []);

  const updateNote = useCallback(
    async (id, patch) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
        )
      );
      const user = userRef.current;
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid, "notes", id);
          // write entire note (simple strategy)
          const local = notes.find((n) => n.id === id);
          const toWrite = local
            ? { ...local, ...patch, updatedAt: Date.now() }
            : { id, ...patch, updatedAt: Date.now() };
          await setDoc(docRef, toWrite);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [notes]
  );

  const deleteNote = useCallback(async (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setActiveNoteId((prev) => (prev === id ? null : prev));
    const user = userRef.current;
    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "notes", id));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // filtered notes by search
  const filtered = notes.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (n.title + " " + n.body + " " + (n.tags || []).join(" "))
      .toLowerCase()
      .includes(q);
  });

  return {
    notes: filtered,
    rawNotes: notes,
    createNote,
    updateNote,
    deleteNote,
    activeNoteId,
    setActiveNoteId,
    search,
    setSearch,
  };
}
