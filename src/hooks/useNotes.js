\
import { useEffect, useState, useCallback, useRef } from 'react'
import { nanoid } from 'nanoid'
import { db } from '../firebase'
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { uploadUserFile, deleteUserFile } from '../firebase'

const STORAGE_KEY = 'notely_notes_v2'
function loadJSON(key, fallback){ try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback }catch(e){ return fallback } }
function saveJSON(key, v){ try{ localStorage.setItem(key, JSON.stringify(v)) }catch(e){} }

export default function useNotes(){
  const [notes, setNotes] = useState(() => loadJSON(STORAGE_KEY, []))
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id || null)
  const queueRef = useRef([])
  const userRef = useRef(null)
  const unsubSnapshotRef = useRef(null)

  useEffect(()=> saveJSON(STORAGE_KEY, notes), [notes])

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u) => {
      userRef.current = u
      if(u){ attachFirestoreListener(u.uid) }
      else { detachFirestoreListener() }
    })
    return () => unsub()
  }, [])

  const attachFirestoreListener = (uid)=>{
    try{
      const q = query(collection(db, 'users', uid, 'notes'), orderBy('updatedAt','desc'));
      if(unsubSnapshotRef.current) unsubSnapshotRef.current();
      unsubSnapshotRef.current = onSnapshot(q, snap => {
        const cloud = snap.docs.map(d => d.data());
        setNotes(prev => {
          const map = new Map(prev.map(n=>[n.id,n]));
          cloud.forEach(c => {
            const local = map.get(c.id);
            if(!local) map.set(c.id, c);
            else if((c.updatedAt||0) > (local.updatedAt||0)) map.set(c.id, c);
          });
          return Array.from(map.values()).sort((a,b)=> (b.pinned?1:0)-(a.pinned?1:0) || (b.updatedAt||0)-(a.updatedAt||0))
        })
      })
    }catch(e){ console.error('attach listener', e) }
  }
  const detachFirestoreListener = ()=>{ if(unsubSnapshotRef.current){ unsubSnapshotRef.current(); unsubSnapshotRef.current = null } }

  const createNote = useCallback(async () => {
    const newNote = { id: nanoid(), title: 'Untitled', body: '', createdAt: Date.now(), updatedAt: Date.now(), tags: [], pinned: false, attachments: [] };
    setNotes(prev=>[newNote, ...prev]);
    const user = userRef.current;
    if(user){
      try{ await setDoc(doc(db, 'users', user.uid, 'notes', newNote.id), newNote) }catch(e){ console.warn('create remote failed', e) }
    }
    return newNote
  }, [])

  const updateNote = useCallback(async (id, patch) => {
    setNotes(prev=>prev.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n));
    const user = userRef.current;
    const toWrite = { id, ...patch, updatedAt: Date.now() }
    if(user){
      try{ await setDoc(doc(db, 'users', user.uid, 'notes', id), toWrite) }catch(e){ console.warn('update remote failed', e) }
    }
  }, [])

  const deleteNote = useCallback(async (id) => {
    setNotes(prev=>prev.filter(n=>n.id!==id));
    const user = userRef.current;
    if(user){
      try{ await deleteDoc(doc(db, 'users', user.uid, 'notes', id)) }catch(e){ console.warn('delete remote failed', e) }
    }
  }, [])

  const uploadAttachment = useCallback(async (noteId, file, onProgress) => {
    const user = userRef.current;
    if(!user) throw new Error('login required to upload');
    const meta = await uploadUserFile(user.uid, noteId, file, onProgress);
    setNotes(prev=>prev.map(n=> n.id===noteId ? {...n, attachments: [...(n.attachments||[]), meta], updatedAt: Date.now()} : n));
    try{ await setDoc(doc(db, 'users', user.uid, 'notes', noteId), notes.find(n=>n.id===noteId)) }catch(e){ console.warn('upload: remote note update failed', e) }
    return meta
  }, [notes])

  const removeAttachment = useCallback(async (noteId, attachment) => {
    try{ await deleteUserFile(attachment.path) }catch(e){ console.warn('delete file may have failed', e) }
    setNotes(prev=>prev.map(n=> n.id===noteId ? {...n, attachments: (n.attachments||[]).filter(a=>a.path!==attachment.path), updatedAt: Date.now()} : n))
    const user = userRef.current;
    if(user){
      try{ await setDoc(doc(db, 'users', user.uid, 'notes', noteId), notes.find(n=>n.id===noteId)) }catch(e){ console.warn('removeAttachment: remote update failed', e) }
    }
  }, [notes])

  return { notes, rawNotes: notes, createNote, updateNote, deleteNote, uploadAttachment, removeAttachment, activeNoteId, setActiveNoteId }
}